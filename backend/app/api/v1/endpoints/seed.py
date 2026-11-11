from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.seed_data import seed_database

router = APIRouter()


@router.post("/seed-demo-data", summary="Seed Synthetic Demo Data for Nabha, Punjab")
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Populate realistic, completely synthetic test records for Nabha rural area.
    Every record is flagged with is_demo=True and labeled [DEMO DATA].
    Seeds 20 patients, 8 doctors, 5 pharmacies, 30 medicines, 15 appointments,
    and associated clinical records according to Phase 2 specifications.
    """
    seeded_counts = seed_database(db)

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
