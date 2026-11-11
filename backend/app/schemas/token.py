from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    preferred_language: str
    user_id: int
    full_name: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

