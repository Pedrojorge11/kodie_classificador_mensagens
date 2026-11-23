from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 - garante o registro das tabelas no SQLAlchemy
from app.core.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.tickets import router as tickets_router
from app.schemas.classification import ClassificationResponse, MessageRequest
from app.services.gemini_service import GeminiClassifierService


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Classificador de Mensagens com IA - Helpdesk API",
    description="API em FastAPI integrada ao Google Gemini para classificação, autenticação JWT e gestão de chamados com protocolo único.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier_service = GeminiClassifierService()

app.include_router(auth_router)
app.include_router(tickets_router)


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