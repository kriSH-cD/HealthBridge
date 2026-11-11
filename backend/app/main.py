from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Rural Healthcare Platform for Nabha, Punjab connecting patients, "
        "doctors, hospitals, and pharmacies with multilingual support."
    ),
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Direct /api/health route per specification
from app.api.v1.endpoints.health import health_check
app.add_api_route("/api/health", health_check, methods=["GET"], tags=["System Health"])


@app.get("/", tags=["Root"])
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "region": settings.DEFAULT_REGION,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }

