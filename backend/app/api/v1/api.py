from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, users, seed

api_router = APIRouter()

api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & User Profile"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Directory"])
api_router.include_router(seed.router, prefix="/seed", tags=["Synthetic Nabha Demo Data"])

