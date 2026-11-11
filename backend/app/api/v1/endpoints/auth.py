from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import (
    User, UserRole, PatientProfile, DoctorProfile, PharmacyProfile, HospitalProfile
)
from app.schemas.user import (
    UserRegisterRequest, UserLoginRequest, UserResponse, LanguageUpdateRequest
)
from app.schemas.token import Token
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user (Patient, Doctor, Pharmacy, Hospital Admin)
    with phone/email credentials and role-specific profile details.
    """
    # Check if phone number is already registered
    existing_phone = db.query(User).filter(User.phone == payload.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number already exists."
        )

    # Check if email is already registered if provided
    if payload.email:
        existing_email = db.query(User).filter(User.email == payload.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

    # Hash the password
    hashed_pwd = get_password_hash(payload.password)

    # Create base user
    new_user = User(
        phone=payload.phone,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hashed_pwd,
        role=payload.role,
        preferred_language=payload.preferred_language,
        village=payload.village,
        is_active=True,
        is_demo=False,
    )
    db.add(new_user)
    db.flush()  # Generate user.id

    # Create associated role profile
    if payload.role == UserRole.PATIENT:
        p_data = payload.patient_data
        profile = PatientProfile(
            user_id=new_user.id,
            age=p_data.age if p_data else None,
            gender=p_data.gender if p_data else None,
            blood_group=p_data.blood_group if p_data else None,
            emergency_contact=p_data.emergency_contact if p_data else None,
            abha_id=p_data.abha_id if p_data else None,
            chronic_conditions=p_data.chronic_conditions if p_data else None,
        )
        db.add(profile)
    elif payload.role == UserRole.DOCTOR:
        d_data = payload.doctor_data
        profile = DoctorProfile(
            user_id=new_user.id,
            specialization=d_data.specialization if d_data else "General Medicine",
            license_number=d_data.license_number if d_data else f"PBI-{new_user.id:04d}",
            hospital_name=d_data.hospital_name if d_data else "Civil Hospital Nabha",
            consultation_fee=d_data.consultation_fee if d_data else 0.0,
            languages_spoken=d_data.languages_spoken if d_data else "Punjabi, Hindi",
            experience_years=d_data.experience_years if d_data else 1,
            is_available=True,
            is_verified=True,
        )
        db.add(profile)
    elif payload.role == UserRole.PHARMACY:
        ph_data = payload.pharmacy_data
        profile = PharmacyProfile(
            user_id=new_user.id,
            pharmacy_name=ph_data.pharmacy_name if ph_data else f"{new_user.full_name} Medicos",
            license_number=ph_data.license_number if ph_data else f"DL-NABHA-{new_user.id:04d}",
            address=ph_data.address if ph_data else f"{payload.village or 'Nabha'}, Punjab",
            contact_phone=ph_data.contact_phone if ph_data else payload.phone,
            operating_hours=ph_data.operating_hours if ph_data else "08:00 AM - 09:00 PM",
            is_verified=True,
        )
        db.add(profile)
    elif payload.role == UserRole.HOSPITAL_ADMIN:
        h_data = payload.hospital_data
        profile = HospitalProfile(
            user_id=new_user.id,
            hospital_name=h_data.hospital_name if h_data else "Sub-Divisional Hospital Nabha",
            address=h_data.address if h_data else "Circular Road, Nabha, Punjab",
            emergency_phone=h_data.emergency_phone if h_data else payload.phone,
            total_beds=h_data.total_beds if h_data else 50,
            available_beds=h_data.available_beds if h_data else 15,
        )
        db.add(profile)

    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user using phone or email and password,
    returning a signed JWT bearer token.
    """
    identifier = payload.identifier.strip()
    
    # Check by phone (exact or normalized) or email
    user = db.query(User).filter(
        or_(
            User.phone == identifier,
            User.email == identifier
        )
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive. Please contact support."
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        preferred_language=user.preferred_language.value,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return profile and metadata of the currently authenticated user."""
    return current_user


@router.put("/language", response_model=UserResponse)
def update_user_language(
    payload: LanguageUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update preferred language (pa, hi, en) for the current user."""
    current_user.preferred_language = payload.preferred_language
    db.commit()
    db.refresh(current_user)
    return current_user

