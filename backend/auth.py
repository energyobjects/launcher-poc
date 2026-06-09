import secrets
import threading
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel

from .config import settings

router = APIRouter(prefix="/auth")

_lock = threading.Lock()
_pending_token: Optional[str] = None

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60


def set_pending_token(token: str) -> None:
    global _pending_token
    with _lock:
        _pending_token = token


def _consume_pending_token(candidate: str) -> bool:
    global _pending_token
    with _lock:
        if _pending_token is None:
            return False
        valid = secrets.compare_digest(_pending_token, candidate)
        if valid:
            _pending_token = None
        return valid


def _create_jwt() -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": "local-user", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def verify_jwt(token: str) -> bool:
    try:
        jwt.decode(token, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
        return True
    except JWTError:
        return False


class TokenRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/token", response_model=TokenResponse)
def exchange_token(body: TokenRequest):
    if not _consume_pending_token(body.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or already-used token",
        )
    return TokenResponse(access_token=_create_jwt())
