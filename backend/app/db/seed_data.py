from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models import (
    User, UserRole, LanguagePreference,
    Patient, Doctor, Pharmacy, Hospital,
    Medicine, MedicineCategory, PharmacyInventory,
    Appointment, AppointmentType, AppointmentStatus,
    MedicalRecord, RecordType,
    Prescription, PrescriptionItem,
    Consultation, ConsultationStatus, ConsultationType,
    Notification, NotificationType,
    AuditLog,
)

NABHA_VILLAGES = [
    "Nabha City",
    "Alhoran",
    "Duladdi",
    "Rohti Chhanna",
    "Kakrala",
    "Mehas",
    "Bir Bhadson",
    "Thuhi",
    "Sauja",
    "Chhahar",
    "Bhadson",
    "Agnoul",
    "Bauran Kalan"
]


def seed_database(db: Session) -> dict:
    """
    Populates the database with realistic synthetic demo data according to Phase 2 specs:
    - 20 fictional patients
    - 8 fictional doctors
    - 5 fictional pharmacies
    - 30 fictional medicines
    - 15 fictional appointments
    - Sample prescriptions, medical records, consultations, notifications, and audit logs.
    
    All records are clearly flagged as DEMO DATA.
    """
    default_password_hash = get_password_hash("password123")
    stats = {
        "doctors": 0,
        "pharmacies": 0,
        "patients": 0,
        "medicines": 0,
        "inventory": 0,
        "appointments": 0,
        "medical_records": 0,
        "prescriptions": 0,
        "prescription_items": 0,
        "consultations": 0,
        "notifications": 0,
        "audit_logs": 0,
    }

    # -------------------------------------------------------------
    # 1. 8 FICTIONAL DOCTORS (Nabha area)
    # -------------------------------------------------------------
    doctors_info = [
        ("9876543201", "dr.gurpreet.demo@sehatsetu.nabha.in", "Dr. Gurpreet Singh Sandhu [DEMO DATA]", "General Medicine", "MBBS, MD", "Civil Hospital Nabha", 0.0, "Punjabi, Hindi, English", 12, "Senior Medical Officer with deep focus on rural chronic care.", "Nabha City"),
        ("9876543202", "dr.harpreet.demo@sehatsetu.nabha.in", "Dr. Harpreet Kaur Dhillon [DEMO DATA]", "Gynecology & Obstetrics", "MBBS, DGO", "Nabha Mother & Child Care Centre", 100.0, "Punjabi, Hindi", 9, "Specialist in maternal nutrition, safe deliveries, and antenatal care.", "Nabha City"),
        ("9876543203", "dr.jaswinder.demo@sehatsetu.nabha.in", "Dr. Jaswinder Singh Brar [DEMO DATA]", "Pediatrics", "MBBS, MD (Pediatrics)", "Bhadson Primary Health Centre (PHC)", 0.0, "Punjabi, Hindi", 15, "Dedicated child specialist covering Bhadson cluster rural schools and infants.", "Bir Bhadson"),
        ("9876543204", "dr.amanpreet.demo@sehatsetu.nabha.in", "Dr. Amanpreet Singh Gill [DEMO DATA]", "Ayurveda & Chronic Wellness", "BAMS", "Duladdi Rural Health Post", 50.0, "Punjabi, Hindi", 7, "Holistic lifestyle and herbal therapies for metabolic disorders.", "Duladdi"),
        ("9876543205", "dr.simranjit.demo@sehatsetu.nabha.in", "Dr. Simranjit Kaur Mann [DEMO DATA]", "Orthopedics & Joint Care", "MBBS, MS (Ortho)", "Circular Road Specialist Clinic, Nabha", 150.0, "Punjabi, English, Hindi", 11, "Joint preservation and rehabilitation for agricultural workers.", "Nabha City"),
        ("9876543206", "dr.navdeep.demo@sehatsetu.nabha.in", "Dr. Navdeep Singh Cheema [DEMO DATA]", "Cardiology", "MBBS, DM (Cardiology)", "Nabha Heart & Diagnostic Centre", 200.0, "Punjabi, English", 8, "Hypertension control and preventive cardiovascular risk management.", "Nabha City"),
        ("9876543207", "dr.kulwant.demo@sehatsetu.nabha.in", "Dr. Kulwant Kaur Sidhu [DEMO DATA]", "Dermatology", "MBBS, DVD", "Cantt Road Clinic, Nabha", 120.0, "Punjabi, Hindi", 6, "Skin infections, seasonal allergies, and dermatitis in rural farm workers.", "Alhoran"),
        ("9876543208", "dr.ravinder.demo@sehatsetu.nabha.in", "Dr. Ravinder Singh Bajwa [DEMO DATA]", "ENT Specialist", "MBBS, MS (ENT)", "Civil Hospital Nabha", 0.0, "Punjabi, Hindi", 14, "Ear, nose, and throat evaluations, hearing screenings for rural school children.", "Rohti Chhanna")
    ]

    doctor_entities = []
    for idx, (phone, email, name, spec, qual, hosp, fee, langs, exp, bio, vill) in enumerate(doctors_info, 1):
        existing = db.query(User).filter(User.phone == phone).first()
        if not existing:
            user = User(
                phone=phone,
                email=email,
                full_name=name,
                hashed_password=default_password_hash,
                role=UserRole.DOCTOR,
                preferred_language=LanguagePreference.PA,
                village=vill,
                is_active=True,
                is_demo=True,
            )
            db.add(user)
            db.flush()

            doc = Doctor(
                user_id=user.id,
                specialization=spec,
                license_number=f"PB-MC-201{idx}-00{idx}4-DEMO",
                qualification=qual,
                hospital_name=hosp,
                consultation_fee=fee,
                languages_spoken=langs,
                experience_years=exp,
                bio=bio,
                is_available=True,
                is_verified=True,
            )
            db.add(doc)
            db.flush()
            doctor_entities.append(doc)
            stats["doctors"] += 1
        else:
            doc = db.query(Doctor).filter(Doctor.user_id == existing.id).first()
            if doc:
                doctor_entities.append(doc)

    # -------------------------------------------------------------
    # 2. 5 FICTIONAL PHARMACIES
    # -------------------------------------------------------------
    pharmacies_info = [
        ("9876543301", "janaushadhi.demo@sehatsetu.nabha.in", "Jan Aushadhi Kendra Nabha [DEMO DATA]", "Pradhan Mantri Jan Aushadhi Kendra", "PB-RET-2019-092-DEMO", "Near Civil Hospital Gate, Cantt Road, Nabha", "Nabha City", "08:00 AM - 08:30 PM"),
        ("9876543302", "kisan.medicos.demo@sehatsetu.nabha.in", "Kisan Medical Store [DEMO DATA]", "Kisan Medical & Surgical Store Alhoran", "PB-RET-2021-344-DEMO", "Alhoran Gate Road, Nabha Tehsil", "Alhoran", "07:30 AM - 09:30 PM"),
        ("9876543303", "duladdi.pharma.demo@sehatsetu.nabha.in", "Duladdi Village Chemist [DEMO DATA]", "Duladdi Gramin Aushadhalaya", "PB-RET-2022-771-DEMO", "Main Bus Stand Adda, Duladdi, Nabha", "Duladdi", "08:00 AM - 07:00 PM"),
        ("9876543304", "gurunanak.pharma.demo@sehatsetu.nabha.in", "Guru Nanak Medicos [DEMO DATA]", "Guru Nanak Health & Pharmacy Dispensary", "PB-RET-2018-512-DEMO", "Circular Road, Opp. Ripudaman College, Nabha", "Nabha City", "08:00 AM - 10:00 PM"),
        ("9876543305", "bhadson.pharma.demo@sehatsetu.nabha.in", "Bhadson Chemist Hall [DEMO DATA]", "Bhadson Khalsa Medical Hall", "PB-RET-2020-631-DEMO", "Main Bazaar, Bhadson Road, Nabha Tehsil", "Bhadson", "08:00 AM - 09:00 PM"),
    ]

    pharmacy_entities = []
    for phone, email, full_name, store_name, lic, addr, vill, hrs in pharmacies_info:
        existing = db.query(User).filter(User.phone == phone).first()
        if not existing:
            user = User(
                phone=phone,
                email=email,
                full_name=full_name,
                hashed_password=default_password_hash,
                role=UserRole.PHARMACY,
                preferred_language=LanguagePreference.PA,
                village=vill,
                is_active=True,
                is_demo=True,
            )
            db.add(user)
            db.flush()

            pharma = Pharmacy(
                user_id=user.id,
                pharmacy_name=store_name,
                license_number=lic,
                address=addr,
                village=vill,
                contact_phone=phone,
                operating_hours=hrs,
                is_verified=True,
            )
            db.add(pharma)
            db.flush()
            pharmacy_entities.append(pharma)
            stats["pharmacies"] += 1
        else:
            pharma = db.query(Pharmacy).filter(Pharmacy.user_id == existing.id).first()
            if pharma:
                pharmacy_entities.append(pharma)

    # -------------------------------------------------------------
    # 3. 30 FICTIONAL MEDICINES (Essential rural healthcare list)
    # -------------------------------------------------------------
    medicines_catalog = [
        ("Paracetamol", "Paracetamol", "Calpol", MedicineCategory.TABLET, "500 mg", 12.0, False, True, "Antipyretic and analgesic for pain and fever relief."),
        ("Amoxicillin", "Amoxicillin Trihydrate", "Novamox", MedicineCategory.CAPSULE, "500 mg", 45.0, True, True, "Broad spectrum penicillin antibiotic."),
        ("Metformin", "Metformin Hydrochloride", "Glyciphage", MedicineCategory.TABLET, "500 mg", 22.0, True, True, "First-line oral blood glucose medication for type 2 diabetes."),
        ("Amlodipine", "Amlodipine Besylate", "Amlong", MedicineCategory.TABLET, "5 mg", 18.0, True, True, "Calcium channel blocker for hypertension and chest pain."),
        ("Omeprazole", "Omeprazole", "Omez", MedicineCategory.CAPSULE, "20 mg", 35.0, False, True, "Proton pump inhibitor reducing stomach acid and GERD."),
        ("Azithromycin", "Azithromycin", "Azee", MedicineCategory.TABLET, "500 mg", 70.0, True, True, "Macrolide antibiotic for respiratory and skin infections."),
        ("Ibuprofen", "Ibuprofen", "Brufen", MedicineCategory.TABLET, "400 mg", 15.0, False, True, "Nonsteroidal anti-inflammatory drug (NSAID)."),
        ("Cetirizine", "Cetirizine Hydrochloride", "Cetcip", MedicineCategory.TABLET, "10 mg", 14.0, False, True, "Antihistamine for seasonal rhinitis and allergic reactions."),
        ("Ciprofloxacin", "Ciprofloxacin", "Ciplox", MedicineCategory.TABLET, "500 mg", 38.0, True, True, "Fluoroquinolone antibiotic for bacterial infections."),
        ("Pantoprazole", "Pantoprazole Sodium", "Pan-40", MedicineCategory.TABLET, "40 mg", 48.0, True, True, "Gastric acid-reducer for acid reflux and peptic ulcers."),
        ("Losartan", "Losartan Potassium", "Losacar", MedicineCategory.TABLET, "50 mg", 36.0, True, True, "Angiotensin II receptor blocker for high blood pressure."),
        ("Atorvastatin", "Atorvastatin Calcium", "Atorva", MedicineCategory.TABLET, "10 mg", 55.0, True, True, "Statin medication for lowering blood cholesterol and triglycerides."),
        ("Salbutamol Inhaler", "Salbutamol", "Asthalin", MedicineCategory.INHALER, "100 mcg", 110.0, True, True, "Bronchodilator fast-acting inhaler for acute asthma relief."),
        ("ORS Hydration Pack", "Oral Rehydration Salts", "Electral", MedicineCategory.TABLET, "21.8 g", 19.0, False, True, "WHO-formula oral electrolytes for diarrhea and dehydration."),
        ("Metronidazole", "Metronidazole", "Flagyl", MedicineCategory.TABLET, "400 mg", 20.0, True, True, "Antibacterial and antiprotozoal for gastrointestinal infections."),
        ("Cough Relief Syrup", "Dextromethorphan + CPM", "Ascoril-D", MedicineCategory.SYRUP, "100 ml", 65.0, False, True, "Antitussive syrup for dry cough and throat irritation."),
        ("B-Complex + Zinc", "B-Complex, Vitamin C, Zinc", "Becozinc", MedicineCategory.CAPSULE, "Capsule", 32.0, False, True, "Daily multivitamin supplement for immunity and vitality."),
        ("Iron & Folic Acid", "Ferrous Sulfate + Folic Acid", "IFA Red", MedicineCategory.TABLET, "100 mg", 16.0, False, True, "Govt essential tablet for treating and preventing iron-deficiency anemia."),
        ("Albendazole", "Albendazole", "Zentel", MedicineCategory.TABLET, "400 mg", 8.0, False, True, "Single dose anthelmintic for intestinal worm deworming."),
        ("Calcium + Vitamin D3", "Calcium Carbonate + Vit D3", "Shelcal", MedicineCategory.TABLET, "500 mg", 58.0, False, True, "Bone mineral health and osteoporosis prevention."),
        ("Diclofenac Relief Gel", "Diclofenac Diethylamine", "Volini", MedicineCategory.OINTMENT, "30 g", 75.0, False, True, "Topical analgesic for muscular sprains, arthritis, and back pain."),
        ("Betadine Antiseptic", "Povidone Iodine 5%", "Betadine", MedicineCategory.OINTMENT, "100 ml", 80.0, False, True, "Antiseptic solution for wound cleaning and infection prevention."),
        ("Insulin Regular", "Human Insulin Regular", "Huminsulin", MedicineCategory.INJECTION, "40 IU/ml", 145.0, True, True, "Short-acting human insulin for diabetes mellitus glycemic control."),
        ("Ceftriaxone Injection", "Ceftriaxone Sodium", "Monocef", MedicineCategory.INJECTION, "1 g", 65.0, True, True, "Injectable broad-spectrum cephalosporin antibiotic for acute infections."),
        ("Clotrimazole Cream", "Clotrimazole 1%", "Candid", MedicineCategory.OINTMENT, "20 g", 42.0, False, True, "Antifungal topical cream for ringworm, athlete's foot, and skin candidiasis."),
        ("Chlorpheniramine", "Chlorpheniramine Maleate", "Avil", MedicineCategory.TABLET, "4 mg", 10.0, False, True, "Anti-allergy medication for itching, hives, and runny nose."),
        ("Telmisartan", "Telmisartan", "Telma", MedicineCategory.TABLET, "40 mg", 45.0, True, True, "Long-acting antihypertensive agent reducing stroke risk."),
        ("Glibenclamide", "Glibenclamide", "Daonil", MedicineCategory.TABLET, "5 mg", 14.0, True, True, "Sulfonylurea antidiabetic assisting pancreatic insulin release."),
        ("Vitamin C Chewable", "Ascorbic Acid", "Limcee", MedicineCategory.TABLET, "500 mg", 22.0, False, True, "Immune system support and antioxidant supplement."),
        ("Ciprofloxacin Eye Drops", "Ciprofloxacin Ophthalmic", "Ciplox Eye", MedicineCategory.DROPS, "10 ml", 28.0, True, True, "Ophthalmic antibacterial drops for conjunctivitis (eye flu).")
    ]

    medicine_entities = []
    for name, generic, brand, cat, strength, price, rx, ess, desc in medicines_catalog:
        med = db.query(Medicine).filter(Medicine.name == name).first()
        if not med:
            med = Medicine(
                name=name,
                generic_name=generic,
                brand_name=brand,
                category=cat,
                strength=strength,
                price=price,
                is_prescription_required=rx,
                is_essential=ess,
                description=desc,
                is_demo=True,
            )
            db.add(med)
            db.flush()
            stats["medicines"] += 1
        medicine_entities.append(med)

    # -------------------------------------------------------------
    # 4. INVENTORY STOCKING FOR PHARMACIES
    # -------------------------------------------------------------
    for ph_idx, pharma in enumerate(pharmacy_entities, 1):
        for med_idx, med in enumerate(medicine_entities, 1):
            batch_no = f"BAT-NBH-{ph_idx}{med_idx:02d}"
            existing_inv = db.query(PharmacyInventory).filter(
                PharmacyInventory.pharmacy_id == pharma.id,
                PharmacyInventory.medicine_id == med.id,
                PharmacyInventory.batch_number == batch_no
            ).first()
            if not existing_inv:
                inv = PharmacyInventory(
                    pharmacy_id=pharma.id,
                    medicine_id=med.id,
                    batch_number=batch_no,
                    stock_quantity=50 + (ph_idx * 15) + (med_idx * 3),
                    reorder_level=20,
                    unit_price=med.price,
                    expiry_date=date.today() + timedelta(days=180 + (med_idx * 20)),
                    is_available=True,
                )
                db.add(inv)
                stats["inventory"] += 1

    # -------------------------------------------------------------
    # 5. 20 FICTIONAL PATIENTS (Across Nabha villages)
    # -------------------------------------------------------------
    patients_data = [
        ("9876543101", "Balwinder Singh [DEMO DATA]", 54, "Male", "B+", "Alhoran", "Hypertension", "Sulfa drugs", "House 14, Main Gali, Alhoran"),
        ("9876543102", "Manjit Kaur [DEMO DATA]", 42, "Female", "O+", "Duladdi", "Type 2 Diabetes", "None", "Near Gurdwara Sahib, Duladdi"),
        ("9876543103", "Sukhwinder Singh [DEMO DATA]", 28, "Male", "A+", "Rohti Chhanna", "None", "None", "VPO Rohti Chhanna, Nabha"),
        ("9876543104", "Paramjit Kaur [DEMO DATA]", 63, "Female", "AB+", "Kakrala", "Knee Osteoarthritis", "Penicillin", "Village Kakrala, Nabha"),
        ("9876543105", "Jagjit Singh [DEMO DATA]", 35, "Male", "O+", "Mehas", "Seasonal Asthma", "Dust", "Pind Mehas, Nabha"),
        ("9876543106", "Harbhajan Singh [DEMO DATA]", 68, "Male", "B+", "Bir Bhadson", "Coronary Artery Disease", "None", "Bir Bhadson Road, Nabha"),
        ("9876543107", "Kuldeep Kaur [DEMO DATA]", 31, "Female", "B-", "Thuhi", "Mild Anemia", "None", "Village Thuhi, Near Canal"),
        ("9876543108", "Jaspreet Singh [DEMO DATA]", 24, "Male", "A-", "Sauja", "None", "Peanuts", "Village Sauja, Nabha"),
        ("9876543109", "Amritpal Kaur [DEMO DATA]", 49, "Female", "O-", "Chhahar", "Hypothyroidism", "None", "Village Chhahar, Nabha"),
        ("9876543110", "Gurnam Singh [DEMO DATA]", 57, "Male", "AB-", "Agnoul", "Chronic Bronchitis", "None", "Village Agnoul, Tehsil Nabha"),
        ("9876543111", "Simran Kaur [DEMO DATA]", 19, "Female", "A+", "Bauran Kalan", "Migraine", "None", "Village Bauran Kalan"),
        ("9876543112", "Darshan Singh [DEMO DATA]", 62, "Male", "B+", "Nabha City", "Hypertension, High Cholesterol", "Aspirin", "Circular Road, Nabha"),
        ("9876543113", "Jaswinder Kaur [DEMO DATA]", 38, "Female", "O+", "Alhoran", "None", "None", "Alhoran Gate, Nabha"),
        ("9876543114", "Rajinder Singh [DEMO DATA]", 45, "Male", "A+", "Duladdi", "Lower Back Pain", "None", "Duladdi Main Adda"),
        ("9876543115", "Gurmeet Kaur [DEMO DATA]", 52, "Female", "B+", "Rohti Chhanna", "Type 2 Diabetes", "None", "Rohti Chhanna"),
        ("9876543116", "Avtar Singh [DEMO DATA]", 71, "Male", "O+", "Kakrala", "Benign Prostatic Hyperplasia", "None", "Kakrala Village Center"),
        ("9876543117", "Kirandeep Kaur [DEMO DATA]", 27, "Female", "AB+", "Mehas", "Allergic Rhinitis", "Pollen", "Mehas Village"),
        ("9876543118", "Hardial Singh [DEMO DATA]", 59, "Male", "B-", "Bir Bhadson", "Hypertension", "None", "Bir Bhadson"),
        ("9876543119", "Narinder Kaur [DEMO DATA]", 46, "Female", "A+", "Thuhi", "Osteoarthritis", "None", "Thuhi Village"),
        ("9876543120", "Bhupinder Singh [DEMO DATA]", 33, "Male", "O+", "Nabha City", "Gastric Ulcer", "Ibuprofen", "Bhavanigarh Road, Nabha"),
    ]

    patient_entities = []
    for idx, (phone, full_name, age, gender, bg, vill, chronic, allergy, addr) in enumerate(patients_data, 1):
        existing = db.query(User).filter(User.phone == phone).first()
        if not existing:
            user = User(
                phone=phone,
                email=f"patient.{idx}.demo@nabha.punjab",
                full_name=full_name,
                hashed_password=default_password_hash,
                role=UserRole.PATIENT,
                preferred_language=LanguagePreference.PA,
                village=vill,
                is_active=True,
                is_demo=True,
            )
            db.add(user)
            db.flush()

            patient = Patient(
                user_id=user.id,
                age=age,
                gender=gender,
                blood_group=bg,
                emergency_contact=f"98765439{idx:02d}",
                abha_id=f"91-{idx:04d}-{idx*7:04d}-{idx*13:04d}-DEMO",
                chronic_conditions=chronic,
                allergies=allergy,
                address=addr,
            )
            db.add(patient)
            db.flush()
            patient_entities.append(patient)
            stats["patients"] += 1
        else:
            patient = db.query(Patient).filter(Patient.user_id == existing.id).first()
            if patient:
                patient_entities.append(patient)

    # -------------------------------------------------------------
    # 6. 15 FICTIONAL APPOINTMENTS
    # -------------------------------------------------------------
    appointment_slots = [
        ("10:00 AM", AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED, "Routine blood pressure checkup and diabetes follow-up."),
        ("10:30 AM", AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED, "Antenatal checkup and ultrasound scan review."),
        ("11:00 AM", AppointmentType.TELECONSULTATION, AppointmentStatus.COMPLETED, "High fever and persistent cough for 4 days."),
        ("11:30 AM", AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED, "Severe bilateral knee pain while walking in fields."),
        ("12:00 PM", AppointmentType.TELECONSULTATION, AppointmentStatus.SCHEDULED, "Skin redness and itching on hands after harvest."),
        ("12:30 PM", AppointmentType.IN_PERSON, AppointmentStatus.SCHEDULED, "Chest tightness on moderate exertion."),
        ("02:00 PM", AppointmentType.IN_PERSON, AppointmentStatus.SCHEDULED, "Ear pain and ringing sound after viral cold."),
        ("02:30 PM", AppointmentType.TELECONSULTATION, AppointmentStatus.SCHEDULED, "Seasonal allergy consultation and inhaler review."),
        ("03:00 PM", AppointmentType.IN_PERSON, AppointmentStatus.SCHEDULED, "Blood glucose monitoring and diet consultation."),
        ("03:30 PM", AppointmentType.IN_PERSON, AppointmentStatus.SCHEDULED, "Follow-up for lumbar back pain and physiotherapy."),
        ("04:00 PM", AppointmentType.TELECONSULTATION, AppointmentStatus.CANCELLED, "Patient had transportation issues from village Kakrala."),
        ("04:30 PM", AppointmentType.IN_PERSON, AppointmentStatus.SCHEDULED, "Digestive acidity and morning nausea."),
        ("05:00 PM", AppointmentType.IN_PERSON, AppointmentStatus.SCHEDULED, "Pediatric immunization review for 6-month infant."),
        ("05:30 PM", AppointmentType.TELECONSULTATION, AppointmentStatus.SCHEDULED, "Ayurvedic consultation for joint stiffness."),
        ("06:00 PM", AppointmentType.IN_PERSON, AppointmentStatus.SCHEDULED, "General health fitness checkup for agricultural job."),
    ]

    appointment_entities = []
    for idx, (slot_time, app_type, status, symp) in enumerate(appointment_slots, 1):
        apt_no = f"APT-NBH-2026-{idx:04d}"
        existing_apt = db.query(Appointment).filter(Appointment.appointment_number == apt_no).first()
        if not existing_apt and patient_entities and doctor_entities:
            pat = patient_entities[(idx - 1) % len(patient_entities)]
            doc = doctor_entities[(idx - 1) % len(doctor_entities)]
            apt_date = date.today() + timedelta(days=(idx % 5) - 2)

            apt = Appointment(
                appointment_number=apt_no,
                patient_id=pat.id,
                doctor_id=doc.id,
                appointment_date=apt_date,
                appointment_time=slot_time,
                appointment_type=app_type,
                status=status,
                symptom_summary=symp,
                notes="Patient requested Punjabi consultation." if idx % 2 == 0 else None,
                is_demo=True,
            )
            db.add(apt)
            db.flush()
            appointment_entities.append(apt)
            stats["appointments"] += 1
        elif existing_apt:
            appointment_entities.append(existing_apt)

    # -------------------------------------------------------------
    # 7. SAMPLE MEDICAL RECORDS
    # -------------------------------------------------------------
    sample_records = [
        ("REC-NBH-2026-0001", 0, 0, RecordType.GENERAL_VISIT, "Routine Hypertension OPD Visit", "Primary Essential Hypertension (Controlled)", "Patient reports mild morning headaches. Advised low sodium diet.", '{"bp": "138/88", "pulse": 76, "weight_kg": 72, "spo2": 98}'),
        ("REC-NBH-2026-0002", 1, 0, RecordType.DIAGNOSIS, "Type 2 Diabetes Screening Report", "Type 2 Diabetes Mellitus with Mild Neuropathy", "Fasting blood sugar 164 mg/dL, HbA1c 7.4%. Started on Metformin.", '{"fbs_mg_dl": 164, "hba1c": 7.4, "bp": "124/82", "weight_kg": 68}'),
        ("REC-NBH-2026-0003", 2, 2, RecordType.LAB_REPORT, "Pediatric Wellness & Growth Record", "Normal Physical Development (Age Appropriate)", "Immunization up to date. Prescribed Vitamin D3 drops.", '{"weight_kg": 14.2, "height_cm": 96, "pulse": 98, "temp_f": 98.4}'),
        ("REC-NBH-2026-0004", 3, 4, RecordType.GENERAL_VISIT, "Orthopedic Joint Assessment", "Bilateral Knee Osteoarthritis (Grade 2)", "Crepitus noted in right knee. Advised quadriceps strengthening exercises.", '{"bp": "130/80", "weight_kg": 64, "rom_degrees": 110}'),
        ("REC-NBH-2026-0005", 4, 0, RecordType.GENERAL_VISIT, "Seasonal Bronchitis Evaluation", "Acute Bronchial Spasm secondary to Harvest Dust", "Bilateral wheezing. Prescribed Salbutamol inhaler and antihistamines.", '{"spo2": 96, "rr": 20, "pulse": 84, "temp_f": 99.1}'),
        ("REC-NBH-2026-0006", 5, 5, RecordType.DIAGNOSIS, "Cardiology Echo & ECG Review", "Ischemic Heart Disease (Stable Angina)", "ECG shows T-wave inversions in V4-V6. Advised lifestyle modifications.", '{"bp": "142/90", "pulse": 72, "cholesterol_mg_dl": 224}'),
    ]

    for rec_no, p_idx, d_idx, rec_type, title, diag, notes, vitals in sample_records:
        existing_rec = db.query(MedicalRecord).filter(MedicalRecord.record_number == rec_no).first()
        if not existing_rec and patient_entities and doctor_entities:
            rec = MedicalRecord(
                record_number=rec_no,
                patient_id=patient_entities[p_idx % len(patient_entities)].id,
                doctor_id=doctor_entities[d_idx % len(doctor_entities)].id,
                record_type=rec_type,
                title=title,
                diagnosis=diag,
                clinical_notes=notes,
                vitals=vitals,
                record_date=date.today() - timedelta(days=p_idx * 4),
                is_confidential=False,
                is_demo=True,
            )
            db.add(rec)
            stats["medical_records"] += 1

    # -------------------------------------------------------------
    # 8. SAMPLE PRESCRIPTIONS & PRESCRIPTION ITEMS
    # -------------------------------------------------------------
    sample_prescriptions = [
        ("RX-NBH-2026-0001", 0, 0, 0, "Essential Hypertension", "Take Amlodipine daily at 8:00 AM after breakfast. Reduce salt intake.", [
            ("Amlodipine", "5 mg", "1-0-0 after breakfast", 30, 30, "Do not skip doses"),
            ("Paracetamol", "500 mg", "SOS (as needed for headache)", 5, 10, "Take with plenty of water")
        ]),
        ("RX-NBH-2026-0002", 1, 1, 1, "Type-2 Diabetes & Dyspepsia", "Maintain 45 minutes daily walking along Duladdi village road.", [
            ("Metformin", "500 mg", "1-0-1 after meals", 30, 60, "Take with meals"),
            ("Pantoprazole", "40 mg", "1-0-0 empty stomach", 14, 14, "Take 30 mins before breakfast")
        ]),
        ("RX-NBH-2026-0003", 2, 2, 0, "Acute Respiratory Tract Infection", "Steam inhalation twice daily. Drink warm water.", [
            ("Amoxicillin", "500 mg", "1-0-1 after food", 5, 10, "Complete full antibiotic course"),
            ("Cetirizine", "10 mg", "0-0-1 at night", 5, 5, "May cause mild drowsiness"),
            ("Cough Relief Syrup", "10 ml", "1-1-1 three times daily", 5, 1, "Shake well before use")
        ]),
        ("RX-NBH-2026-0004", 3, 3, 4, "Bilateral Knee Osteoarthritis", "Avoid sitting on floor. Apply diclofenac gel gently without rubbing.", [
            ("Calcium + Vitamin D3", "500 mg", "0-1-0 after lunch", 30, 30, "Calcium supplement"),
            ("Diclofenac Relief Gel", "Topical", "Apply twice daily", 15, 1, "External use only")
        ]),
    ]

    for rx_no, apt_idx, p_idx, d_idx, diag, inst, items in sample_prescriptions:
        existing_rx = db.query(Prescription).filter(Prescription.prescription_number == rx_no).first()
        if not existing_rx and patient_entities and doctor_entities:
            apt_id = appointment_entities[apt_idx].id if apt_idx < len(appointment_entities) else None
            rx = Prescription(
                prescription_number=rx_no,
                appointment_id=apt_id,
                patient_id=patient_entities[p_idx % len(patient_entities)].id,
                doctor_id=doctor_entities[d_idx % len(doctor_entities)].id,
                issue_date=date.today() - timedelta(days=apt_idx * 2),
                valid_until=date.today() + timedelta(days=30),
                diagnosis=diag,
                instructions=inst,
                is_dispensed=(apt_idx % 2 == 1),
                is_demo=True,
            )
            db.add(rx)
            db.flush()
            stats["prescriptions"] += 1

            for med_name, dosage, freq, dur, qty, item_inst in items:
                target_med = next((m for m in medicine_entities if m.name == med_name), medicine_entities[0])
                rx_item = PrescriptionItem(
                    prescription_id=rx.id,
                    medicine_id=target_med.id,
                    dosage=dosage,
                    frequency=freq,
                    duration_days=dur,
                    quantity_prescribed=qty,
                    instructions=item_inst,
                )
                db.add(rx_item)
                stats["prescription_items"] += 1

    # -------------------------------------------------------------
    # 9. SAMPLE CONSULTATIONS (Telemedicine sessions)
    # -------------------------------------------------------------
    tele_appointments = [a for a in appointment_entities if a.appointment_type == AppointmentType.TELECONSULTATION]
    for idx, apt in enumerate(tele_appointments, 1):
        existing_consult = db.query(Consultation).filter(Consultation.appointment_id == apt.id).first()
        if not existing_consult:
            consult = Consultation(
                appointment_id=apt.id,
                doctor_id=apt.doctor_id,
                patient_id=apt.patient_id,
                room_id=f"sehatsetu-nabha-room-{apt.appointment_number.lower()}",
                status=ConsultationStatus.COMPLETED if apt.status == AppointmentStatus.COMPLETED else ConsultationStatus.INITIATED,
                consultation_type=ConsultationType.VIDEO if idx % 2 == 1 else ConsultationType.AUDIO,
                start_time=datetime.now(timezone.utc) - timedelta(minutes=60 * idx),
                end_time=datetime.now(timezone.utc) - timedelta(minutes=(60 * idx) - 15) if apt.status == AppointmentStatus.COMPLETED else None,
                doctor_notes=f"Teleconsultation conducted smoothly. Patient connected from village via SehatSetu low-bandwidth mode." if apt.status == AppointmentStatus.COMPLETED else None,
                quality_rating=4 if apt.status == AppointmentStatus.COMPLETED else None,
                low_bandwidth_fallback=True,
            )
            db.add(consult)
            stats["consultations"] += 1

    # -------------------------------------------------------------
    # 10. SAMPLE NOTIFICATIONS & AUDIT LOGS
    # -------------------------------------------------------------
    sample_notifications = [
        (0, "ਮੁਲਾਕਾਤ ਰੀਮਾਈਂਡਰ (Appointment Reminder)", "ਤੁਹਾਡੀ ਮੁਲਾਕਾਤ ਕੱਲ੍ਹ ਸਵੇਰੇ 10:00 ਵਜੇ ਸਿਵਲ ਹਸਪਤਾਲ ਨਾਭਾ ਵਿਖੇ ਡਾ. ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਨਾਲ ਤਹਿ ਹੈ।", NotificationType.APPOINTMENT_REMINDER),
        (1, "ਨਵੀਂ ਪਰਚੀ ਉਪਲਬਧ (Prescription Ready)", "ਤੁਹਾਡੀ ਨਵੀਂ ਡਿਜੀਟਲ ਪਰਚੀ ਜਾਰੀ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ। ਜਨ ਔਸ਼ਧੀ ਕੇਂਦਰ ਤੋਂ ਦਵਾਈਆਂ ਲੈ ਸਕਦੇ ਹੋ।", NotificationType.PRESCRIPTION_READY),
        (0, "ਸਟਾਕ ਚੇਤਾਵਨੀ (Low Stock Alert)", "Kisan Medical Store: Paracetamol 500mg ਦਾ ਸਟਾਕ 20 ਤੋਂ ਘੱਟ ਰਹਿ ਗਿਆ ਹੈ।", NotificationType.LOW_STOCK_ALERT),
    ]

    for u_idx, title, msg, n_type in sample_notifications:
        target_user = patient_entities[u_idx].user if u_idx < len(patient_entities) else doctor_entities[0].user
        notif = Notification(
            user_id=target_user.id,
            title=title,
            message=msg,
            notification_type=n_type,
            is_read=False,
            channel="IN_APP",
            language="pa",
        )
        db.add(notif)
        stats["notifications"] += 1

    sample_audits = [
        (doctor_entities[0].user_id, "VIEW_MEDICAL_RECORD", "MedicalRecord", "REC-NBH-2026-0001", "127.0.0.1", "Doctor reviewed patient vitals before consultation"),
        (patient_entities[0].user_id, "AUTH_LOGIN", "User", str(patient_entities[0].user_id), "127.0.0.1", "Patient logged in via SehatSetu web portal"),
        (doctor_entities[1].user_id, "CREATE_PRESCRIPTION", "Prescription", "RX-NBH-2026-0002", "127.0.0.1", "Doctor issued digital prescription for Metformin"),
    ]

    for uid, action, rtype, rid, ip, det in sample_audits:
        audit = AuditLog(
            user_id=uid,
            action=action,
            resource_type=rtype,
            resource_id=rid,
            ip_address=ip,
            user_agent="SehatSetu-App/1.0 (Darwin/macOS; en-IN)",
            status="SUCCESS",
            details=det,
        )
        db.add(audit)
        stats["audit_logs"] += 1

    db.commit()
    return stats
