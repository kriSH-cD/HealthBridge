from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.pharmacy import Medicine, PharmacyInventory
from app.models.user import User, UserRole
from app.schemas.medicine import InventoryItem, MedicineAvailability, StockUpdate

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


def _own_pharmacy(user: User):
    if user.pharmacy is None:
        raise HTTPException(status_code=400, detail="Pharmacy profile missing")
    return user.pharmacy


@router.get("/inventory", response_model=List[InventoryItem])
def my_inventory(
    current_user: User = Depends(require_roles([UserRole.PHARMACY])),
    db: Session = Depends(get_db),
):
    """Pharmacy's own stock, lowest quantity first so reorders surface."""
    pharmacy = _own_pharmacy(current_user)
    return (
        db.query(PharmacyInventory)
        .filter(PharmacyInventory.pharmacy_id == pharmacy.id)
        .order_by(PharmacyInventory.stock_quantity, PharmacyInventory.id)
        .all()
    )


@router.patch("/inventory/{inventory_id}", response_model=InventoryItem)
def update_stock(
    inventory_id: int,
    payload: StockUpdate,
    current_user: User = Depends(require_roles([UserRole.PHARMACY])),
    db: Session = Depends(get_db),
):
    """Pharmacy sets the current quantity for one of its batches."""
    pharmacy = _own_pharmacy(current_user)
    item = db.get(PharmacyInventory, inventory_id)
    if item is None or item.pharmacy_id != pharmacy.id:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    item.stock_quantity = payload.stock_quantity
    item.is_available = payload.stock_quantity > 0
    db.commit()
    db.refresh(item)
    return item
