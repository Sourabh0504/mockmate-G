"""
database.py — Single source of truth for MongoDB connection.

To switch between local MongoDB and Atlas:
  - Change MONGODB_URI in .env file only.
  - No code changes needed here.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()

# Single Motor client instance (reused across all requests)
client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB. Called on app startup."""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    print(f"[DB] Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_db():
    """Close MongoDB connection. Called on app shutdown."""
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed.")


def get_db():
    """Dependency injection helper — returns the db instance."""
    return db
