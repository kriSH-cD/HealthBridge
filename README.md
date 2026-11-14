# SehatSetu (HealthBridge)

**Nabha Rural Healthcare Platform • ਪੇਂਡੂ ਸਿਹਤ ਮਿਸ਼ਨ ਨਾਭਾ**

Telemedicine, rural healthcare delivery, and emergency response platform built specifically for Nabha Tehsil (Patiala District, Punjab) and its 173 surrounding villages: multilingual (Punjabi, Hindi, English) teleconsultations, digital prescriptions, medicine inventory tracking at local Jan Aushadhi Kendras and village pharmacies, live civil hospital bed tracking, and the **108 Rapid Ambulance Fleet & Emergency Dispatch System**.

**Stack:** React 18 + Vite + Tailwind CSS, Node.js 20 (Express + Prisma ORM), PostgreSQL 16, Redis 7, Vitest.

---

## Quick Start (Docker)

```bash
docker compose up --build
```

- **Frontend Web Application:** http://localhost:5173 (or mapped host port)
- **Emergency & 108 Fleet Dashboard:** http://localhost:5173/emergency
- **Backend REST API:** http://localhost:8000/api/v1 (health probe: `/api/health`)

---

## Local Development Without Docker

PostgreSQL and Redis can run in Docker via `docker-compose.dev.yml` (`make infra`); backend and frontend run locally on the host with hot reloading.

```bash
npm install
make dev        # starts db + redis containers, runs Prisma migrations, starts server :8000 & frontend :5173
make test       # runs full Vitest test suite (backend server + frontend client)
```

Server tests use an isolated `sehatsetu_test` PostgreSQL database and Redis DB 15.

To seed synthetic demo healthcare records (doctors, pharmacies, appointments, hospital beds, and 108 ambulance fleet):
- Click **"ਨਾਭਾ ਡੈਮੋ ਡਾਟਾ ਲੋਡ ਕਰੋ"** on the home page, or:
- `curl -X POST http://localhost:8000/api/v1/seed/seed-demo-data` (requires `ENABLE_DEMO_SEED=true`).
- All synthetic test accounts use password: `password123`.

---

## 108 Rapid Ambulance Fleet & Emergency Dispatch System

SehatSetu integrates a specialized **108 Rural Emergency Medical Services (EMS) Engine** designed for rapid triage, ambulance dispatch, and real-time fleet telemetry across Nabha Tehsil.

### Key Capabilities
1. **Live Fleet Telemetry & Readiness Strip:** Real-time visibility into Advanced Life Support (ALS) and Basic Life Support (BLS) units stationed at Civil Hospital Nabha, Bhadson PHC, Amloh Road Bypass, and Nabha Cantt.
2. **Rapid 108 Emergency Dispatch Modal:** High-priority triage dispatch modal allowing citizens, ASHA workers, or hospital staff to summon an ambulance with one-click dispatch and immediate driver/paramedic contact numbers.
3. **Clinical Triage Severity Classification:**
   - **`CRITICAL` (Life-Threatening):** Immediate priority routing for cardiac arrest, severe trauma, stroke, and maternal emergencies; automatically selects ALS units equipped with ventilators and defibrillators.
   - **`URGENT`:** Priority response for severe respiratory distress, acute fractures, or uncontrolled bleeding.
   - **`NORMAL` (Stable):** Standard non-emergency transit and scheduled inter-facility patient transfers.
4. **Offline & Low-Bandwidth Resilience:** Frontend incorporates localStorage emergency caching so critical ambulance contact directories and bed tallies remain accessible even during rural network dropouts (2G/EDGE).
5. **Trilingual Localization:** Complete native Punjabi (ਪੰਜਾਬੀ - Gurmukhi), Hindi (हिंदी), and English translations for dispatch alerts and caller guidance.

---

## REST API Reference: 108 Ambulances & Dispatches

