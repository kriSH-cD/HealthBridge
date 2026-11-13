// Explicit field lists: keeps hashed_password and internals out of responses.
const pick = (obj, keys) => (obj ? Object.fromEntries(keys.map((k) => [k, obj[k]])) : null);

const PROFILE_FIELDS = {
  patient: ["id", "user_id", "age", "gender", "blood_group", "emergency_contact", "abha_id", "chronic_conditions"],
  doctor: ["id", "user_id", "specialization", "license_number", "hospital_name", "consultation_fee",
    "languages_spoken", "experience_years", "is_available", "is_verified"],
  pharmacy: ["id", "user_id", "pharmacy_name", "license_number", "address", "contact_phone", "operating_hours", "is_verified"],
  hospital: ["id", "user_id", "hospital_name", "address", "emergency_phone", "total_beds", "available_beds",
    "has_oxygen", "has_emergency"],
};

export const userInclude = { patient: true, doctor: true, pharmacy: true, hospital: true };

export const serializeUser = (u) => ({
  ...pick(u, ["id", "phone", "email", "full_name", "role", "preferred_language", "village", "is_active", "is_demo", "created_at"]),
  patient_profile: pick(u.patient, PROFILE_FIELDS.patient),
  doctor_profile: u.doctor && { ...pick(u.doctor, PROFILE_FIELDS.doctor), consultation_fee: Number(u.doctor.consultation_fee) },
  pharmacy_profile: pick(u.pharmacy, PROFILE_FIELDS.pharmacy),
  hospital_profile: pick(u.hospital, PROFILE_FIELDS.hospital),
});

/** Prisma returns @db.Date as a Date at UTC midnight; the API speaks YYYY-MM-DD. */
export const isoDate = (d) => d.toISOString().slice(0, 10);
