import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    jwt_secret: str = secrets.token_hex(32)
    cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_prefix = "APP_"


settings = Settings()
