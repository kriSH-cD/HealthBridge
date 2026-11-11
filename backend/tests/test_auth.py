from fastapi.testclient import TestClient


def test_patient_registration_and_login(client: TestClient):
    # 1. Register Patient
    payload = {
        "phone": "9812345670",
        "email": "test.patient@example.com",
        "full_name": "Karamjit Singh",
        "role": "PATIENT",
        "preferred_language": "pa",
        "village": "Duladdi",
        "password": "securepassword123",
        "patient_data": {
            "age": 45,
            "gender": "Male",
            "blood_group": "B+",
            "emergency_contact": "9812345679",
            "chronic_conditions": "Diabetes Type 2"
        }
    }
    reg_res = client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["phone"] == "9812345670"
    assert reg_data["full_name"] == "Karamjit Singh"
    assert reg_data["role"] == "PATIENT"
    assert reg_data["village"] == "Duladdi"
    assert reg_data["patient_profile"]["age"] == 45
    assert reg_data["patient_profile"]["blood_group"] == "B+"

    # 2. Login with phone
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "9812345670",
        "password": "securepassword123"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "PATIENT"
    assert token_data["token_type"] == "bearer"
    token = token_data["access_token"]

    # 3. Access /me endpoint with token
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["phone"] == "9812345670"
    assert me_data["full_name"] == "Karamjit Singh"

    # 4. Update language preference
    lang_res = client.put(
        "/api/v1/auth/language",
        headers={"Authorization": f"Bearer {token}"},
        json={"preferred_language": "hi"}
    )
    assert lang_res.status_code == 200
    assert lang_res.json()["preferred_language"] == "hi"


def test_doctor_registration(client: TestClient):
    payload = {
        "phone": "9812345671",
        "email": "dr.singh@nabha.test",
        "full_name": "Dr. Tarsem Singh",
        "role": "DOCTOR",
        "preferred_language": "pa",
        "village": "Nabha City",
        "password": "doctorpassword123",
        "doctor_data": {
            "specialization": "Cardiology",
            "license_number": "PB-MC-2016-1234",
            "hospital_name": "Civil Hospital Nabha",
            "consultation_fee": 100.0,
            "languages_spoken": "Punjabi, Hindi, English",
            "experience_years": 10
        }
    }
    reg_res = client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert data["role"] == "DOCTOR"
    assert data["doctor_profile"]["specialization"] == "Cardiology"
    assert data["doctor_profile"]["hospital_name"] == "Civil Hospital Nabha"


def test_pharmacy_registration(client: TestClient):
    payload = {
        "phone": "9812345672",
        "email": "singh.medicos@nabha.test",
        "full_name": "Singh Medicos Nabha",
        "role": "PHARMACY",
        "preferred_language": "pa",
        "village": "Alhoran",
        "password": "pharmacypassword123",
        "pharmacy_data": {
            "pharmacy_name": "Singh Medical & Surgical Store",
            "license_number": "PB-RET-2023-999",
            "address": "Alhoran Gate, Nabha, Punjab",
            "contact_phone": "9812345672",
            "operating_hours": "08:00 AM - 09:00 PM"
        }
    }
    reg_res = client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert data["role"] == "PHARMACY"
    assert data["pharmacy_profile"]["pharmacy_name"] == "Singh Medical & Surgical Store"


def test_duplicate_phone_prevention(client: TestClient):
    payload = {
        "phone": "9812345673",
        "full_name": "User One",
        "role": "PATIENT",
        "password": "password123"
    }
    client.post("/api/v1/auth/register", json=payload)
    
    # Try duplicate
    dup_res = client.post("/api/v1/auth/register", json=payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]


def test_invalid_login_credentials(client: TestClient):
    res = client.post("/api/v1/auth/login", json={
        "identifier": "9999999999",
        "password": "wrongpassword"
    })
    assert res.status_code == 401


def test_unauthorized_profile_access(client: TestClient):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401

