"""
main.py — FastAPI application entry point.

Registers all routers, sets up CORS, and manages DB lifecycle.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import connect_db, close_db
from app.config import get_settings
from app.routes import auth, resumes, sessions

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="MockMate AI API",
    description="Backend API for the MockMate AI Interview Simulator",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow all Vite dev ports (5173–5180) so login works regardless of which port Vite picks
_vite_origins = [f"http://localhost:{p}" for p in range(5173, 5181)]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_vite_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "MockMate AI API"}
