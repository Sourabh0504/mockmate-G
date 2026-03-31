"""
routes/admin.py — Admin API routes.

Routes protected by require_admin middleware.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.middleware.auth_middleware import get_current_user
from app.database import get_db
from app.services import admin_service

router = APIRouter()

def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency to enforce admin access."""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required."
        )
    return current_user

@router.get("/sessions", status_code=200)
async def list_all_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin_user: dict = Depends(require_admin),
    db=Depends(get_db),
):
    """List all sessions across all users (paginated)."""
    return await admin_service.list_all_sessions(skip, limit, db)

@router.get("/sessions/{session_id}", status_code=200)
async def get_admin_session(
    session_id: str,
    admin_user: dict = Depends(require_admin),
    db=Depends(get_db),
):
    """Get full session report including debug data."""
    return await admin_service.get_admin_session_report(session_id, db)
