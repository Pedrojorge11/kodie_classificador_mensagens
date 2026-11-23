from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    nome: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(..., min_length=6, max_length=72)


class UserLoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(..., min_length=1, max_length=72)


class UserResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    role: str
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UserResponse