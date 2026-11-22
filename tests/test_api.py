from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.classification import (
    ClassificationResponse,
    MessageCategory,
    MessagePriority,
    MessageSentiment,
)

client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_classify_message_success() -> None:
    mock_result = ClassificationResponse(
        categoria=MessageCategory.FINANCEIRO,
        prioridade=MessagePriority.ALTA,
        sentimento=MessageSentiment.NEGATIVO,
        resumo="Cliente não consegue emitir a segunda via da fatura que vence hoje.",
        acao_sugerida="Enviar a segunda via do boleto imediatamente.",
        confianca=0.98,
    )

    with patch(
        "app.main.classifier_service.classify_message",
        return_value=mock_result,
    ):
        response = client.post(
            "/api/v1/classify",
            json={
                "remetente": "cliente@exemplo.com",
                "canal": "whatsapp",
                "mensagem": "Não consigo emitir a segunda via da minha fatura e vence hoje!",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["categoria"] == "financeiro"
    assert data["prioridade"] == "alta"
    assert data["sentimento"] == "negativo"
    assert data["confianca"] == 0.98


def test_classify_message_too_short() -> None:
    response = client.post(
        "/api/v1/classify",
        json={
            "canal": "whatsapp",
            "mensagem": "Oi",
        },
    )
    assert response.status_code == 422