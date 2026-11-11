from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter()


@router.get("/doctors", response_model=List[UserResponse])
def list_doctors(
    village: Optional[str] = Query(None, description="Filter by Nabha village/locality"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    db: Session = Depends(get_db)
):
    """List available doctors in Nabha rural and urban regions."""
    query = db.query(User).filter(User.role == UserRole.DOCTOR, User.is_active.is_(True))
    if village:
        query = query.filter(User.village.ilike(f"%{village}%"))
    doctors = query.all()
    if specialization:
        doctors = [
            d for d in doctors 
            if d.doctor_profile and specialization.lower() in d.doctor_profile.specialization.lower()
        ]
    return doctors


@router.get("/pharmacies", response_model=List[UserResponse])
def list_pharmacies(
    village: Optional[str] = Query(None, description="Filter by Nabha village/locality"),
    db: Session = Depends(get_db)
):
    """List active pharmacies and medicine dispensaries in Nabha."""
    query = db.query(User).filter(User.role == UserRole.PHARMACY, User.is_active.is_(True))
    if village:
        query = query.filter(User.village.ilike(f"%{village}%"))
    return query.all()


@router.get("/patients", response_model=List[UserResponse])
def list_patients(
    current_user: User = Depends(require_roles([
        UserRole.DOCTOR, UserRole.ASHA_WORKER, UserRole.HOSPITAL_ADMIN
    ])),
    db: Session = Depends(get_db)
):
    """
    List registered patients.
    RESTRICTED: Strictly accessible by DOCTOR, ASHA_WORKER, or HOSPITAL_ADMIN.
    """
    patients = db.query(User).filter(User.role == UserRole.PATIENT).all()
    return patients

