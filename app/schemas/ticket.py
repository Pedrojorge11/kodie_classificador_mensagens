from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TicketStatus = Literal["aberto", "em_andamento", "resolvido", "fechado"]


class TicketCreateRequest(BaseModel):
    canal: str = Field(default="web", min_length=2, max_length=50)
    mensagem: str = Field(..., min_length=5)


class TicketStatusUpdateRequest(BaseModel):
    status: TicketStatus


class TicketResponse(BaseModel):
    id: int
    protocolo: str
    user_id: int
    canal: str
    remetente: str | None
    mensagem: str

    categoria: str
    prioridade: str
    sentimento: str
    resumo: str
    acao_sugerida: str
    confianca: float

    setor_destino: str
    fila_atendimento: str
    status: str

    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)