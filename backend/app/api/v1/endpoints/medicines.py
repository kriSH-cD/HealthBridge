from datetime import date
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.pharmacy import Medicine, PharmacyInventory
from app.schemas.medicine import MedicineAvailability

router = APIRouter()


@router.get("/availability", response_model=List[MedicineAvailability])
def medicine_availability(
    q: str = Query(..., min_length=2, max_length=100, description="Medicine or generic name"),
    db: Session = Depends(get_db),
):
    """Public: which Nabha pharmacies have this medicine in stock right now (cheapest first)."""
    pattern = f"%{q}%"
    return (
        db.query(PharmacyInventory)
        .join(Medicine)
        .filter(
            or_(Medicine.name.ilike(pattern), Medicine.generic_name.ilike(pattern), Medicine.brand_name.ilike(pattern)),
            PharmacyInventory.is_available.is_(True),
            PharmacyInventory.stock_quantity > 0,
            PharmacyInventory.expiry_date >= date.today(),
        )
        .order_by(Medicine.name, PharmacyInventory.unit_price)
        .limit(50)
        .all()
    )
