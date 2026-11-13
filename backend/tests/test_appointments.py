from datetime import date, timedelta
from fastapi.testclient import TestClient

TOMORROW = (date.today() + timedelta(days=1)).isoformat()


def _register_and_login(client: TestClient, phone: str, role: str, **extra) -> dict:
    res = client.post("/api/v1/auth/register", json={
        "phone": phone, "full_name": f"{role.title()} {phone[-2:]}",
        "role": role, "password": "password123", **extra,
    })
    assert res.status_code == 201, res.text
    token = client.post("/api/v1/auth/login", json={
        "identifier": phone, "password": "password123",
    }).json()["access_token"]
    return {"user": res.json(), "headers": {"Authorization": f"Bearer {token}"}}


def _doctor(client: TestClient, phone: str = "9812300001") -> dict:
    return _register_and_login(client, phone, "DOCTOR")


def _patient(client: TestClient, phone: str = "9812300002") -> dict:
    return _register_and_login(client, phone, "PATIENT")


def _book(client: TestClient, patient: dict, doctor: dict, **overrides):
    body = {
        "doctor_id": doctor["user"]["doctor_profile"]["id"],
        "appointment_date": TOMORROW,
        "appointment_time": "10:30 AM",
        "symptom_summary": "Fever for 3 days",
        **overrides,
    }
    return client.post("/api/v1/appointments", json=body, headers=patient["headers"])


def test_patient_books_appointment(client: TestClient):
    doctor, patient = _doctor(client), _patient(client)
    res = _book(client, patient, doctor)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["status"] == "SCHEDULED"
    assert body["is_demo"] is False
    assert body["doctor_name"] == doctor["user"]["full_name"]
    assert body["patient_name"] == patient["user"]["full_name"]


def test_booking_rejects_past_date_unknown_doctor_and_non_patient(client: TestClient):
    doctor, patient = _doctor(client), _patient(client)
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    assert _book(client, patient, doctor, appointment_date=yesterday).status_code == 400
    assert _book(client, patient, doctor, doctor_id=99999).status_code == 404
    assert _book(client, doctor, doctor).status_code == 403


def test_each_side_sees_only_their_appointments(client: TestClient):
    doctor, patient = _doctor(client), _patient(client)
    other_doctor, other_patient = _doctor(client, "9812300003"), _patient(client, "9812300004")
    _book(client, patient, doctor)
    _book(client, other_patient, other_doctor)

    for who in (patient, doctor):
        mine = client.get("/api/v1/appointments", headers=who["headers"]).json()
        assert len(mine) == 1
        assert mine[0]["patient_name"] == patient["user"]["full_name"]


def _set_status(client: TestClient, who: dict, appointment_id: int, status: str):
    return client.patch(f"/api/v1/appointments/{appointment_id}/status",
                        json={"status": status}, headers=who["headers"])


def test_status_rules(client: TestClient):
    doctor, patient, stranger = _doctor(client), _patient(client), _patient(client, "9812300005")
    first = _book(client, patient, doctor).json()["id"]
    second = _book(client, patient, doctor).json()["id"]

    assert _set_status(client, stranger, first, "CANCELLED").status_code == 404
    assert _set_status(client, patient, first, "COMPLETED").status_code == 403
    assert _set_status(client, doctor, first, "COMPLETED").json()["status"] == "COMPLETED"
    assert _set_status(client, patient, first, "CANCELLED").status_code == 400  # already done
    assert _set_status(client, patient, second, "CANCELLED").json()["status"] == "CANCELLED"
