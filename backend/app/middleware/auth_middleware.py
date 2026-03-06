"""
middleware/auth_middleware.py — JWT authentication dependency.

Use `current_user = Depends(get_current_user)` in any protected route.
Returns the full user document from MongoDB.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.utils.jwt_utils import decode_access_token
from app.database import get_db

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db=Depends(get_db),
) -> dict:
    """
    Extract and validate JWT from Authorization header.
    Returns the user document from MongoDB.
    Raises 401 if token invalid or user not found.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")

    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Token may be stale.",
        )
    return user
