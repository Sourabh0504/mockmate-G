"""
routes/sessions.py — Interview session API routes.

Routes are thin — all logic delegated to session_service.
"""

from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks, Body
from app.models.session import SessionCreate
from app.services import session_service
from app.middleware.auth_middleware import get_current_user
from app.database import get_db

router = APIRouter()


@router.get("/", status_code=200)
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """List all sessions for the authenticated user (LIFO order — newest first)."""
    return await session_service.list_sessions(str(current_user["_id"]), db)


@router.post("/", status_code=201)
async def create_session(
    data: SessionCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Create a new interview session.
    Returns immediately with status 'creating'.
    Question bank generation runs in the background.
    """
    return await session_service.create_session(data, str(current_user["_id"]), db, background_tasks)


@router.get("/{session_id}", status_code=200)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get session status and metadata."""
    return await session_service.get_session(session_id, str(current_user["_id"]), db)


@router.post("/{session_id}/end", status_code=200)
async def end_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    duration_actual: Optional[float] = Body(None, embed=True),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    End a live interview session.
    Marks status → 'completed', records actual duration, and queues post-interview evaluation.
    Called by the frontend when the user ends the interview (manual or time-based).
    """
    return await session_service.end_session(
        session_id=session_id,
        user_id=str(current_user["_id"]),
        duration_actual=duration_actual,
        db=db,
        background_tasks=background_tasks,
    )


@router.get("/{session_id}/report", status_code=200)
async def get_session_report(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Get full detailed report for a completed session.
    Includes transcript, scores, skill analysis, suggestions, and resume snapshot.
    """
    return await session_service.get_session_report(session_id, str(current_user["_id"]), db)
