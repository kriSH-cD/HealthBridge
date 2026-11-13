// Idempotent synthetic demo data for Nabha; every record is flagged as DEMO DATA.
import { hashPassword } from "./lib/security.js";

/** Today's local calendar date plus n days, as UTC midnight (what Prisma expects for @db.Date). */
const dayOffset = (n) => {
  const d = new Date(`${new Date().toLocaleDateString("en-CA")}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};
const pad = (n, width) => String(n).padStart(width, "0");

const doctorsInfo = [
  ["9876543201", "dr.gurpreet.demo@sehatsetu.nabha.in", "Dr. Gurpreet Singh Sandhu [DEMO DATA]", "General Medicine", "MBBS, MD", "Civil Hospital Nabha", 0.0, "Punjabi, Hindi, English", 12, "Senior Medical Officer with deep focus on rural chronic care.", "Nabha City"],
  ["9876543202", "dr.harpreet.demo@sehatsetu.nabha.in", "Dr. Harpreet Kaur Dhillon [DEMO DATA]", "Gynecology & Obstetrics", "MBBS, DGO", "Nabha Mother & Child Care Centre", 100.0, "Punjabi, Hindi", 9, "Specialist in maternal nutrition, safe deliveries, and antenatal care.", "Nabha City"],
  ["9876543203", "dr.jaswinder.demo@sehatsetu.nabha.in", "Dr. Jaswinder Singh Brar [DEMO DATA]", "Pediatrics", "MBBS, MD (Pediatrics)", "Bhadson Primary Health Centre (PHC)", 0.0, "Punjabi, Hindi", 15, "Dedicated child specialist covering Bhadson cluster rural schools and infants.", "Bir Bhadson"],
  ["9876543204", "dr.amanpreet.demo@sehatsetu.nabha.in", "Dr. Amanpreet Singh Gill [DEMO DATA]", "Ayurveda & Chronic Wellness", "BAMS", "Duladdi Rural Health Post", 50.0, "Punjabi, Hindi", 7, "Holistic lifestyle and herbal therapies for metabolic disorders.", "Duladdi"],
  ["9876543205", "dr.simranjit.demo@sehatsetu.nabha.in", "Dr. Simranjit Kaur Mann [DEMO DATA]", "Orthopedics & Joint Care", "MBBS, MS (Ortho)", "Circular Road Specialist Clinic, Nabha", 150.0, "Punjabi, English, Hindi", 11, "Joint preservation and rehabilitation for agricultural workers.", "Nabha City"],
  ["9876543206", "dr.navdeep.demo@sehatsetu.nabha.in", "Dr. Navdeep Singh Cheema [DEMO DATA]", "Cardiology", "MBBS, DM (Cardiology)", "Nabha Heart & Diagnostic Centre", 200.0, "Punjabi, English", 8, "Hypertension control and preventive cardiovascular risk management.", "Nabha City"],
  ["9876543207", "dr.kulwant.demo@sehatsetu.nabha.in", "Dr. Kulwant Kaur Sidhu [DEMO DATA]", "Dermatology", "MBBS, DVD", "Cantt Road Clinic, Nabha", 120.0, "Punjabi, Hindi", 6, "Skin infections, seasonal allergies, and dermatitis in rural farm workers.", "Alhoran"],
  ["9876543208", "dr.ravinder.demo@sehatsetu.nabha.in", "Dr. Ravinder Singh Bajwa [DEMO DATA]", "ENT Specialist", "MBBS, MS (ENT)", "Civil Hospital Nabha", 0.0, "Punjabi, Hindi", 14, "Ear, nose, and throat evaluations, hearing screenings for rural school children.", "Rohti Chhanna"],
];

const pharmaciesInfo = [
  ["9876543301", "janaushadhi.demo@sehatsetu.nabha.in", "Jan Aushadhi Kendra Nabha [DEMO DATA]", "Pradhan Mantri Jan Aushadhi Kendra", "PB-RET-2019-092-DEMO", "Near Civil Hospital Gate, Cantt Road, Nabha", "Nabha City", "08:00 AM - 08:30 PM"],
  ["9876543302", "kisan.medicos.demo@sehatsetu.nabha.in", "Kisan Medical Store [DEMO DATA]", "Kisan Medical & Surgical Store Alhoran", "PB-RET-2021-344-DEMO", "Alhoran Gate Road, Nabha Tehsil", "Alhoran", "07:30 AM - 09:30 PM"],
  ["9876543303", "duladdi.pharma.demo@sehatsetu.nabha.in", "Duladdi Village Chemist [DEMO DATA]", "Duladdi Gramin Aushadhalaya", "PB-RET-2022-771-DEMO", "Main Bus Stand Adda, Duladdi, Nabha", "Duladdi", "08:00 AM - 07:00 PM"],
  ["9876543304", "gurunanak.pharma.demo@sehatsetu.nabha.in", "Guru Nanak Medicos [DEMO DATA]", "Guru Nanak Health & Pharmacy Dispensary", "PB-RET-2018-512-DEMO", "Circular Road, Opp. Ripudaman College, Nabha", "Nabha City", "08:00 AM - 10:00 PM"],
  ["9876543305", "bhadson.pharma.demo@sehatsetu.nabha.in", "Bhadson Chemist Hall [DEMO DATA]", "Bhadson Khalsa Medical Hall", "PB-RET-2020-631-DEMO", "Main Bazaar, Bhadson Road, Nabha Tehsil", "Bhadson", "08:00 AM - 09:00 PM"],
];

const medicinesCatalog = [
  ["Paracetamol", "Paracetamol", "Calpol", "TABLET", "500 mg", 12.0, false, true, "Antipyretic and analgesic for pain and fever relief."],
  ["Amoxicillin", "Amoxicillin Trihydrate", "Novamox", "CAPSULE", "500 mg", 45.0, true, true, "Broad spectrum penicillin antibiotic."],
  ["Metformin", "Metformin Hydrochloride", "Glyciphage", "TABLET", "500 mg", 22.0, true, true, "First-line oral blood glucose medication for type 2 diabetes."],
  ["Amlodipine", "Amlodipine Besylate", "Amlong", "TABLET", "5 mg", 18.0, true, true, "Calcium channel blocker for hypertension and chest pain."],
  ["Omeprazole", "Omeprazole", "Omez", "CAPSULE", "20 mg", 35.0, false, true, "Proton pump inhibitor reducing stomach acid and GERD."],
  ["Azithromycin", "Azithromycin", "Azee", "TABLET", "500 mg", 70.0, true, true, "Macrolide antibiotic for respiratory and skin infections."],
  ["Ibuprofen", "Ibuprofen", "Brufen", "TABLET", "400 mg", 15.0, false, true, "Nonsteroidal anti-inflammatory drug (NSAID)."],
  ["Cetirizine", "Cetirizine Hydrochloride", "Cetcip", "TABLET", "10 mg", 14.0, false, true, "Antihistamine for seasonal rhinitis and allergic reactions."],
  ["Ciprofloxacin", "Ciprofloxacin", "Ciplox", "TABLET", "500 mg", 38.0, true, true, "Fluoroquinolone antibiotic for bacterial infections."],
  ["Pantoprazole", "Pantoprazole Sodium", "Pan-40", "TABLET", "40 mg", 48.0, true, true, "Gastric acid-reducer for acid reflux and peptic ulcers."],
  ["Losartan", "Losartan Potassium", "Losacar", "TABLET", "50 mg", 36.0, true, true, "Angiotensin II receptor blocker for high blood pressure."],
  ["Atorvastatin", "Atorvastatin Calcium", "Atorva", "TABLET", "10 mg", 55.0, true, true, "Statin medication for lowering blood cholesterol and triglycerides."],
  ["Salbutamol Inhaler", "Salbutamol", "Asthalin", "INHALER", "100 mcg", 110.0, true, true, "Bronchodilator fast-acting inhaler for acute asthma relief."],
  ["ORS Hydration Pack", "Oral Rehydration Salts", "Electral", "TABLET", "21.8 g", 19.0, false, true, "WHO-formula oral electrolytes for diarrhea and dehydration."],
  ["Metronidazole", "Metronidazole", "Flagyl", "TABLET", "400 mg", 20.0, true, true, "Antibacterial and antiprotozoal for gastrointestinal infections."],
  ["Cough Relief Syrup", "Dextromethorphan + CPM", "Ascoril-D", "SYRUP", "100 ml", 65.0, false, true, "Antitussive syrup for dry cough and throat irritation."],
  ["B-Complex + Zinc", "B-Complex, Vitamin C, Zinc", "Becozinc", "CAPSULE", "Capsule", 32.0, false, true, "Daily multivitamin supplement for immunity and vitality."],
  ["Iron & Folic Acid", "Ferrous Sulfate + Folic Acid", "IFA Red", "TABLET", "100 mg", 16.0, false, true, "Govt essential tablet for treating and preventing iron-deficiency anemia."],
  ["Albendazole", "Albendazole", "Zentel", "TABLET", "400 mg", 8.0, false, true, "Single dose anthelmintic for intestinal worm deworming."],
  ["Calcium + Vitamin D3", "Calcium Carbonate + Vit D3", "Shelcal", "TABLET", "500 mg", 58.0, false, true, "Bone mineral health and osteoporosis prevention."],
  ["Diclofenac Relief Gel", "Diclofenac Diethylamine", "Volini", "OINTMENT", "30 g", 75.0, false, true, "Topical analgesic for muscular sprains, arthritis, and back pain."],
  ["Betadine Antiseptic", "Povidone Iodine 5%", "Betadine", "OINTMENT", "100 ml", 80.0, false, true, "Antiseptic solution for wound cleaning and infection prevention."],
  ["Insulin Regular", "Human Insulin Regular", "Huminsulin", "INJECTION", "40 IU/ml", 145.0, true, true, "Short-acting human insulin for diabetes mellitus glycemic control."],
  ["Ceftriaxone Injection", "Ceftriaxone Sodium", "Monocef", "INJECTION", "1 g", 65.0, true, true, "Injectable broad-spectrum cephalosporin antibiotic for acute infections."],
  ["Clotrimazole Cream", "Clotrimazole 1%", "Candid", "OINTMENT", "20 g", 42.0, false, true, "Antifungal topical cream for ringworm, athlete's foot, and skin candidiasis."],
  ["Chlorpheniramine", "Chlorpheniramine Maleate", "Avil", "TABLET", "4 mg", 10.0, false, true, "Anti-allergy medication for itching, hives, and runny nose."],
  ["Telmisartan", "Telmisartan", "Telma", "TABLET", "40 mg", 45.0, true, true, "Long-acting antihypertensive agent reducing stroke risk."],
  ["Glibenclamide", "Glibenclamide", "Daonil", "TABLET", "5 mg", 14.0, true, true, "Sulfonylurea antidiabetic assisting pancreatic insulin release."],
  ["Vitamin C Chewable", "Ascorbic Acid", "Limcee", "TABLET", "500 mg", 22.0, false, true, "Immune system support and antioxidant supplement."],
  ["Ciprofloxacin Eye Drops", "Ciprofloxacin Ophthalmic", "Ciplox Eye", "DROPS", "10 ml", 28.0, true, true, "Ophthalmic antibacterial drops for conjunctivitis (eye flu)."],
];

const patientsData = [
  ["9876543101", "Balwinder Singh [DEMO DATA]", 54, "Male", "B+", "Alhoran", "Hypertension", "Sulfa drugs", "House 14, Main Gali, Alhoran"],
  ["9876543102", "Manjit Kaur [DEMO DATA]", 42, "Female", "O+", "Duladdi", "Type 2 Diabetes", "None", "Near Gurdwara Sahib, Duladdi"],
  ["9876543103", "Sukhwinder Singh [DEMO DATA]", 28, "Male", "A+", "Rohti Chhanna", "None", "None", "VPO Rohti Chhanna, Nabha"],
  ["9876543104", "Paramjit Kaur [DEMO DATA]", 63, "Female", "AB+", "Kakrala", "Knee Osteoarthritis", "Penicillin", "Village Kakrala, Nabha"],
  ["9876543105", "Jagjit Singh [DEMO DATA]", 35, "Male", "O+", "Mehas", "Seasonal Asthma", "Dust", "Pind Mehas, Nabha"],
  ["9876543106", "Harbhajan Singh [DEMO DATA]", 68, "Male", "B+", "Bir Bhadson", "Coronary Artery Disease", "None", "Bir Bhadson Road, Nabha"],
  ["9876543107", "Kuldeep Kaur [DEMO DATA]", 31, "Female", "B-", "Thuhi", "Mild Anemia", "None", "Village Thuhi, Near Canal"],
  ["9876543108", "Jaspreet Singh [DEMO DATA]", 24, "Male", "A-", "Sauja", "None", "Peanuts", "Village Sauja, Nabha"],
  ["9876543109", "Amritpal Kaur [DEMO DATA]", 49, "Female", "O-", "Chhahar", "Hypothyroidism", "None", "Village Chhahar, Nabha"],
  ["9876543110", "Gurnam Singh [DEMO DATA]", 57, "Male", "AB-", "Agnoul", "Chronic Bronchitis", "None", "Village Agnoul, Tehsil Nabha"],
  ["9876543111", "Simran Kaur [DEMO DATA]", 19, "Female", "A+", "Bauran Kalan", "Migraine", "None", "Village Bauran Kalan"],
  ["9876543112", "Darshan Singh [DEMO DATA]", 62, "Male", "B+", "Nabha City", "Hypertension, High Cholesterol", "Aspirin", "Circular Road, Nabha"],
  ["9876543113", "Jaswinder Kaur [DEMO DATA]", 38, "Female", "O+", "Alhoran", "None", "None", "Alhoran Gate, Nabha"],
  ["9876543114", "Rajinder Singh [DEMO DATA]", 45, "Male", "A+", "Duladdi", "Lower Back Pain", "None", "Duladdi Main Adda"],
  ["9876543115", "Gurmeet Kaur [DEMO DATA]", 52, "Female", "B+", "Rohti Chhanna", "Type 2 Diabetes", "None", "Rohti Chhanna"],
  ["9876543116", "Avtar Singh [DEMO DATA]", 71, "Male", "O+", "Kakrala", "Benign Prostatic Hyperplasia", "None", "Kakrala Village Center"],
  ["9876543117", "Kirandeep Kaur [DEMO DATA]", 27, "Female", "AB+", "Mehas", "Allergic Rhinitis", "Pollen", "Mehas Village"],
  ["9876543118", "Hardial Singh [DEMO DATA]", 59, "Male", "B-", "Bir Bhadson", "Hypertension", "None", "Bir Bhadson"],
  ["9876543119", "Narinder Kaur [DEMO DATA]", 46, "Female", "A+", "Thuhi", "Osteoarthritis", "None", "Thuhi Village"],
  ["9876543120", "Bhupinder Singh [DEMO DATA]", 33, "Male", "O+", "Nabha City", "Gastric Ulcer", "Ibuprofen", "Bhavanigarh Road, Nabha"],
];

const appointmentSlots = [
  ["10:00 AM", "IN_PERSON", "COMPLETED", "Routine blood pressure checkup and diabetes follow-up."],
  ["10:30 AM", "IN_PERSON", "COMPLETED", "Antenatal checkup and ultrasound scan review."],
  ["11:00 AM", "TELECONSULTATION", "COMPLETED", "High fever and persistent cough for 4 days."],
  ["11:30 AM", "IN_PERSON", "COMPLETED", "Severe bilateral knee pain while walking in fields."],
  ["12:00 PM", "TELECONSULTATION", "SCHEDULED", "Skin redness and itching on hands after harvest."],
  ["12:30 PM", "IN_PERSON", "SCHEDULED", "Chest tightness on moderate exertion."],
  ["02:00 PM", "IN_PERSON", "SCHEDULED", "Ear pain and ringing sound after viral cold."],
  ["02:30 PM", "TELECONSULTATION", "SCHEDULED", "Seasonal allergy consultation and inhaler review."],
  ["03:00 PM", "IN_PERSON", "SCHEDULED", "Blood glucose monitoring and diet consultation."],
  ["03:30 PM", "IN_PERSON", "SCHEDULED", "Follow-up for lumbar back pain and physiotherapy."],
  ["04:00 PM", "TELECONSULTATION", "CANCELLED", "Patient had transportation issues from village Kakrala."],
  ["04:30 PM", "IN_PERSON", "SCHEDULED", "Digestive acidity and morning nausea."],
  ["05:00 PM", "IN_PERSON", "SCHEDULED", "Pediatric immunization review for 6-month infant."],
  ["05:30 PM", "TELECONSULTATION", "SCHEDULED", "Ayurvedic consultation for joint stiffness."],
  ["06:00 PM", "IN_PERSON", "SCHEDULED", "General health fitness checkup for agricultural job."],
];

const sampleRecords = [
  ["REC-NBH-2026-0001", 0, 0, "GENERAL_VISIT", "Routine Hypertension OPD Visit", "Primary Essential Hypertension (Controlled)", "Patient reports mild morning headaches. Advised low sodium diet.", "{\"bp\": \"138/88\", \"pulse\": 76, \"weight_kg\": 72, \"spo2\": 98}"],
  ["REC-NBH-2026-0002", 1, 0, "DIAGNOSIS", "Type 2 Diabetes Screening Report", "Type 2 Diabetes Mellitus with Mild Neuropathy", "Fasting blood sugar 164 mg/dL, HbA1c 7.4%. Started on Metformin.", "{\"fbs_mg_dl\": 164, \"hba1c\": 7.4, \"bp\": \"124/82\", \"weight_kg\": 68}"],
  ["REC-NBH-2026-0003", 2, 2, "LAB_REPORT", "Pediatric Wellness & Growth Record", "Normal Physical Development (Age Appropriate)", "Immunization up to date. Prescribed Vitamin D3 drops.", "{\"weight_kg\": 14.2, \"height_cm\": 96, \"pulse\": 98, \"temp_f\": 98.4}"],
  ["REC-NBH-2026-0004", 3, 4, "GENERAL_VISIT", "Orthopedic Joint Assessment", "Bilateral Knee Osteoarthritis (Grade 2)", "Crepitus noted in right knee. Advised quadriceps strengthening exercises.", "{\"bp\": \"130/80\", \"weight_kg\": 64, \"rom_degrees\": 110}"],
  ["REC-NBH-2026-0005", 4, 0, "GENERAL_VISIT", "Seasonal Bronchitis Evaluation", "Acute Bronchial Spasm secondary to Harvest Dust", "Bilateral wheezing. Prescribed Salbutamol inhaler and antihistamines.", "{\"spo2\": 96, \"rr\": 20, \"pulse\": 84, \"temp_f\": 99.1}"],
  ["REC-NBH-2026-0006", 5, 5, "DIAGNOSIS", "Cardiology Echo & ECG Review", "Ischemic Heart Disease (Stable Angina)", "ECG shows T-wave inversions in V4-V6. Advised lifestyle modifications.", "{\"bp\": \"142/90\", \"pulse\": 72, \"cholesterol_mg_dl\": 224}"],
];

const samplePrescriptions = [
  ["RX-NBH-2026-0001", 0, 0, 0, "Essential Hypertension", "Take Amlodipine daily at 8:00 AM after breakfast. Reduce salt intake.", [["Amlodipine", "5 mg", "1-0-0 after breakfast", 30, 30, "Do not skip doses"], ["Paracetamol", "500 mg", "SOS (as needed for headache)", 5, 10, "Take with plenty of water"]]],
  ["RX-NBH-2026-0002", 1, 1, 1, "Type-2 Diabetes & Dyspepsia", "Maintain 45 minutes daily walking along Duladdi village road.", [["Metformin", "500 mg", "1-0-1 after meals", 30, 60, "Take with meals"], ["Pantoprazole", "40 mg", "1-0-0 empty stomach", 14, 14, "Take 30 mins before breakfast"]]],
  ["RX-NBH-2026-0003", 2, 2, 0, "Acute Respiratory Tract Infection", "Steam inhalation twice daily. Drink warm water.", [["Amoxicillin", "500 mg", "1-0-1 after food", 5, 10, "Complete full antibiotic course"], ["Cetirizine", "10 mg", "0-0-1 at night", 5, 5, "May cause mild drowsiness"], ["Cough Relief Syrup", "10 ml", "1-1-1 three times daily", 5, 1, "Shake well before use"]]],
  ["RX-NBH-2026-0004", 3, 3, 4, "Bilateral Knee Osteoarthritis", "Avoid sitting on floor. Apply diclofenac gel gently without rubbing.", [["Calcium + Vitamin D3", "500 mg", "0-1-0 after lunch", 30, 30, "Calcium supplement"], ["Diclofenac Relief Gel", "Topical", "Apply twice daily", 15, 1, "External use only"]]],
];

const sampleNotifications = [
  [0, "ਮੁਲਾਕਾਤ ਰੀਮਾਈਂਡਰ (Appointment Reminder)", "ਤੁਹਾਡੀ ਮੁਲਾਕਾਤ ਕੱਲ੍ਹ ਸਵੇਰੇ 10:00 ਵਜੇ ਸਿਵਲ ਹਸਪਤਾਲ ਨਾਭਾ ਵਿਖੇ ਡਾ. ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਨਾਲ ਤਹਿ ਹੈ।", "APPOINTMENT_REMINDER"],
  [1, "ਨਵੀਂ ਪਰਚੀ ਉਪਲਬਧ (Prescription Ready)", "ਤੁਹਾਡੀ ਨਵੀਂ ਡਿਜੀਟਲ ਪਰਚੀ ਜਾਰੀ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ। ਜਨ ਔਸ਼ਧੀ ਕੇਂਦਰ ਤੋਂ ਦਵਾਈਆਂ ਲੈ ਸਕਦੇ ਹੋ।", "PRESCRIPTION_READY"],
  [0, "ਸਟਾਕ ਚੇਤਾਵਨੀ (Low Stock Alert)", "Kisan Medical Store: Paracetamol 500mg ਦਾ ਸਟਾਕ 20 ਤੋਂ ਘੱਟ ਰਹਿ ਗਿਆ ਹੈ।", "LOW_STOCK_ALERT"],
];

/**
 * Populates the database with realistic synthetic demo data (20 patients, 8 doctors, 5 pharmacies,
 * 30 medicines, 15 appointments, plus sample records, prescriptions, consultations, notifications, audit logs).
 * Returns per-table counts of rows created by this call.
 */
export async function seedDatabase(prisma) {
  const defaultPasswordHash = await hashPassword("password123");
  const stats = {
    doctors: 0,
    pharmacies: 0,
    patients: 0,
    medicines: 0,
    inventory: 0,
    appointments: 0,
    medical_records: 0,
    prescriptions: 0,
    prescription_items: 0,
    consultations: 0,
    notifications: 0,
    audit_logs: 0,
  };

  // One transaction, like the single db.commit() in the Python version.
  await prisma.$transaction(async (db) => {
    const demoUser = (phone, email, full_name, role, village) => ({
      phone, email, full_name, hashed_password: defaultPasswordHash, role,
      preferred_language: "pa", village, is_active: true, is_demo: true,
    });

    // 1. Doctors
    const doctorEntities = [];
    for (const [i, [phone, email, name, spec, qual, hosp, fee, langs, exp, bio, vill]] of doctorsInfo.entries()) {
      const idx = i + 1;
      const existing = await db.user.findUnique({ where: { phone } });
      if (!existing) {
        const user = await db.user.create({ data: demoUser(phone, email, name, "DOCTOR", vill) });
        doctorEntities.push(await db.doctor.create({ data: {
          user_id: user.id, specialization: spec, license_number: `PB-MC-201${idx}-00${idx}4-DEMO`,
          qualification: qual, hospital_name: hosp, consultation_fee: fee, languages_spoken: langs,
          experience_years: exp, bio, is_available: true, is_verified: true,
        } }));
        stats.doctors++;
      } else {
        const doc = await db.doctor.findUnique({ where: { user_id: existing.id } });
        if (doc) doctorEntities.push(doc);
      }
    }

    // 2. Pharmacies
    const pharmacyEntities = [];
    for (const [phone, email, fullName, storeName, lic, addr, vill, hrs] of pharmaciesInfo) {
      const existing = await db.user.findUnique({ where: { phone } });
      if (!existing) {
        const user = await db.user.create({ data: demoUser(phone, email, fullName, "PHARMACY", vill) });
        pharmacyEntities.push(await db.pharmacy.create({ data: {
          user_id: user.id, pharmacy_name: storeName, license_number: lic, address: addr, village: vill,
          contact_phone: phone, operating_hours: hrs, is_verified: true,
        } }));
        stats.pharmacies++;
      } else {
        const pharma = await db.pharmacy.findUnique({ where: { user_id: existing.id } });
        if (pharma) pharmacyEntities.push(pharma);
      }
    }

    // 3. Medicines
    const medicineEntities = [];
    for (const [name, generic, brand, cat, strength, price, rx, ess, desc] of medicinesCatalog) {
      let med = await db.medicine.findFirst({ where: { name } });
      if (!med) {
        med = await db.medicine.create({ data: {
          name, generic_name: generic, brand_name: brand, category: cat, strength, price,
          is_prescription_required: rx, is_essential: ess, description: desc, is_demo: true,
        } });
        stats.medicines++;
      }
      medicineEntities.push(med);
    }

    // 4. Inventory
    for (const [p, pharma] of pharmacyEntities.entries()) {
      for (const [m, med] of medicineEntities.entries()) {
        const phIdx = p + 1, medIdx = m + 1;
        const batch_number = `BAT-NBH-${phIdx}${pad(medIdx, 2)}`;
        const existingInv = await db.pharmacyInventory.findFirst({
          where: { pharmacy_id: pharma.id, medicine_id: med.id, batch_number },
        });
        if (!existingInv) {
          await db.pharmacyInventory.create({ data: {
            pharmacy_id: pharma.id, medicine_id: med.id, batch_number,
            stock_quantity: 50 + phIdx * 15 + medIdx * 3, reorder_level: 20, unit_price: med.price,
            expiry_date: dayOffset(180 + medIdx * 20), is_available: true,
          } });
          stats.inventory++;
        }
      }
    }

    // 5. Patients
    const patientEntities = [];
    for (const [i, [phone, fullName, age, gender, bg, vill, chronic, allergy, addr]] of patientsData.entries()) {
      const idx = i + 1;
      const existing = await db.user.findUnique({ where: { phone } });
      if (!existing) {
        const user = await db.user.create({
          data: demoUser(phone, `patient.${idx}.demo@nabha.punjab`, fullName, "PATIENT", vill),
        });
        patientEntities.push(await db.patient.create({ data: {
          user_id: user.id, age, gender, blood_group: bg, emergency_contact: `98765439${pad(idx, 2)}`,
          abha_id: `91-${pad(idx, 4)}-${pad(idx * 7, 4)}-${pad(idx * 13, 4)}-DEMO`,
          chronic_conditions: chronic, allergies: allergy, address: addr,
        } }));
        stats.patients++;
      } else {
        const patient = await db.patient.findUnique({ where: { user_id: existing.id } });
        if (patient) patientEntities.push(patient);
      }
    }

    // 6. Appointments
    const appointmentEntities = [];
    for (const [i, [slotTime, appType, status, symp]] of appointmentSlots.entries()) {
      const idx = i + 1;
      const appointment_number = `APT-NBH-2026-${pad(idx, 4)}`;
      const existingApt = await db.appointment.findUnique({ where: { appointment_number } });
      if (!existingApt && patientEntities.length && doctorEntities.length) {
        appointmentEntities.push(await db.appointment.create({ data: {
          appointment_number,
          patient_id: patientEntities[(idx - 1) % patientEntities.length].id,
          doctor_id: doctorEntities[(idx - 1) % doctorEntities.length].id,
          appointment_date: dayOffset((idx % 5) - 2),
          appointment_time: slotTime, appointment_type: appType, status, symptom_summary: symp,
          notes: idx % 2 === 0 ? "Patient requested Punjabi consultation." : null,
          is_demo: true,
        } }));
        stats.appointments++;
      } else if (existingApt) {
        appointmentEntities.push(existingApt);
      }
    }

    // 7. Medical records
    for (const [recNo, pIdx, dIdx, recType, title, diag, notes, vitals] of sampleRecords) {
      const existingRec = await db.medicalRecord.findUnique({ where: { record_number: recNo } });
      if (!existingRec && patientEntities.length && doctorEntities.length) {
        await db.medicalRecord.create({ data: {
          record_number: recNo,
          patient_id: patientEntities[pIdx % patientEntities.length].id,
          doctor_id: doctorEntities[dIdx % doctorEntities.length].id,
          record_type: recType, title, diagnosis: diag, clinical_notes: notes, vitals,
          record_date: dayOffset(-pIdx * 4), is_confidential: false, is_demo: true,
        } });
        stats.medical_records++;
      }
    }

    // 8. Prescriptions and items
    for (const [rxNo, aptIdx, pIdx, dIdx, diag, inst, items] of samplePrescriptions) {
      const existingRx = await db.prescription.findUnique({ where: { prescription_number: rxNo } });
      if (!existingRx && patientEntities.length && doctorEntities.length) {
        // A prescription written at a visit belongs to that visit's patient and doctor.
        const apt = appointmentEntities[aptIdx];
        const rx = await db.prescription.create({ data: {
          prescription_number: rxNo,
          appointment_id: apt?.id ?? null,
          patient_id: apt?.patient_id ?? patientEntities[pIdx % patientEntities.length].id,
          doctor_id: apt?.doctor_id ?? doctorEntities[dIdx % doctorEntities.length].id,
          issue_date: dayOffset(-aptIdx * 2), valid_until: dayOffset(30),
          diagnosis: diag, instructions: inst, is_dispensed: aptIdx % 2 === 1, is_demo: true,
        } });
        stats.prescriptions++;

        for (const [medName, dosage, frequency, dur, qty, itemInst] of items) {
          const targetMed = medicineEntities.find((m) => m.name === medName) ?? medicineEntities[0];
          await db.prescriptionItem.create({ data: {
            prescription_id: rx.id, medicine_id: targetMed.id, dosage, frequency,
            duration_days: dur, quantity_prescribed: qty, instructions: itemInst,
          } });
          stats.prescription_items++;
        }
      }
    }

    // 9. Consultations for teleconsultation appointments
    const teleAppointments = appointmentEntities.filter((a) => a.appointment_type === "TELECONSULTATION");
    for (const [i, apt] of teleAppointments.entries()) {
      const idx = i + 1;
      const existingConsult = await db.consultation.findUnique({ where: { appointment_id: apt.id } });
      if (!existingConsult) {
        const completed = apt.status === "COMPLETED";
        const minutesAgo = (min) => new Date(Date.now() - min * 60_000);
        await db.consultation.create({ data: {
          appointment_id: apt.id,
          room_id: `sehatsetu-nabha-room-${apt.appointment_number.toLowerCase()}`,
          status: completed ? "COMPLETED" : "INITIATED",
          consultation_type: idx % 2 === 1 ? "VIDEO" : "AUDIO",
          start_time: minutesAgo(60 * idx),
          end_time: completed ? minutesAgo(60 * idx - 15) : null,
          doctor_notes: completed
            ? "Teleconsultation conducted smoothly. Patient connected from village via SehatSetu low-bandwidth mode."
            : null,
          quality_rating: completed ? 4 : null,
          low_bandwidth_fallback: true,
        } });
        stats.consultations++;
      }
    }

    // 10. Notifications and audit logs (not deduplicated, same as the Python version)
    for (const [uIdx, title, message, notification_type] of sampleNotifications) {
      const targetUserId = uIdx < patientEntities.length ? patientEntities[uIdx].user_id : doctorEntities[0].user_id;
      await db.notification.create({ data: {
        user_id: targetUserId, title, message, notification_type, is_read: false, channel: "IN_APP", language: "pa",
      } });
      stats.notifications++;
    }

    const sampleAudits = [
      [doctorEntities[0].user_id, "VIEW_MEDICAL_RECORD", "MedicalRecord", "REC-NBH-2026-0001", "127.0.0.1", "Doctor reviewed patient vitals before consultation"],
      [patientEntities[0].user_id, "AUTH_LOGIN", "User", String(patientEntities[0].user_id), "127.0.0.1", "Patient logged in via SehatSetu web portal"],
      [doctorEntities[1].user_id, "CREATE_PRESCRIPTION", "Prescription", "RX-NBH-2026-0002", "127.0.0.1", "Doctor issued digital prescription for Metformin"],
    ];
    for (const [user_id, action, resource_type, resource_id, ip_address, details] of sampleAudits) {
      await db.auditLog.create({ data: {
        user_id, action, resource_type, resource_id, ip_address,
        user_agent: "SehatSetu-App/1.0 (Darwin/macOS; en-IN)", status: "SUCCESS", details,
      } });
      stats.audit_logs++;
    }
  }, { timeout: 60_000 });

  return stats;
}
