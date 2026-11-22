from google import genai
from google.genai import types

from app.core.config import settings
from app.prompts.classifier_prompt import SYSTEM_PROMPT
from app.schemas.classification import ClassificationResponse, MessageRequest


class GeminiClassifierService:
    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    def classify_message(self, payload: MessageRequest) -> ClassificationResponse:
        remetente = payload.remetente or "Não informado"
        user_content = (
            f"Canal: {payload.canal}\n"
            f"Remetente: {remetente}\n"
            f"Mensagem: {payload.mensagem}"
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ClassificationResponse,
                temperature=0.1,
            ),
        )

        if response.parsed is not None:
            return response.parsed

        if not response.text:
            raise ValueError("A API do Gemini retornou uma resposta vazia.")

        return ClassificationResponse.model_validate_json(response.text)