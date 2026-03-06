"""
services/auth_service.py — User authentication business logic.

Handles: registration, login, password hashing, token creation, account deletion.
"""

from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status
import bcrypt

from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.utils.jwt_utils import create_access_token


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _format_user(user_doc: dict) -> UserResponse:
    """Convert MongoDB user document to UserResponse schema."""
    return UserResponse(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        email=user_doc["email"],
        created_at=user_doc["created_at"],
    )


async def register_user(data: UserCreate, db) -> TokenResponse:
    """
    Register a new user.
    Raises 409 if email already exists.
    """
    existing = await db["users"].find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": _hash_password(data.password),
        "created_at": datetime.now(timezone.utc),
        "data_retention_consent": False,
    }
    result = await db["users"].insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token(str(result.inserted_id), data.email)
    return TokenResponse(access_token=token, user=_format_user(user_doc))


async def login_user(data: UserLogin, db) -> TokenResponse:
    """
    Authenticate user and return JWT token.
    Raises 401 if credentials invalid.
    """
    user = await db["users"].find_one({"email": data.email})
    if not user or not _verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(str(user["_id"]), user["email"])
    return TokenResponse(access_token=token, user=_format_user(user))


async def delete_user_account(user_id: str, db) -> dict:
    """
    Permanently delete user and all associated data (resumes, sessions).
    """
    uid = ObjectId(user_id)
    await db["resumes"].delete_many({"user_id": uid})
    await db["sessions"].delete_many({"user_id": uid})
    await db["users"].delete_one({"_id": uid})
    return {"message": "Account and all associated data have been permanently deleted."}
