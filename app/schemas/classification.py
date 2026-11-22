from enum import Enum

from pydantic import BaseModel, Field


class MessageCategory(str, Enum):
    SUPORTE_TECNICO = "suporte_tecnico"
    FINANCEIRO = "financeiro"
    COMERCIAL = "comercial"
    RECLAMACAO = "reclamacao"
    ELOGIO = "elogio"
    OUTROS = "outros"


class MessagePriority(str, Enum):
    ALTA = "alta"
    MEDIA = "media"
    BAIXA = "baixa"


class MessageSentiment(str, Enum):
    POSITIVO = "positivo"
    NEUTRO = "neutro"
    NEGATIVO = "negativo"


class MessageRequest(BaseModel):
    remetente: str | None = Field(
        default=None,
        description="Identificação opcional de quem enviou a mensagem.",
        examples=["cliente@exemplo.com"],
    )
    canal: str = Field(
        default="whatsapp",
        description="Canal de origem da mensagem (ex.: whatsapp, email, chat).",
        examples=["whatsapp"],
    )
    mensagem: str = Field(
        ...,
        min_length=3,
        max_length=4000,
        description="Texto da mensagem a classificar.",
        examples=["Não consigo emitir a segunda via da minha fatura e vence hoje!"],
    )


class ClassificationResponse(BaseModel):
    categoria: MessageCategory = Field(
        description="Categoria principal da mensagem."
    )
    prioridade: MessagePriority = Field(
        description="Nível de urgência para atendimento."
    )
    sentimento: MessageSentiment = Field(
        description="Sentimento predominante identificado na mensagem."
    )
    resumo: str = Field(
        description="Resumo objetivo do pedido ou problema numa só frase."
    )
    acao_sugerida: str = Field(
        description="Próximo passo recomendado para a equipe de atendimento."
    )
    confianca: float = Field(
        ge=0.0,
        le=1.0,
        description="Grau de confiança da classificação entre 0.0 e 1.0.",
    )