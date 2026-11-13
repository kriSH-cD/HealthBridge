from datetime import date, datetime
from typing import Optional
from pydantic import AliasPath, BaseModel, ConfigDict, Field


class MedicineAvailability(BaseModel):
    """One in-stock batch of a medicine at one pharmacy."""
    inventory_id: int = Field(validation_alias="id")
    medicine_id: int
    medicine_name: str = Field(validation_alias=AliasPath("medicine", "name"))
    generic_name: str = Field(validation_alias=AliasPath("medicine", "generic_name"))
    strength: str = Field(validation_alias=AliasPath("medicine", "strength"))
    pharmacy_id: int
    pharmacy_name: str = Field(validation_alias=AliasPath("pharmacy", "pharmacy_name"))
    pharmacy_address: str = Field(validation_alias=AliasPath("pharmacy", "address"))
    pharmacy_village: Optional[str] = Field(None, validation_alias=AliasPath("pharmacy", "village"))
    pharmacy_phone: str = Field(validation_alias=AliasPath("pharmacy", "contact_phone"))
    stock_quantity: int
    unit_price: float
    expiry_date: date
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryItem(MedicineAvailability):
    batch_number: str
    reorder_level: int
    is_available: bool


class StockUpdate(BaseModel):
    stock_quantity: int = Field(..., ge=0, le=100000)
