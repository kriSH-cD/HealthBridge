from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.seed_data import seed_database
from app.models.pharmacy import Medicine, PharmacyInventory


def _paracetamol_stock(db: Session):
    return db.query(PharmacyInventory).join(Medicine).filter(Medicine.name == "Paracetamol").all()


def test_availability_lists_only_usable_stock(client: TestClient, db_session: Session):
    seed_database(db_session)
    stock = _paracetamol_stock(db_session)
    assert len(stock) >= 3
    stock[0].stock_quantity = 0
    stock[1].expiry_date = date.today() - timedelta(days=1)
    db_session.commit()

    res = client.get("/api/v1/medicines/availability", params={"q": "paracet"})
    assert res.status_code == 200
    rows = res.json()
    ids = {r["inventory_id"] for r in rows}
    assert stock[0].id not in ids and stock[1].id not in ids
    assert len(rows) == len(stock) - 2
    assert all(r["medicine_name"] == "Paracetamol" and r["pharmacy_name"] for r in rows)
    prices = [r["unit_price"] for r in rows]
    assert prices == sorted(prices)


def test_availability_requires_query(client: TestClient):
    assert client.get("/api/v1/medicines/availability", params={"q": "a"}).status_code == 422
