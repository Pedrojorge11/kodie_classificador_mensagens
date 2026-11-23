from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticação"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)) -> User:
    email_normalizado = payload.email.lower().strip()
    existente = db.scalar(select(User).where(User.email == email_normalizado))
    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um usuário cadastrado com este e-mail.",
        )

    usuario = User(
        nome=payload.nome.strip(),
        email=email_normalizado,
        senha_hash=hash_password(payload.senha),
        role="cliente",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email_normalizado = payload.email.lower().strip()
    usuario = db.scalar(select(User).where(User.email == email_normalizado))

    if usuario is None or not verify_password(payload.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    token = create_access_token(
        user_id=usuario.id,
        email=usuario.email,
        role=usuario.role,
    )
    return TokenResponse(
        access_token=token,
        usuario=UserResponse.model_validate(usuario),
    )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user