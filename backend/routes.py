from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .auth import verify_jwt

router = APIRouter()
_bearer = HTTPBearer()


def require_auth(credentials: HTTPAuthorizationCredentials = Security(_bearer)) -> str:
    if not verify_jwt(credentials.credentials):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired JWT",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


@router.get("/dashboard")
def get_dashboard_data(token: str = Depends(require_auth)):
    return {
        "message": "You are authenticated.",
        "stats": {"uptime_seconds": 42, "version": "0.1.0"},
    }
