from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, Text, Float, Enum as SQLEnum
)
from sqlalchemy.orm import relationship, synonym
from app.db.base import Base


class UserRole(str, Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    PHARMACY = "PHARMACY"
    ADMIN = "ADMIN"
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
    village = Column(String(100), nullable=True, index=True)  # Village or locality in Nabha tehsil
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False, index=True)  # Mandatory synthetic data flag
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # 1-to-1 Profile Relationships
    patient = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    pharmacy = relationship("Pharmacy", back_populates="user", uselist=False, cascade="all, delete-orphan")
    hospital = relationship("Hospital", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # 1-to-many Relationships
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    # Backward compatibility aliases with Phase 1
    @property
    def patient_profile(self):
        return self.patient

    @patient_profile.setter
    def patient_profile(self, value):
        self.patient = value

    @property
    def doctor_profile(self):
        return self.doctor

    @doctor_profile.setter
    def doctor_profile(self, value):
        self.doctor = value

    @property
    def pharmacy_profile(self):
        return self.pharmacy

    @pharmacy_profile.setter
    def pharmacy_profile(self, value):
        self.pharmacy = value

    @property
    def hospital_profile(self):
        return self.hospital

    @hospital_profile.setter
    def hospital_profile(self, value):
        self.hospital = value


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True, index=True)
    emergency_contact = Column(String(20), nullable=True)
    abha_id = Column(String(50), unique=True, index=True, nullable=True)  # Synthetic ABHA number for Nabha demo
    chronic_conditions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    address = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    medical_records = relationship("MedicalRecord", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    consultations = relationship("Consultation", back_populates="patient", cascade="all, delete-orphan")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    specialization = Column(String(100), nullable=False, index=True)
    license_number = Column(String(50), unique=True, index=True, nullable=False)
    qualification = Column(String(100), default="MBBS", nullable=False)
    hospital_name = Column(String(150), nullable=False, index=True)  # e.g., Civil Hospital Nabha
    consultation_fee = Column(Float, default=0.0, nullable=False)
    languages_spoken = Column(String(100), default="Punjabi, Hindi", nullable=False)
    experience_years = Column(Integer, default=1, nullable=False)
    bio = Column(Text, nullable=True)
    is_available = Column(Boolean, default=True, index=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="doctor", cascade="all, delete-orphan")
    medical_records = relationship("MedicalRecord", back_populates="doctor")
    consultations = relationship("Consultation", back_populates="doctor", cascade="all, delete-orphan")


class Pharmacy(Base):
    __tablename__ = "pharmacies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    pharmacy_name = Column(String(150), nullable=False, index=True)
    license_number = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(255), nullable=False)
    village = Column(String(100), nullable=True, index=True)
    contact_phone = Column(String(20), nullable=False)
    operating_hours = Column(String(100), default="08:00 AM - 09:00 PM", nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="pharmacy")
    inventory = relationship("PharmacyInventory", back_populates="pharmacy", cascade="all, delete-orphan")


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    hospital_name = Column(String(150), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    emergency_phone = Column(String(20), nullable=False)
    total_beds = Column(Integer, default=50, nullable=False)
    available_beds = Column(Integer, default=15, nullable=False)
    has_oxygen = Column(Boolean, default=True, nullable=False)
    has_emergency = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="hospital")


# Backward compatibility aliases
PatientProfile = Patient
DoctorProfile = Doctor
PharmacyProfile = Pharmacy
HospitalProfile = Hospital


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token = Column(String(500), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), index=True, nullable=False)
    is_revoked = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="refresh_tokens")


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(30), default="LOGIN", nullable=False)  # "REGISTRATION", "LOGIN", "PASSWORD_RESET"
    is_verified = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

