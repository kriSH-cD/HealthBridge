from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="System Health & Database Status")
def health_check(db: Session = Depends(get_db)):
    """
    Perform a live health probe checking API service,
    database connectivity, and regional configuration for Nabha.
    """
    db_status = "unhealthy"
    db_type = "PostgreSQL"
    try:
        # Simple test query
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online" if db_status == "healthy" else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "status": db_status,
            "type": db_type,
        },
        "region": settings.DEFAULT_REGION,
        "supported_languages": settings.SUPPORTED_LANGUAGES,
    }

