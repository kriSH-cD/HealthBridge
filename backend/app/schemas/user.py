import re
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.user import UserRole, LanguagePreference


class PatientProfileBase(BaseModel):
    age: Optional[int] = Field(None, ge=0, le=125)
    gender: Optional[str] = Field(None, description="Male, Female, Other")
    blood_group: Optional[str] = Field(None, description="e.g. A+, B+, O+, AB+")
    emergency_contact: Optional[str] = None
    abha_id: Optional[str] = Field(None, description="Synthetic ABHA ID for Nabha demo")
    chronic_conditions: Optional[str] = None


class PatientProfileCreate(PatientProfileBase):
    pass


class PatientProfileResponse(PatientProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class DoctorProfileBase(BaseModel):
    specialization: str = Field(..., min_length=2, max_length=100)
    license_number: str = Field(..., min_length=3, max_length=50)
    hospital_name: str = Field(..., min_length=2, max_length=150)
    consultation_fee: float = Field(default=0.0, ge=0.0)
    languages_spoken: str = Field(default="Punjabi, Hindi")
    experience_years: int = Field(default=1, ge=0, le=60)
    is_available: bool = True
    is_verified: bool = True


class DoctorProfileCreate(DoctorProfileBase):
    pass


class DoctorProfileResponse(DoctorProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class PharmacyProfileBase(BaseModel):
    pharmacy_name: str = Field(..., min_length=2, max_length=150)
    license_number: str = Field(..., min_length=3, max_length=50)
    address: str = Field(..., min_length=5, max_length=255)
    contact_phone: str = Field(...)
    operating_hours: str = Field(default="08:00 AM - 09:00 PM")
    is_verified: bool = True


class PharmacyProfileCreate(PharmacyProfileBase):
    pass


class PharmacyProfileResponse(PharmacyProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class HospitalProfileBase(BaseModel):
    hospital_name: str = Field(..., min_length=2, max_length=150)
    address: str = Field(..., min_length=5, max_length=255)
    emergency_phone: str = Field(...)
    total_beds: int = Field(default=50, ge=0)
    available_beds: int = Field(default=15, ge=0)
    has_oxygen: bool = True
    has_emergency: bool = True


class HospitalProfileCreate(HospitalProfileBase):
    pass


class HospitalProfileResponse(HospitalProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    phone: str = Field(..., description="Indian 10-digit mobile number")
    email: Optional[str] = None
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.PATIENT
    preferred_language: LanguagePreference = LanguagePreference.PA
    village: Optional[str] = Field("Nabha City", description="Village or locality in Nabha")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            v = v.strip().lower()
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
                raise ValueError("Invalid email format")
            return v
        return None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Normalize digits
        clean_phone = re.sub(r"[^\d]", "", v)
        if clean_phone.startswith("91") and len(clean_phone) == 12:
            clean_phone = clean_phone[2:]
        elif clean_phone.startswith("0") and len(clean_phone) == 11:
            clean_phone = clean_phone[1:]
        
        if len(clean_phone) != 10:
            raise ValueError("Phone number must be a valid 10-digit mobile number")
        return clean_phone


class UserRegisterRequest(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    
    # Optional role-specific profile payloads
    patient_data: Optional[PatientProfileCreate] = None
    doctor_data: Optional[DoctorProfileCreate] = None
    pharmacy_data: Optional[PharmacyProfileCreate] = None
    hospital_data: Optional[HospitalProfileCreate] = None


class UserLoginRequest(BaseModel):
    identifier: str = Field(..., description="Phone number or email address")
    password: str = Field(..., min_length=1)


class LanguageUpdateRequest(BaseModel):
    preferred_language: LanguagePreference


class UserResponse(BaseModel):
    id: int
    phone: str
    email: Optional[str] = None
    full_name: str
    role: UserRole
    preferred_language: LanguagePreference
    village: Optional[str] = None
    is_active: bool
    is_demo: bool
    created_at: datetime
    
    patient_profile: Optional[PatientProfileResponse] = None
    doctor_profile: Optional[DoctorProfileResponse] = None
    pharmacy_profile: Optional[PharmacyProfileResponse] = None
    hospital_profile: Optional[HospitalProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class SendOTPRequest(BaseModel):
    phone: str = Field(..., description="Indian 10-digit mobile number")
    purpose: str = Field(default="LOGIN", description="Purpose: LOGIN, REGISTRATION, PASSWORD_RESET")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean_phone = re.sub(r"[^\d]", "", v)
        if clean_phone.startswith("91") and len(clean_phone) == 12:
            clean_phone = clean_phone[2:]
        elif clean_phone.startswith("0") and len(clean_phone) == 11:
            clean_phone = clean_phone[1:]
        if len(clean_phone) != 10:
            raise ValueError("Phone number must be a valid 10-digit mobile number")
        return clean_phone


class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., description="Indian 10-digit mobile number")
    otp_code: str = Field(..., min_length=4, max_length=10)
    purpose: str = Field(default="LOGIN")


class ResetPasswordRequest(BaseModel):
    phone: str = Field(...)
    otp_code: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=6, description="New password, at least 6 characters")


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    village: Optional[str] = None
    preferred_language: Optional[LanguagePreference] = None
    
    patient_data: Optional[PatientProfileBase] = None
    doctor_data: Optional[DoctorProfileBase] = None
    pharmacy_data: Optional[PharmacyProfileBase] = None
