"""
models/user.py — Pydantic schemas for User.

UserCreate     → request body for registration
UserLogin      → request body for login
UserResponse   → safe user data returned to frontend (no password)
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdateVoice(BaseModel):
    voice: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    is_admin: bool = False
    preferred_voice: Optional[str] = "en-US-AndrewMultilingualNeural"

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
