from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "SehatSetu" in data["platform"]
    assert data["status"] == "operational"
    assert data["region"] == "Nabha, Patiala, Punjab"


def test_health_check_endpoint(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["database"]["status"] == "healthy"
    assert "Nabha" in data["region"]
    assert "pa" in data["supported_languages"]


def test_api_health_endpoint(client: TestClient):
    # Tests the explicit GET /api/health specification
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["database"]["status"] == "healthy"
    assert "SehatSetu" in data["service"]

