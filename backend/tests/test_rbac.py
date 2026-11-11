from fastapi.testclient import TestClient


def test_rbac_patient_list_access(client: TestClient):
    # 1. Register a Patient
    client.post("/api/v1/auth/register", json={
        "phone": "9812345680",
        "full_name": "Patient User",
        "role": "PATIENT",
        "password": "password123"
    })
    
    # Login as Patient
    patient_token = client.post("/api/v1/auth/login", json={
        "identifier": "9812345680",
        "password": "password123"
    }).json()["access_token"]

    # 2. Register a Doctor
    client.post("/api/v1/auth/register", json={
        "phone": "9812345681",
        "full_name": "Dr. Test Doctor",
        "role": "DOCTOR",
        "password": "password123",
        "doctor_data": {
            "specialization": "Pediatrics",
            "license_number": "DOC-9999",
            "hospital_name": "Civil Hospital Nabha"
        }
    })
    
    # Login as Doctor
    doctor_token = client.post("/api/v1/auth/login", json={
        "identifier": "9812345681",
        "password": "password123"
    }).json()["access_token"]

    # 3. Patient attempts to access restricted /api/v1/users/patients -> Expect 403 Forbidden
    patient_access = client.get(
        "/api/v1/users/patients",
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert patient_access.status_code == 403
    assert "Access forbidden" in patient_access.json()["detail"]

    # 4. Doctor attempts to access /api/v1/users/patients -> Expect 200 OK
    doctor_access = client.get(
        "/api/v1/users/patients",
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    assert doctor_access.status_code == 200
    assert isinstance(doctor_access.json(), list)

