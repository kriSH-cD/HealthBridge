from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, Text, Float, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserRole(str, Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    PHARMACY = "PHARMACY"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    ASHA_WORKER = "ASHA_WORKER"


class LanguagePreference(str, Enum):
    PA = "pa"  # Punjabi
    HI = "hi"  # Hindi
    EN = "en"  # English


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=True)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PATIENT)
    preferred_language = Column(SQLEnum(LanguagePreference), nullable=False, default=LanguagePreference.PA)
    village = Column(String(100), nullable=True)  # Village or locality in Nabha tehsil
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)  # Mandatory synthetic data flag
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Profiles (1-to-1)
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    pharmacy_profile = relationship("PharmacyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    hospital_profile = relationship("HospitalProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    abha_id = Column(String(50), nullable=True)  # Synthetic ABHA number for Nabha demo
    chronic_conditions = Column(Text, nullable=True)  # e.g., "Hypertension, Diabetes Type 2"
    
    user = relationship("User", back_populates="patient_profile")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    specialization = Column(String(100), nullable=False)  # General Physician, Pediatrics, etc.
    license_number = Column(String(50), nullable=False)  # Medical Council Reg No.
    hospital_name = Column(String(150), nullable=False)  # e.g., Civil Hospital Nabha
    consultation_fee = Column(Float, default=0.0)
    languages_spoken = Column(String(100), default="Punjabi, Hindi")
    experience_years = Column(Integer, default=1)
    is_available = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)

    user = relationship("User", back_populates="doctor_profile")


class PharmacyProfile(Base):
    __tablename__ = "pharmacy_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    pharmacy_name = Column(String(150), nullable=False)
    license_number = Column(String(50), nullable=False)
    address = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    operating_hours = Column(String(100), default="08:00 AM - 09:00 PM")
    is_verified = Column(Boolean, default=True)

    user = relationship("User", back_populates="pharmacy_profile")


class HospitalProfile(Base):
    __tablename__ = "hospital_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    hospital_name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    emergency_phone = Column(String(20), nullable=False)
    total_beds = Column(Integer, default=50)
    available_beds = Column(Integer, default=15)
    has_oxygen = Column(Boolean, default=True)
    has_emergency = Column(Boolean, default=True)

    user = relationship("User", back_populates="hospital_profile")

