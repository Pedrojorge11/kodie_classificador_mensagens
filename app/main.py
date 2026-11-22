from fastapi import FastAPI, HTTPException, status

from app.schemas.classification import ClassificationResponse, MessageRequest
from app.services.gemini_service import GeminiClassifierService

app = FastAPI(
    title="Kodie - Classificador de Mensagens com IA",
    description="API em FastAPI integrada ao Google Gemini para triagem e classificação estruturada de mensagens.",
    version="1.0.0",
)

classifier_service = GeminiClassifierService()


@app.get("/health", tags=["Monitoramento"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/api/v1/classify",
    response_model=ClassificationResponse,
    status_code=status.HTTP_200_OK,
    tags=["Classificação"],
)
def classify_message(payload: MessageRequest) -> ClassificationResponse:
    try:
        return classifier_service.classify_message(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro ao classificar mensagem com o Gemini: {exc}",
        ) from exc