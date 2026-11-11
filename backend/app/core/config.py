import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SehatSetu (ਸਿਹਤ ਸੇਤੂ)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "sehatsetu_rural_punjab_secret_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7          # 7 days
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 30             # max auth requests per minute per IP
    
    # Database: Defaults to SQLite for local development & automated testing if Postgres is not specified
    DATABASE_URL: str = "sqlite:///./sehatsetu.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Nabha District Configuration
    DEFAULT_REGION: str = "Nabha, Patiala, Punjab"
    SUPPORTED_LANGUAGES: List[str] = ["pa", "hi", "en"]
    DEFAULT_LANGUAGE: str = "pa"  # Punjabi default for Nabha rural citizens
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
