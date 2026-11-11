import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import OTPVerification

# In development and demo environments, standard test OTP code
MOCK_STATIC_OTP = "123456"


def generate_otp_code() -> str:
    """Generate a 6-digit numeric OTP code."""
    return f"{random.randint(100000, 999999)}"


def send_mock_otp(db: Session, phone: str, purpose: str = "LOGIN") -> dict:
    """
    Mock OTP sender for development and demonstration in Nabha.
    Saves verification record to DB and returns the OTP code in the payload.
    """
    clean_phone = phone.strip()
    # For demo phones or default testing, standard code is 123456
    otp_code = MOCK_STATIC_OTP if clean_phone.startswith("987654") else generate_otp_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Invalidate previous unverified OTPs for this phone and purpose
    db.query(OTPVerification).filter(
        OTPVerification.phone == clean_phone,
        OTPVerification.purpose == purpose,
        OTPVerification.is_verified.is_(False)
    ).delete()

    otp_record = OTPVerification(
        phone=clean_phone,
        otp_code=otp_code,
        purpose=purpose,
        is_verified=False,
        expires_at=expires_at,
    )
    db.add(otp_record)
    db.commit()

    return {
        "success": True,
        "phone": clean_phone,
        "purpose": purpose,
        "message": f"OTP successfully sent to +91 {clean_phone[-4:]} (Rural Nabha Mock SMS Gateway)",
        "mock_otp": otp_code,
        "expires_in_minutes": 10,
    }


def verify_mock_otp(db: Session, phone: str, otp_code: str, purpose: str = "LOGIN") -> bool:
    """
    Verify entered OTP against active records or demo bypass code.
    """
    clean_phone = phone.strip()
    clean_code = otp_code.strip()

    # Allow standard demo code for instant test passes
    if clean_code == MOCK_STATIC_OTP:
        return True

    now = datetime.now(timezone.utc)
    record = db.query(OTPVerification).filter(
        OTPVerification.phone == clean_phone,
        OTPVerification.otp_code == clean_code,
        OTPVerification.purpose == purpose,
        OTPVerification.is_verified.is_(False),
        OTPVerification.expires_at > now
    ).first()

    if record:
        record.is_verified = True
        db.commit()
        return True

    return False

