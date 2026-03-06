"""
routes/resumes.py — Resume management API routes.

Routes are thin — all logic delegated to resume_service.
"""

from fastapi import APIRouter, Depends, UploadFile, File
from app.services import resume_service
from app.middleware.auth_middleware import get_current_user
from app.database import get_db

router = APIRouter()


@router.get("/", status_code=200)
async def list_resumes(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """List all resumes for the authenticated user (max 5, newest first)."""
    return await resume_service.list_resumes(str(current_user["_id"]), db)


@router.post("/upload", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Upload a resume (PDF or DOCX only).
    - Parses and validates mandatory sections (Projects + Education) immediately.
    - Enforces FIFO queue (max 5). Oldest deleted if limit exceeded.
    """
    return await resume_service.upload_resume(file, str(current_user["_id"]), db)


@router.delete("/{resume_id}", status_code=200)
async def delete_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Delete a resume by ID."""
    return await resume_service.delete_resume(resume_id, str(current_user["_id"]), db)
