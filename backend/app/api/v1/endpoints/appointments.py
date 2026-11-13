import uuid
from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.clinical import Appointment
from app.models.user import Doctor, User, UserRole
from app.schemas.appointment import AppointmentCreate, AppointmentResponse

router = APIRouter()


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(require_roles([UserRole.PATIENT])),
    db: Session = Depends(get_db),
):
    """Patient books an appointment with a doctor."""
    if current_user.patient is None:
        raise HTTPException(status_code=400, detail="Patient profile missing")
    if payload.appointment_date < date.today():
        raise HTTPException(status_code=400, detail="Appointment date is in the past")

    doctor = db.get(Doctor, payload.doctor_id)
    if doctor is None or not doctor.user.is_active:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if not doctor.is_available:
        raise HTTPException(status_code=400, detail="Doctor is not accepting appointments")

    appointment = Appointment(
        appointment_number=f"APT-{uuid.uuid4().hex[:10].upper()}",
        patient_id=current_user.patient.id,
        doctor_id=doctor.id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        appointment_type=payload.appointment_type,
        symptom_summary=payload.symptom_summary,
        is_demo=False,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("", response_model=List[AppointmentResponse])
def list_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Appointments of the logged-in patient or doctor, soonest first."""
    query = db.query(Appointment)
    if current_user.role == UserRole.PATIENT and current_user.patient:
        query = query.filter(Appointment.patient_id == current_user.patient.id)
    elif current_user.role == UserRole.DOCTOR and current_user.doctor:
        query = query.filter(Appointment.doctor_id == current_user.doctor.id)
    else:
        return []
    return query.order_by(Appointment.appointment_date, Appointment.appointment_time).all()
