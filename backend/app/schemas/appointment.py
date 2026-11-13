from datetime import date, datetime
from typing import Optional
from pydantic import AliasPath, BaseModel, ConfigDict, Field
from app.models.clinical import AppointmentStatus, AppointmentType


class AppointmentCreate(BaseModel):
    doctor_id: int = Field(..., description="Doctor profile id (doctor_profile.id)")
    appointment_date: date
    appointment_time: str = Field(..., min_length=1, max_length=20, description='e.g. "10:30 AM"')
    appointment_type: AppointmentType = AppointmentType.IN_PERSON
    symptom_summary: Optional[str] = Field(None, max_length=2000)


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    notes: Optional[str] = Field(None, max_length=2000)


class AppointmentResponse(BaseModel):
    id: int
    appointment_number: str
    patient_id: int
    doctor_id: int
    patient_name: str = Field(validation_alias=AliasPath("patient", "user", "full_name"))
    doctor_name: str = Field(validation_alias=AliasPath("doctor", "user", "full_name"))
    appointment_date: date
    appointment_time: str
    appointment_type: AppointmentType
    status: AppointmentStatus
    symptom_summary: Optional[str] = None
    notes: Optional[str] = None
    is_demo: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
