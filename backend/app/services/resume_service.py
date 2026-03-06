"""
services/resume_service.py — Resume management business logic.

Handles:
  - FIFO queue enforcement (max 5 per user)
  - Resume validation (mandatory sections)
  - Listing and deletion
  - Parsing orchestration (calls file_parser + gemini_service)
"""

from datetime import datetime, timezone
from bson import ObjectId
from fastapi import UploadFile, HTTPException, status

from app.services import gemini_service
from app.utils.file_parser import extract_text_from_file

MAX_RESUMES_PER_USER = 5


async def upload_resume(file: UploadFile, user_id: str, db) -> dict:
    """
    Full resume upload pipeline:
    1. Extract text from PDF/DOCX
    2. Parse and structure with Gemini (validates mandatory sections)
    3. Enforce FIFO queue (delete oldest if > 5)
    4. Store in MongoDB

    Returns the newly created resume document.
    """
    # Step 1: Extract raw text
    raw_text = await extract_text_from_file(file)

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from the uploaded file. Ensure the file is not scanned/image-based.",
        )

    # Step 2: Parse and structure with Gemini (raises 422 if mandatory sections missing)
    structured_json = await gemini_service.parse_resume(raw_text)

    # Step 3: FIFO queue enforcement
    uid = ObjectId(user_id)
    existing_count = await db["resumes"].count_documents({"user_id": uid})

    if existing_count >= MAX_RESUMES_PER_USER:
        # Delete the oldest resume (FIFO)
        oldest = await db["resumes"].find_one(
            {"user_id": uid},
            sort=[("upload_time", 1)]
        )
        if oldest:
            await db["resumes"].delete_one({"_id": oldest["_id"]})

    # Step 4: Store new resume
    resume_doc = {
        "user_id": uid,
        "filename": file.filename,
        "upload_time": datetime.now(timezone.utc),
        "structured_json": structured_json,
    }
    result = await db["resumes"].insert_one(resume_doc)
    resume_doc["_id"] = result.inserted_id

    return _format_resume(resume_doc)


async def list_resumes(user_id: str, db) -> list[dict]:
    """
    List all resumes for a user, most recent first.
    """
    uid = ObjectId(user_id)
    cursor = db["resumes"].find({"user_id": uid}).sort("upload_time", -1)
    resumes = await cursor.to_list(length=MAX_RESUMES_PER_USER)
    return [_format_resume(r) for r in resumes]


async def get_resume_by_id(resume_id: str, user_id: str, db) -> dict:
    """
    Get a single resume by ID. Validates ownership.
    Raises 404 if not found.
    """
    resume = await db["resumes"].find_one({
        "_id": ObjectId(resume_id),
        "user_id": ObjectId(user_id),
    })
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )
    return _format_resume(resume)


async def delete_resume(resume_id: str, user_id: str, db) -> dict:
    """
    Delete a resume by ID. Validates ownership.
    """
    result = await db["resumes"].delete_one({
        "_id": ObjectId(resume_id),
        "user_id": ObjectId(user_id),
    })
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or you do not have permission to delete it.",
        )
    return {"message": "Resume deleted successfully."}


def _format_resume(doc: dict) -> dict:
    """Convert MongoDB resume document to API-friendly dict."""
    return {
        "id": str(doc["_id"]),
        "filename": doc["filename"],
        "upload_time": doc["upload_time"],
        "structured_json": doc["structured_json"],
    }
