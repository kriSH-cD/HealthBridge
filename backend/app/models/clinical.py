from enum import Enum
from datetime import datetime, date, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date,
    ForeignKey, Text, Float, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class AppointmentType(str, Enum):
    IN_PERSON = "IN_PERSON"
    TELECONSULTATION = "TELECONSULTATION"


class AppointmentStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class RecordType(str, Enum):
    GENERAL_VISIT = "GENERAL_VISIT"
    LAB_REPORT = "LAB_REPORT"
    DIAGNOSIS = "DIAGNOSIS"
    VACCINATION = "VACCINATION"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY"


class ConsultationStatus(str, Enum):
    INITIATED = "INITIATED"
    CONNECTED = "CONNECTED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ConsultationType(str, Enum):
    AUDIO = "AUDIO"
    VIDEO = "VIDEO"
    CHAT = "CHAT"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_number = Column(String(30), unique=True, index=True, nullable=False)
    
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), index=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), index=True, nullable=False)
    
    appointment_date = Column(Date, index=True, nullable=False)
    appointment_time = Column(String(20), nullable=False)  # e.g., "10:30 AM"
    appointment_type = Column(SQLEnum(AppointmentType), default=AppointmentType.IN_PERSON, nullable=False)
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, index=True, nullable=False)
    
    symptom_summary = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    consultation = relationship("Consultation", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="appointment")


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    record_number = Column(String(30), unique=True, index=True, nullable=False)
    
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), index=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), index=True, nullable=True)
    
    record_type = Column(SQLEnum(RecordType), nullable=False, default=RecordType.GENERAL_VISIT)
    title = Column(String(150), nullable=False)
    diagnosis = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    vitals = Column(Text, nullable=True)  # JSON formatted vitals (BP, Pulse, Blood Glucose, SpO2)
    record_date = Column(Date, default=date.today, index=True, nullable=False)
    is_confidential = Column(Boolean, default=False, nullable=False)
    is_demo = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("Doctor", back_populates="medical_records")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    prescription_number = Column(String(30), unique=True, index=True, nullable=False)
    
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), index=True, nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), index=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), index=True, nullable=False)
    
    issue_date = Column(Date, default=date.today, nullable=False)
    valid_until = Column(Date, nullable=True)
    diagnosis = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    is_dispensed = Column(Boolean, default=False, index=True, nullable=False)
    is_demo = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
    appointment = relationship("Appointment", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), index=True, nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="RESTRICT"), index=True, nullable=False)
    
    dosage = Column(String(50), nullable=False)  # e.g., "500 mg"
    frequency = Column(String(50), nullable=False)  # e.g., "1-0-1 after meals"
    duration_days = Column(Integer, default=5, nullable=False)
    quantity_prescribed = Column(Integer, default=10, nullable=False)
    instructions = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    prescription = relationship("Prescription", back_populates="items")
    medicine = relationship("Medicine", back_populates="prescription_items")


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), index=True, nullable=False)
    
    room_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(SQLEnum(ConsultationStatus), default=ConsultationStatus.INITIATED, index=True, nullable=False)
    consultation_type = Column(SQLEnum(ConsultationType), default=ConsultationType.VIDEO, nullable=False)
    
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    doctor_notes = Column(Text, nullable=True)
    quality_rating = Column(Integer, nullable=True)  # 1-5 rating
    low_bandwidth_fallback = Column(Boolean, default=False, nullable=False)  # Nabha rural 2G fallback
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    appointment = relationship("Appointment", back_populates="consultation")
    doctor = relationship("Doctor", back_populates="consultations")
    patient = relationship("Patient", back_populates="consultations")

