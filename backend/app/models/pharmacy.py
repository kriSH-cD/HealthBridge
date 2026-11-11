from enum import Enum
from datetime import datetime, date, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date,
    ForeignKey, Text, Float, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class MedicineCategory(str, Enum):
    TABLET = "TABLET"
    CAPSULE = "CAPSULE"
    SYRUP = "SYRUP"
    INJECTION = "INJECTION"
    OINTMENT = "OINTMENT"
    DROPS = "DROPS"
    INHALER = "INHALER"


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    generic_name = Column(String(150), nullable=False, index=True)
    brand_name = Column(String(100), nullable=True)
    category = Column(SQLEnum(MedicineCategory), default=MedicineCategory.TABLET, index=True, nullable=False)
    strength = Column(String(50), nullable=False)  # e.g., "500 mg", "10 ml"
    manufacturer = Column(String(100), default="Jan Aushadhi Generic", nullable=False)
    price = Column(Float, nullable=False, default=10.0)
    is_prescription_required = Column(Boolean, default=True, nullable=False)
    is_essential = Column(Boolean, default=True, index=True, nullable=False)  # Essential for Nabha PHCs
    description = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    inventory_items = relationship("PharmacyInventory", back_populates="medicine", cascade="all, delete-orphan")
    prescription_items = relationship("PrescriptionItem", back_populates="medicine")


class PharmacyInventory(Base):
    __tablename__ = "pharmacy_inventory"

    id = Column(Integer, primary_key=True, index=True)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id", ondelete="CASCADE"), index=True, nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), index=True, nullable=False)
    
    batch_number = Column(String(50), nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=20, nullable=False)
    unit_price = Column(Float, nullable=False)
    expiry_date = Column(Date, index=True, nullable=False)
    is_available = Column(Boolean, default=True, index=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("pharmacy_id", "medicine_id", "batch_number", name="uq_pharmacy_medicine_batch"),
    )

    # Relationships
    pharmacy = relationship("Pharmacy", back_populates="inventory")
    medicine = relationship("Medicine", back_populates="inventory_items")

