from collections.abc import Generator

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.routers.tickets import get_classifier_service
from app.schemas.classification import ClassificationResponse, MessageRequest


class FakeClassifierService:
    def classify_message(self, payload: MessageRequest) -> ClassificationResponse:
        return ClassificationResponse.model_validate(
            {
                "categoria": "financeiro",
                "prioridade": "alta",
                "sentimento": "negativo",
                "resumo": "Cliente relata problema para emitir a segunda via da fatura.",
                "acao_sugerida": "Enviar a segunda via da fatura por e-mail.",
                "confianca": 0.95,
            }
        )


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_classifier_service] = lambda: FakeClassifierService()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_fluxo_completo_auth_e_chamados(client: TestClient) -> None:
    # 1. Cadastro
    res_register = client.post(
        "/api/v1/auth/register",
        json={
            "nome": "Maria Silva",
            "email": "maria@exemplo.com",
            "senha": "senha123",
        },
    )
    assert res_register.status_code == 201
    assert res_register.json()["email"] == "maria@exemplo.com"

    # 2. Bloqueio de e-mail duplicado
    res_duplicado = client.post(
        "/api/v1/auth/register",
        json={
            "nome": "Maria Duplicada",
            "email": "maria@exemplo.com",
            "senha": "senha123",
        },
    )
    assert res_duplicado.status_code == 409

    # 3. Login e token JWT
    res_login = client.post(
        "/api/v1/auth/login",
        json={"email": "maria@exemplo.com", "senha": "senha123"},
    )
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Rota /me autenticada
    res_me = client.get("/api/v1/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["nome"] == "Maria Silva"

    # 5. Criar chamado com protocolo e roteamento
    res_ticket = client.post(
        "/api/v1/tickets",
        headers=headers,
        json={
            "canal": "web",
            "mensagem": "Não consigo emitir a segunda via da minha fatura!",
        },
    )
    assert res_ticket.status_code == 201
    ticket = res_ticket.json()
    protocolo = ticket["protocolo"]
    assert protocolo.startswith("CHM-")
    assert ticket["setor_destino"] == "Financeiro"
    assert ticket["fila_atendimento"] == "cobranca-e-faturamento"
    assert ticket["status"] == "aberto"

    # 6. Listar chamados do usuário
    res_list = client.get("/api/v1/tickets", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1
    assert res_list.json()[0]["protocolo"] == protocolo

    # 7. Consultar por protocolo e atualizar status
    res_get = client.get(f"/api/v1/tickets/{protocolo}", headers=headers)
    assert res_get.status_code == 200

    res_patch = client.patch(
        f"/api/v1/tickets/{protocolo}/status",
        headers=headers,
        json={"status": "em_andamento"},
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "em_andamento"


def test_rota_protegida_sem_token_retorna_erro(client: TestClient) -> None:
    res = client.get("/api/v1/tickets")
    assert res.status_code in (401, 403)