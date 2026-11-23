from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protocolo: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    canal: Mapped[str] = mapped_column(String(50), nullable=False)
    remetente: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mensagem: Mapped[str] = mapped_column(Text, nullable=False)

    # Resultado da IA (Gemini)
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)
    prioridade: Mapped[str] = mapped_column(String(30), nullable=False)
    sentimento: Mapped[str] = mapped_column(String(30), nullable=False)
    resumo: Mapped[str] = mapped_column(Text, nullable=False)
    acao_sugerida: Mapped[str] = mapped_column(Text, nullable=False)
    confianca: Mapped[float] = mapped_column(Float, nullable=False)

    # Roteamento e acompanhamento
    setor_destino: Mapped[str] = mapped_column(String(80), nullable=False)
    fila_atendimento: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="aberto", nullable=False)

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    usuario = relationship("User", back_populates="tickets")