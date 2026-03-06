"""
utils/jwt_utils.py — JWT encode and decode helpers.

All JWT operations go through this module.
"""

from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.config import get_settings

settings = get_settings()


def create_access_token(user_id: str, email: str) -> str:
    """Create a signed JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Raises 401 HTTPException if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject.",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired.",
        )
