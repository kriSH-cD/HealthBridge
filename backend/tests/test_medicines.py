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


def _login(client: TestClient, phone: str) -> dict:
    token = client.post("/api/v1/auth/login", json={"identifier": phone, "password": "password123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_pharmacy_updates_only_its_own_stock(client: TestClient, db_session: Session):
    seed_database(db_session)
    pharmacy = _login(client, "9876543301")
    patient = _login(client, "9876543101")

    mine = client.get("/api/v1/medicines/inventory", headers=pharmacy).json()
    assert mine and len({r["pharmacy_id"] for r in mine}) == 1
    item = mine[0]

    res = client.patch(f"/api/v1/medicines/inventory/{item['inventory_id']}", json={"stock_quantity": 0}, headers=pharmacy)
    assert res.status_code == 200
    assert res.json()["is_available"] is False

    others = db_session.query(PharmacyInventory).filter(PharmacyInventory.pharmacy_id != item["pharmacy_id"]).first()
    assert client.patch(f"/api/v1/medicines/inventory/{others.id}", json={"stock_quantity": 5}, headers=pharmacy).status_code == 404
    assert client.patch(f"/api/v1/medicines/inventory/{item['inventory_id']}", json={"stock_quantity": -1}, headers=pharmacy).status_code == 422
    assert client.get("/api/v1/medicines/inventory", headers=patient).status_code == 403
