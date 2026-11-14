# Data model (ER)

Source of truth: [`server/prisma/schema.prisma`](../server/prisma/schema.prisma) plus the SQL-only rules in `server/prisma/migrations/`. Update this diagram when the schema changes.

```mermaid
erDiagram
    USER ||--o| PATIENT : "is a"
    USER ||--o| DOCTOR : "is a"
    USER ||--o| PHARMACY : "is a"
    USER ||--o| HOSPITAL : "administers"
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ REFRESH_TOKEN : holds
    USER |o--o{ AUDIT_LOG : "acted in"

    PATIENT ||--o{ APPOINTMENT : books
    DOCTOR ||--o{ APPOINTMENT : attends
    APPOINTMENT ||--o| CONSULTATION : "held as"
    APPOINTMENT |o--o{ PRESCRIPTION : "issued at"
    APPOINTMENT |o--o{ MEDICAL_RECORD : "noted at"

    PATIENT ||--o{ PRESCRIPTION : receives
    DOCTOR ||--o{ PRESCRIPTION : writes
    PRESCRIPTION ||--|{ PRESCRIPTION_ITEM : lists
    MEDICINE ||--o{ PRESCRIPTION_ITEM : "prescribed as"

    PATIENT ||--o{ MEDICAL_RECORD : owns
    DOCTOR |o--o{ MEDICAL_RECORD : authors

    PHARMACY ||--o{ PHARMACY_INVENTORY : stocks
    MEDICINE ||--o{ PHARMACY_INVENTORY : "stocked as"

    HOSPITAL ||--o{ EMERGENCY_REQUEST : receives
    AMBULANCE ||--o{ EMERGENCY_REQUEST : dispatched

    USER {
        int id PK
        varchar phone UK
        varchar email UK
        userrole role
        languagepreference preferred_language
        varchar village
        bool is_demo
    }
    PATIENT {
        int id PK
        int user_id FK,UK
        int age "0-130"
        varchar blood_group
        varchar abha_id UK
    }
    DOCTOR {
        int id PK
        int user_id FK,UK
        varchar specialization
        varchar license_number UK
        decimal consultation_fee ">= 0"
        bool is_available
    }
    PHARMACY {
        int id PK
        int user_id FK,UK
        varchar pharmacy_name
        varchar license_number UK
        varchar village
        varchar contact_phone
    }
    HOSPITAL {
        int id PK
        int user_id FK,UK
        int total_beds
        int available_beds "0..total_beds"
    }
    APPOINTMENT {
        int id PK
        varchar appointment_number UK
        int patient_id FK
        int doctor_id FK
        date appointment_date
        varchar appointment_time
        appointmenttype appointment_type
        appointmentstatus status
    }
    CONSULTATION {
        int id PK
        int appointment_id FK,UK
        varchar room_id UK
        consultationstatus status
        int quality_rating "1-5"
    }
    PRESCRIPTION {
        int id PK
        varchar prescription_number UK
        int appointment_id FK "nullable"
        int patient_id FK
        int doctor_id FK
        date issue_date
        date valid_until ">= issue_date"
        bool is_dispensed
    }
    PRESCRIPTION_ITEM {
        int id PK
        int prescription_id FK
        int medicine_id FK
        varchar dosage
        varchar frequency
        int duration_days "> 0"
        int quantity_prescribed "> 0"
    }
    MEDICAL_RECORD {
        int id PK
        varchar record_number UK
        int appointment_id FK "nullable"
        int patient_id FK
        int doctor_id FK "nullable"
        recordtype record_type
        jsonb vitals
        bool is_confidential
    }
    MEDICINE {
        int id PK
        varchar name "UK with strength"
        varchar strength "UK with name"
        varchar generic_name
        decimal price ">= 0"
    }
    PHARMACY_INVENTORY {
        int id PK
        int pharmacy_id FK
        int medicine_id FK
        varchar batch_number "UK with pharmacy+medicine"
        int stock_quantity ">= 0"
        decimal unit_price ">= 0"
        date expiry_date
    }
    NOTIFICATION {
        int id PK
        int user_id FK
        notificationtype notification_type
        bool is_read
    }
    REFRESH_TOKEN {
        int id PK
        int user_id FK
        varchar token UK
        timestamptz expires_at
    }
    AUDIT_LOG {
        int id PK
        int user_id FK "nullable"
        varchar action
        varchar resource_type
        varchar resource_id
        timestamptz timestamp
    }
    OTP_VERIFICATION {
        int id PK
        varchar phone
        varchar otp_code
        timestamptz expires_at
    }
    AMBULANCE {
        int id PK
        varchar vehicle_number UK
        ambulancetype ambulance_type
        varchar station_location
        varchar driver_name
        varchar driver_phone
        ambulancestatus status
        bool has_oxygen
        bool has_ventilator
    }
    EMERGENCY_REQUEST {
        int id PK
        varchar request_number UK
        varchar caller_name
        varchar caller_phone
        varchar pickup_village
        int destination_hospital_id FK
        int ambulance_id FK
        triageseverity triage_severity
        text chief_complaint
        emergencyrequeststatus status
        timestamptz dispatched_at
        timestamptz completed_at
    }
```

## Rules the database enforces

| Rule | How |
|---|---|
| A prescription or record written at a visit names the **same patient and doctor** as that visit | Composite FK `(appointment_id, patient_id, doctor_id)` → `appointments(id, patient_id, doctor_id)` |
| A consultation's patient/doctor are the appointment's | Not stored on `consultations` at all (normalised away) |
| A doctor's time slot holds **one live booking** | Partial unique index on `(doctor_id, appointment_date, appointment_time) WHERE status = 'SCHEDULED'` |
| One catalogue entry per medicine strength | Unique `(name, strength)` |
| One row per pharmacy + medicine + batch | Unique `uq_pharmacy_medicine_batch` |
| Money has no rounding drift | `DECIMAL(10,2)` for fees and prices |
| No negative stock/prices; prescription items > 0; rating 1–5; `valid_until >= issue_date`; `available_beds <= total_beds` | `CHECK` constraints (migration `5_check_constraints`) |
| Visits with prescriptions can't be deleted out from under them | `ON DELETE NO ACTION` on the visit FKs |

## Not enforced by the database (application rules)

- A user's role matches the profile row it has (a `DOCTOR` user has a `doctors` row).
- Who may read a record: the patient, and doctors who have treated that patient; confidential records only the author.
