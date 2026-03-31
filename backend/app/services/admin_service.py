"""
services/admin_service.py — Admin view business logic.

Handles: retrieving cross-user sessions and debug logs.
"""

from bson import ObjectId
from fastapi import HTTPException, status
from app.services.session_service import _format_session_status, _format_session_report

async def list_all_sessions(skip: int, limit: int, db) -> list[dict]:
    """Retrieve all sessions across all users (paginated), newest first."""
    cursor = db["sessions"].find().sort("created_at", -1).skip(skip).limit(limit)
    sessions = await cursor.to_list(length=limit)
    
    formatted = []
    for s in sessions:
        user = await db["users"].find_one({"_id": s["user_id"]})
        f = _format_session_status(s)
        f["user_email"] = user["email"] if user else "Unknown"
        # We can also quickly peek if debug_data exists
        f["has_debug_data"] = bool(s.get("debug_data"))
        formatted.append(f)
    return formatted

async def get_admin_session_report(session_id: str, db) -> dict:
    """Retrieve full session report including raw debug_data prompts."""
    session = await db["sessions"].find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        
    user = await db["users"].find_one({"_id": session["user_id"]})
    
    report = _format_session_report(session)
    report["user_email"] = user["email"] if user else "Unknown"
    
    # Expose raw prompt outputs for this admin route explicitly
    report["debug_data"] = session.get("debug_data", {})
    return report
