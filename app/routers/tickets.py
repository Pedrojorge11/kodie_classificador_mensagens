from datetime import datetime, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.classification import MessageRequest
from app.schemas.ticket import (
    TicketCreateRequest,
    TicketResponse,
    TicketStatus,
    TicketStatusUpdateRequest,
)
from app.services.gemini_service import GeminiClassifierService


router = APIRouter(
    prefix="/api/v1/tickets",
    tags=["Chamados"],
)


# Roteamento padrão para categorias não previstas.
ROTA_PADRAO: tuple[str, str] = (
    "Atendimento Geral",
    "triagem-humana",
)


# Mapeamento das categorias para os setores e filas do n8n.
ROTEAMENTO_POR_CATEGORIA: dict[str, tuple[str, str]] = {
    "financeiro": (
        "Financeiro",
        "cobranca-e-faturamento",
    ),
    "suporte_tecnico": (
        "Suporte Técnico",
        "chamados-tecnicos",
    ),
    "comercial": (
        "Comercial",
        "vendas-e-orcamentos",
    ),
    "reclamacao": (
        "Ouvidoria / Reclamações",
        "atendimento-prioritario",
    ),
    "elogio": (
        "Relacionamento (CS)",
        "feedbacks-positivos",
    ),
    "outros": ROTA_PADRAO,
}


_classifier_service: GeminiClassifierService | None = None


def get_classifier_service() -> GeminiClassifierService:
    global _classifier_service

    if _classifier_service is None:
        _classifier_service = GeminiClassifierService()

    return _classifier_service


def gerar_protocolo_unico(db: Session) -> str:
    data = datetime.now(timezone.utc).strftime("%Y%m%d")

    for _ in range(10):
        sufixo = secrets.token_hex(2).upper()
        protocolo = f"CHM-{data}-{sufixo}"

        existente = db.scalar(
            select(Ticket.id).where(Ticket.protocolo == protocolo)
        )

        if existente is None:
            return protocolo

    raise RuntimeError(
        "Não foi possível gerar um protocolo único."
    )


@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
    payload: TicketCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    classifier: GeminiClassifierService = Depends(get_classifier_service),
) -> Ticket:

    message_payload = MessageRequest(
        remetente=current_user.email,
        canal=payload.canal,
        mensagem=payload.mensagem,
    )

    try:
        classification = classifier.classify_message(
            message_payload
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Erro ao classificar mensagem com o Gemini.",
        ) from exc

    dados_ia = classification.model_dump(mode="json")

    categoria = str(dados_ia["categoria"])

    setor_destino, fila_atendimento = (
        ROTEAMENTO_POR_CATEGORIA.get(
            categoria,
            ROTA_PADRAO,
        )
    )

    ticket = Ticket(
        protocolo=gerar_protocolo_unico(db),
        user_id=current_user.id,
        canal=payload.canal,
        remetente=current_user.email,
        mensagem=payload.mensagem,
        categoria=categoria,
        prioridade=str(dados_ia["prioridade"]),
        sentimento=str(dados_ia["sentimento"]),
        resumo=str(dados_ia["resumo"]),
        acao_sugerida=str(dados_ia["acao_sugerida"]),
        confianca=float(dados_ia["confianca"]),
        setor_destino=setor_destino,
        fila_atendimento=fila_atendimento,
        status="aberto",
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


@router.get(
    "",
    response_model=list[TicketResponse],
    status_code=status.HTTP_200_OK,
)
def list_tickets(
    status_filter: TicketStatus | None = Query(
        default=None,
        alias="status",
    ),
    categoria: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Ticket]:

    stmt = select(Ticket).order_by(
        Ticket.criado_em.desc()
    )

    if current_user.role != "admin":
        stmt = stmt.where(
            Ticket.user_id == current_user.id
        )

    if status_filter:
        stmt = stmt.where(
            Ticket.status == status_filter
        )

    if categoria:
        stmt = stmt.where(
            Ticket.categoria == categoria
        )

    return list(db.scalars(stmt).all())


@router.get(
    "/{protocolo}",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
)
def get_ticket_by_protocolo(
    protocolo: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:

    ticket = db.scalar(
        select(Ticket).where(
            Ticket.protocolo == protocolo.strip().upper()
        )
    )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado para este protocolo.",
        )

    if (
        current_user.role != "admin"
        and ticket.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para visualizar este chamado.",
        )

    return ticket


@router.patch(
    "/{protocolo}/status",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
)
def update_ticket_status(
    protocolo: str,
    payload: TicketStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:

    ticket = db.scalar(
        select(Ticket).where(
            Ticket.protocolo == protocolo.strip().upper()
        )
    )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado para este protocolo.",
        )

    if (
        current_user.role != "admin"
        and ticket.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para atualizar este chamado.",
        )

    ticket.status = payload.status

    db.commit()
    db.refresh(ticket)

    return ticket