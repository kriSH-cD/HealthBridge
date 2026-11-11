from fastapi.testclient import TestClient


def test_synthetic_seed_and_directory(client: TestClient):
    # 1. Trigger demo data seeding
    res = client.post("/api/v1/seed/seed-demo-data")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "DEMO DATA" in data["note"]
    assert data["seeded_counts"]["doctors"] >= 5
    assert data["seeded_counts"]["pharmacies"] >= 3
    assert data["seeded_counts"]["patients"] >= 4

    # 2. Verify all seeded users are tagged with is_demo=True
    doctors_res = client.get("/api/v1/users/doctors")
    assert doctors_res.status_code == 200
    doctors = doctors_res.json()
    assert len(doctors) >= 5
    for doc in doctors:
        assert doc["is_demo"] is True
        assert "[DEMO DATA]" in doc["full_name"]
        assert doc["doctor_profile"] is not None

    # 3. Test filtering doctors by village (e.g., Duladdi)
    duladdi_res = client.get("/api/v1/users/doctors?village=Duladdi")
    assert duladdi_res.status_code == 200
    duladdi_doctors = duladdi_res.json()
    assert len(duladdi_doctors) >= 1
    assert "Duladdi" in duladdi_doctors[0]["village"]

    # 4. Test filtering pharmacies
    pharmacies_res = client.get("/api/v1/users/pharmacies")
    assert pharmacies_res.status_code == 200
    pharmacies = pharmacies_res.json()
    assert len(pharmacies) >= 3
    for ph in pharmacies:
        assert ph["is_demo"] is True
        assert ph["pharmacy_profile"] is not None

    # 5. Verify seeded doctor can authenticate with demo credentials
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "9876543201",
        "password": "password123"
    })
    assert login_res.status_code == 200
    assert login_res.json()["role"] == "DOCTOR"