All emergency ambulance endpoints are exposed under `/api/v1/ambulances`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/ambulances` | List all regional ambulances (filterable by `status`, `type`, `station_location`, `is_active`) |
| `GET` | `/api/v1/ambulances/summary` | Real-time aggregate fleet statistics (`total`, `available`, `dispatched`, `maintenance`, `als_count`, `bls_count`) |
| `GET` | `/api/v1/ambulances/:id` | Get telemetry, driver details, equipment flags, and active dispatches for a specific ambulance |
| `POST` | `/api/v1/ambulances/:id/status` | Update vehicle operational status (`AVAILABLE`, `DISPATCHED`, `BUSY`, `MAINTENANCE`, `OFF_DUTY`) |
| `POST` | `/api/v1/ambulances/requests` | Create and triage a new emergency dispatch request; auto-assigns nearest available ambulance |
| `GET` | `/api/v1/ambulances/requests` | List emergency requests (filterable by `severity`, `status`, `pickup_village`) |
| `PATCH` | `/api/v1/ambulances/requests/:id` | Update emergency request status (`DISPATCHED`, `EN_ROUTE`, `ON_SCENE`, `COMPLETED`, `CANCELLED`) |

### Example 1: Retrieve Fleet Summary Telemetry
```bash
curl -X GET http://localhost:8000/api/v1/ambulances/summary
```
**Response (200 OK):**
```json
{
  "total": 4,
  "available": 3,
  "dispatched": 1,
  "busy": 0,
  "maintenance": 0,
  "off_duty": 0,
  "als_count": 2,
  "bls_count": 2
}
```

### Example 2: Dispatch an Emergency Ambulance (CRITICAL Triage)
```bash
curl -X POST http://localhost:8000/api/v1/ambulances/requests \
  -H "Content-Type: application/json" \
  -d '{
    "caller_name": "Gurpreet Singh",
    "caller_phone": "9876543210",
    "pickup_village": "Duladdi",
    "pickup_address": "Near Gurdwara Sahib, Main Phirni",
    "chief_complaint": "Acute chest pain, shortness of breath",
    "severity": "CRITICAL"
  }'
```
**Response (201 Created):**
```json
{
  "id": "req-duladdi-001",
  "caller_name": "Gurpreet Singh",
  "caller_phone": "9876543210",
  "pickup_village": "Duladdi",
  "chief_complaint": "Acute chest pain, shortness of breath",
  "severity": "CRITICAL",
  "status": "DISPATCHED",
  "ambulance_id": "amb-nabha-als-1",
  "ambulance": {
    "vehicle_number": "PB-11-EM-1081",
    "ambulance_type": "ALS",
    "driver_name": "Balwinder Singh",
    "driver_phone": "98140-10801",
    "paramedic_name": "Dr. Manpreet Kaur (EMT)",
    "station_location": "Civil Hospital Nabha"
  },
  "created_at": "2026-11-14T17:15:00.000Z"
}
```

---

## Architecture & Data Modeling

The relational schema is managed with **Prisma ORM** targeting **PostgreSQL**.

- **`Ambulance` Entity:** Tracks regional 108 vehicles, vehicle registration number, service type (`ALS` / `BLS`), operational status (`AVAILABLE`, `DISPATCHED`, `BUSY`, `MAINTENANCE`, `OFF_DUTY`), driver and paramedic names & contact numbers, GPS latitude/longitude coordinates, base station location, and life-support equipment flags (`oxygen_supported`, `ventilator_equipped`, `defibrillator_equipped`).
- **`EmergencyRequest` Entity:** Models incident intake and dispatch lifecycle. Stores caller identity, contact number, pickup village and address, chief complaint, triage severity (`CRITICAL`, `URGENT`, `NORMAL`), dispatch status (`PENDING`, `DISPATCHED`, `EN_ROUTE`, `ON_SCENE`, `COMPLETED`, `CANCELLED`), timestamps, and foreign key relations linking to `Ambulance`, `User` (patient/caller), and destination `Hospital`.

For complete relational schemas, foreign key constraints, indexes, and Mermaid diagrams, see [docs/er-diagram.md](docs/er-diagram.md).

---

## Testing & Quality Assurance

The platform contains exhaustive automated test suites across both backend and frontend layers:

```bash
# Run backend server test suite (49 Vitest integration tests)
npm test -w server

# Run frontend client test suite (25 Vitest component and flow tests)
npm test -w frontend

# Run complete workspace test suites concurrently
make test
```

### Test Coverage Highlights
- **Backend (`server/test/ambulances.test.js`):** Fleet listing, filter queries, telemetry aggregates, single ambulance lookup, status state machine transitions, emergency request dispatch, auto-assignment to available ALS/BLS vehicles, and 404/400 validation boundaries.
- **Frontend (`frontend/src/test/EmergencyPage.test.js`):** Emergency dashboard rendering, live bed counters, 108 fleet KPI badge rendering, dispatch modal interactions, validation errors, and offline caching hydration.

---

## License

This project is developed as an open rural health initiative for Nabha Tehsil under the MIT License.
