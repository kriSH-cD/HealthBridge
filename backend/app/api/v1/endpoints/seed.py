from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_password_hash
from app.models.user import (
    User, UserRole, LanguagePreference,
    PatientProfile, DoctorProfile, PharmacyProfile, HospitalProfile
)

router = APIRouter()


@router.post("/seed-demo-data", summary="Seed Synthetic Demo Data for Nabha, Punjab")
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Populate realistic, completely synthetic test records for Nabha rural area.
    Every record is flagged with is_demo=True and labeled [DEMO DATA].
    """
    seeded_counts = {
        "doctors": 0,
        "pharmacies": 0,
        "patients": 0,
        "hospital_admins": 0,
        "asha_workers": 0,
    }

    demo_password_hash = get_password_hash("password123")

    # 1. Doctors
    doctors_data = [
        {
            "phone": "9876543201",
            "email": "dr.gurpreet.demo@sehatsetu.nabha.in",
            "full_name": "Dr. Gurpreet Singh Sandhu [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Nabha City",
            "profile": {
                "specialization": "General Medicine",
                "license_number": "PB-MC-2015-8492-DEMO",
                "hospital_name": "Civil Hospital Nabha",
                "consultation_fee": 0.0,
                "languages_spoken": "Punjabi, Hindi, English",
                "experience_years": 11,
            }
        },
        {
            "phone": "9876543202",
            "email": "dr.harpreet.demo@sehatsetu.nabha.in",
            "full_name": "Dr. Harpreet Kaur Dhillon [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Nabha City",
            "profile": {
                "specialization": "Gynecology & Obstetrics",
                "license_number": "PB-MC-2018-4921-DEMO",
                "hospital_name": "Nabha Mother & Child Care Centre",
                "consultation_fee": 100.0,
                "languages_spoken": "Punjabi, Hindi",
                "experience_years": 8,
            }
        },
        {
            "phone": "9876543203",
            "email": "dr.jaswinder.demo@sehatsetu.nabha.in",
            "full_name": "Dr. Jaswinder Singh Brar [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Bir Bhadson",
            "profile": {
                "specialization": "Pediatrics (Child Health)",
                "license_number": "PB-MC-2012-3841-DEMO",
                "hospital_name": "Bhadson Primary Health Centre (PHC)",
                "consultation_fee": 0.0,
                "languages_spoken": "Punjabi, Hindi",
                "experience_years": 14,
            }
        },
        {
            "phone": "9876543204",
            "email": "dr.amanpreet.demo@sehatsetu.nabha.in",
            "full_name": "Dr. Amanpreet Singh Gill [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Duladdi",
            "profile": {
                "specialization": "Ayurveda & Chronic Wellness",
                "license_number": "PB-AY-2020-1102-DEMO",
                "hospital_name": "Duladdi Rural Health Post",
                "consultation_fee": 50.0,
                "languages_spoken": "Punjabi, Hindi",
                "experience_years": 6,
            }
        },
        {
            "phone": "9876543205",
            "email": "dr.simranjit.demo@sehatsetu.nabha.in",
            "full_name": "Dr. Simranjit Kaur Mann [DEMO DATA]",
            "language": LanguagePreference.EN,
            "village": "Nabha City",
            "profile": {
                "specialization": "Orthopedics & Joint Care",
                "license_number": "PB-MC-2017-9023-DEMO",
                "hospital_name": "Circular Road Specialist Clinic",
                "consultation_fee": 150.0,
                "languages_spoken": "Punjabi, English, Hindi",
                "experience_years": 9,
            }
        },
    ]

    for d in doctors_data:
        existing = db.query(User).filter(User.phone == d["phone"]).first()
        if not existing:
            user = User(
                phone=d["phone"],
                email=d["email"],
                full_name=d["full_name"],
                hashed_password=demo_password_hash,
                role=UserRole.DOCTOR,
                preferred_language=d["language"],
                village=d["village"],
                is_active=True,
                is_demo=True,
            )
            db.add(user)
            db.flush()
            prof = DoctorProfile(user_id=user.id, **d["profile"])
            db.add(prof)
            seeded_counts["doctors"] += 1

    # 2. Pharmacies
    pharmacies_data = [
        {
            "phone": "9876543301",
            "email": "janaushadhi.demo@sehatsetu.nabha.in",
            "full_name": "Jan Aushadhi Kendra Nabha [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Nabha City",
            "profile": {
                "pharmacy_name": "Pradhan Mantri Jan Aushadhi Kendra (Civil Hospital Branch)",
                "license_number": "PB-RET-2019-092-DEMO",
                "address": "Near Civil Hospital Gate, Cantt Road, Nabha",
                "contact_phone": "9876543301",
                "operating_hours": "08:00 AM - 08:00 PM",
                "is_verified": True,
            }
        },
        {
            "phone": "9876543302",
            "email": "kisan.medicos.demo@sehatsetu.nabha.in",
            "full_name": "Kisan Medical Store [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Alhoran",
            "profile": {
                "pharmacy_name": "Kisan Medical & Surgical Store Alhoran",
                "license_number": "PB-RET-2021-344-DEMO",
                "address": "Alhoran Gate Road, Nabha Tehsil",
                "contact_phone": "9876543302",
                "operating_hours": "07:30 AM - 09:30 PM",
                "is_verified": True,
            }
        },
        {
            "phone": "9876543303",
            "email": "duladdi.pharma.demo@sehatsetu.nabha.in",
            "full_name": "Duladdi Village Chemist [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Duladdi",
            "profile": {
                "pharmacy_name": "Duladdi Gramin Aushadhalaya",
                "license_number": "PB-RET-2022-771-DEMO",
                "address": "Main Bus Stand Adda, Duladdi, Nabha",
                "contact_phone": "9876543303",
                "operating_hours": "08:00 AM - 07:00 PM",
                "is_verified": True,
            }
        },
    ]

    for p in pharmacies_data:
        existing = db.query(User).filter(User.phone == p["phone"]).first()
        if not existing:
            user = User(
                phone=p["phone"],
                email=p["email"],
                full_name=p["full_name"],
                hashed_password=demo_password_hash,
                role=UserRole.PHARMACY,
                preferred_language=p["language"],
                village=p["village"],
                is_active=True,
                is_demo=True,
            )
            db.add(user)
            db.flush()
            prof = PharmacyProfile(user_id=user.id, **p["profile"])
            db.add(prof)
            seeded_counts["pharmacies"] += 1

    # 3. Patients
    patients_data = [
        {
            "phone": "9876543101",
            "email": "balwinder.demo@nabha.punjab",
            "full_name": "Balwinder Singh [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Alhoran",
            "profile": {
                "age": 54,
                "gender": "Male",
                "blood_group": "B+",
                "emergency_contact": "9876543991",
                "abha_id": "91-1111-2222-3333-DEMO",
                "chronic_conditions": "Hypertension (High BP)",
            }
        },
        {
            "phone": "9876543102",
            "email": "manjit.kaur.demo@nabha.punjab",
            "full_name": "Manjit Kaur [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Duladdi",
            "profile": {
                "age": 42,
                "gender": "Female",
                "blood_group": "O+",
                "emergency_contact": "9876543992",
                "abha_id": "91-4444-5555-6666-DEMO",
                "chronic_conditions": "Type-2 Diabetes",
            }
        },
        {
            "phone": "9876543103",
            "email": "sukhwinder.demo@nabha.punjab",
            "full_name": "Sukhwinder Singh [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Rohti Chhanna",
            "profile": {
                "age": 28,
                "gender": "Male",
                "blood_group": "A+",
                "emergency_contact": "9876543993",
                "abha_id": "91-7777-8888-9999-DEMO",
                "chronic_conditions": "None",
            }
        },
        {
            "phone": "9876543104",
            "email": "paramjit.demo@nabha.punjab",
            "full_name": "Paramjit Kaur [DEMO DATA]",
            "language": LanguagePreference.PA,
            "village": "Kakrala",
            "profile": {
                "age": 63,
                "gender": "Female",
                "blood_group": "AB+",
                "emergency_contact": "9876543994",
                "abha_id": "91-2345-6789-0123-DEMO",
                "chronic_conditions": "Knee Osteoarthritis",
            }
        },
    ]

    for pt in patients_data:
        existing = db.query(User).filter(User.phone == pt["phone"]).first()
        if not existing:
            user = User(
                phone=pt["phone"],
                email=pt["email"],
                full_name=pt["full_name"],
                hashed_password=demo_password_hash,
                role=UserRole.PATIENT,
                preferred_language=pt["language"],
                village=pt["village"],
                is_active=True,
                is_demo=True,
            )
            db.add(user)
            db.flush()
            prof = PatientProfile(user_id=user.id, **pt["profile"])
            db.add(prof)
            seeded_counts["patients"] += 1

    # 4. Hospital Admin
    admin_data = {
        "phone": "9876543401",
        "email": "admin.civilhospital.demo@nabha.punjab",
        "full_name": "Civil Hospital Admin [DEMO DATA]",
        "language": LanguagePreference.PA,
        "village": "Nabha City",
        "profile": {
            "hospital_name": "Sub-Divisional Civil Hospital Nabha",
            "address": "Circular Road, Near Ripudaman College, Nabha, Punjab 147201",
            "emergency_phone": "01765-220100",
            "total_beds": 100,
            "available_beds": 24,
            "has_oxygen": True,
            "has_emergency": True,
        }
    }
    existing_admin = db.query(User).filter(User.phone == admin_data["phone"]).first()
    if not existing_admin:
        admin_user = User(
            phone=admin_data["phone"],
            email=admin_data["email"],
            full_name=admin_data["full_name"],
            hashed_password=demo_password_hash,
            role=UserRole.HOSPITAL_ADMIN,
            preferred_language=admin_data["language"],
            village=admin_data["village"],
            is_active=True,
            is_demo=True,
        )
        db.add(admin_user)
        db.flush()
        prof = HospitalProfile(user_id=admin_user.id, **admin_data["profile"])
        db.add(prof)
        seeded_counts["hospital_admins"] += 1

    # 5. ASHA Worker
    asha_data = {
        "phone": "9876543501",
        "email": "surjit.asha.demo@nabha.punjab",
        "full_name": "Surjit Kaur (ASHA Worker) [DEMO DATA]",
        "language": LanguagePreference.PA,
        "village": "Duladdi",
    }
    existing_asha = db.query(User).filter(User.phone == asha_data["phone"]).first()
    if not existing_asha:
        asha_user = User(
            phone=asha_data["phone"],
            email=asha_data["email"],
            full_name=asha_data["full_name"],
            hashed_password=demo_password_hash,
            role=UserRole.ASHA_WORKER,
            preferred_language=asha_data["language"],
            village=asha_data["village"],
            is_active=True,
            is_demo=True,
        )
        db.add(asha_user)
        seeded_counts["asha_workers"] += 1

    db.commit()

    return {
        "status": "success",
        "message": "Synthetic Nabha rural health records seeded successfully.",
        "note": "ALL RECORDS ARE MARKED AS DEMO DATA AND DO NOT REPRESENT REAL PATIENTS.",
        "seeded_counts": seeded_counts,
        "demo_credentials": {
            "password_for_all_accounts": "password123",
            "doctor": "9876543201",
            "pharmacy": "9876543301",
            "patient": "9876543101",
            "hospital_admin": "9876543401",
            "asha_worker": "9876543501",
        }
    }

