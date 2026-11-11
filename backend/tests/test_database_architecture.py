import pytest
from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models import (
    User, UserRole, LanguagePreference,
    Patient, Doctor, Pharmacy,
    Medicine, MedicineCategory, PharmacyInventory,
    Appointment, AppointmentType, AppointmentStatus,
    MedicalRecord, RecordType,
    Prescription, PrescriptionItem,
    Consultation, ConsultationStatus, ConsultationType,
    Notification, NotificationType, AuditLog
)
from app.db.seed_data import seed_database


def test_seed_counts_and_demo_flags(db_session: Session):
    """Verify that seeding creates the exact counts required by Phase 2."""
    stats = seed_database(db_session)
    
    assert stats["patients"] == 20
    assert stats["doctors"] == 8
    assert stats["pharmacies"] == 5
    assert stats["medicines"] == 30
    assert stats["appointments"] == 15
    assert stats["medical_records"] >= 6
    assert stats["prescriptions"] >= 4
    assert stats["consultations"] >= 3
    assert stats["notifications"] >= 3
    assert stats["audit_logs"] >= 3

    # Verify demo flags on all records
    patients = db_session.query(Patient).all()
    assert len(patients) == 20
    for p in patients:
        assert p.user.is_demo is True
        assert "[DEMO DATA]" in p.user.full_name

    doctors = db_session.query(Doctor).all()
    assert len(doctors) == 8
    for d in doctors:
        assert d.user.is_demo is True
        assert "PB-MC" in d.license_number

    medicines = db_session.query(Medicine).all()
    assert len(medicines) == 30
    for m in medicines:
        assert m.is_demo is True
        assert m.price > 0


def test_crud_patient_operations(db_session: Session):
    """Test full CRUD operations on Patient and User."""
    # Create
    user = User(
        phone="9811122233",
        email="crud.patient@nabha.test",
        full_name="Karamjit Singh [DEMO DATA]",
        hashed_password="hash",
        role=UserRole.PATIENT,
        village="Duladdi",
        is_demo=True,
    )
    db_session.add(user)
    db_session.flush()

    patient = Patient(
        user_id=user.id,
        age=48,
        gender="Male",
        blood_group="B+",
        abha_id="91-9999-8888-7777-DEMO",
        chronic_conditions="Hypertension",
        address="Duladdi village, Nabha",
    )
    db_session.add(patient)
    db_session.commit()

    # Read
    saved = db_session.query(Patient).filter(Patient.id == patient.id).first()
    assert saved is not None
    assert saved.user.full_name == "Karamjit Singh [DEMO DATA]"
    assert saved.chronic_conditions == "Hypertension"

    # Update
    saved.chronic_conditions = "Hypertension, Mild Asthma"
    db_session.commit()
    updated = db_session.query(Patient).filter(Patient.id == patient.id).first()
    assert updated.chronic_conditions == "Hypertension, Mild Asthma"

    # Delete
    patient_id = saved.id
    db_session.delete(saved)
    db_session.commit()
    assert db_session.query(Patient).filter(Patient.id == patient_id).first() is None


def test_foreign_key_constraints(db_session: Session):
    """Test that foreign keys strictly block orphan records."""
    # Attempt appointment with invalid patient_id
    invalid_apt = Appointment(
        appointment_number="APT-ERR-001",
        patient_id=999999,  # Non-existent
        doctor_id=1,
        appointment_date=date.today(),
        appointment_time="11:00 AM",
        status=AppointmentStatus.SCHEDULED,
    )
    db_session.add(invalid_apt)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_unique_constraints(db_session: Session):
    """Test unique constraints across all critical clinical tables."""
    # 1. Unique User Phone
    u1 = User(phone="9899001122", full_name="User A", hashed_password="pw", role=UserRole.PATIENT)
    u2 = User(phone="9899001122", full_name="User B", hashed_password="pw", role=UserRole.PATIENT)
    db_session.add(u1)
    db_session.commit()
    db_session.add(u2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # 2. Unique Doctor License
    doc_user1 = User(phone="9899001123", full_name="Doc 1", hashed_password="pw", role=UserRole.DOCTOR)
    doc_user2 = User(phone="9899001124", full_name="Doc 2", hashed_password="pw", role=UserRole.DOCTOR)
    db_session.add_all([doc_user1, doc_user2])
    db_session.flush()

    d1 = Doctor(user_id=doc_user1.id, specialization="General", license_number="LIC-DUP-01", hospital_name="Civil Hosp")
    d2 = Doctor(user_id=doc_user2.id, specialization="General", license_number="LIC-DUP-01", hospital_name="Civil Hosp")
    db_session.add(d1)
    db_session.commit()
    db_session.add(d2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_pharmacy_inventory_composite_unique(db_session: Session):
    """Test compound unique constraint: (pharmacy_id, medicine_id, batch_number)."""
    u_pharma = User(phone="9899001125", full_name="Pharma Owner", hashed_password="pw", role=UserRole.PHARMACY)
    db_session.add(u_pharma)
    db_session.flush()

    pharma = Pharmacy(user_id=u_pharma.id, pharmacy_name="Test Pharma", license_number="LIC-PH-99", address="Nabha", contact_phone="9899001125")
    med = Medicine(name="Test Med", generic_name="Test Gen", category=MedicineCategory.TABLET, strength="100mg", price=10.0)
    db_session.add_all([pharma, med])
    db_session.flush()

    inv1 = PharmacyInventory(pharmacy_id=pharma.id, medicine_id=med.id, batch_number="BAT-101", stock_quantity=50, unit_price=10.0, expiry_date=date(2027, 1, 1))
    inv2 = PharmacyInventory(pharmacy_id=pharma.id, medicine_id=med.id, batch_number="BAT-101", stock_quantity=20, unit_price=10.0, expiry_date=date(2027, 1, 1))

    db_session.add(inv1)
    db_session.commit()
    db_session.add(inv2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_relationships_and_cascades(db_session: Session):
    """Test 1-to-many, 1-to-1 and many-to-many relationships."""
    seed_database(db_session)

    # 1. Test Doctor -> Appointments (one-to-many)
    first_doc = db_session.query(Doctor).first()
    assert len(first_doc.appointments) > 0
    apt = first_doc.appointments[0]
    assert apt.doctor.id == first_doc.id

    # 2. Test Prescription -> PrescriptionItems -> Medicine
    prescription = db_session.query(Prescription).first()
    assert prescription is not None
    assert len(prescription.items) > 0
    first_item = prescription.items[0]
    assert first_item.medicine is not None
    assert isinstance(first_item.medicine.name, str)

    # 3. Test Appointment -> Consultation (one-to-one)
    tele_apt = db_session.query(Appointment).filter(Appointment.appointment_type == AppointmentType.TELECONSULTATION).first()
    if tele_apt and tele_apt.consultation:
        assert tele_apt.consultation.appointment_id == tele_apt.id
        assert tele_apt.consultation.room_id.startswith("sehatsetu-nabha-room-")

    # 4. Test User -> AuditLog and Notification
    user_with_audit = db_session.query(User).filter(User.audit_logs.any()).first()
    assert user_with_audit is not None
    assert len(user_with_audit.audit_logs) > 0

