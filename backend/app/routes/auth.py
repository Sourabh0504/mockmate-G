"""
routes/auth.py — Authentication API routes.

Routes are thin — all logic delegated to auth_service.
"""

from fastapi import APIRouter, Depends
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdateVoice
from app.services import auth_service
from app.middleware.auth_middleware import get_current_user
from app.database import get_db

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db=Depends(get_db)):
    """Register a new user account."""
    return await auth_service.register_user(data, db)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db=Depends(get_db)):
    """Login and receive JWT access token."""
    return await auth_service.login_user(data, db)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return UserResponse(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"],
        is_admin=current_user.get("is_admin", False),
        preferred_voice=current_user.get("preferred_voice", "en-US-AndrewMultilingualNeural"),
    )


@router.patch("/voice", response_model=UserResponse)
async def update_voice(
    data: UserUpdateVoice,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Update user's preferred interviewer voice."""
    return await auth_service.update_user_voice(str(current_user["_id"]), data, db)


@router.delete("/account", status_code=200)
async def delete_account(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Permanently delete account and all associated data."""
    return await auth_service.delete_user_account(str(current_user["_id"]), db)
