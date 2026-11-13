-- DropForeignKey
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "prescriptions" DROP CONSTRAINT "prescriptions_appointment_id_fkey";

-- DropIndex
DROP INDEX "consultations_doctor_id_idx";

-- DropIndex
DROP INDEX "consultations_patient_id_idx";

-- AlterTable
ALTER TABLE "consultations" DROP COLUMN "doctor_id",
DROP COLUMN "patient_id";

-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN     "appointment_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "uq_appointment_parties" ON "appointments"("id", "patient_id", "doctor_id");

-- CreateIndex
CREATE INDEX "medical_records_appointment_id_idx" ON "medical_records"("appointment_id");

-- Data fix: unlink prescriptions whose visit names a different patient/doctor
-- (keeps the prescription; only the inconsistent visit link is dropped)
UPDATE "prescriptions" p SET "appointment_id" = NULL
FROM "appointments" a
WHERE a."id" = p."appointment_id" AND (a."patient_id" <> p."patient_id" OR a."doctor_id" <> p."doctor_id");

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointment_id_patient_id_doctor_id_fkey" FOREIGN KEY ("appointment_id", "patient_id", "doctor_id") REFERENCES "appointments"("id", "patient_id", "doctor_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_patient_id_doctor_id_fkey" FOREIGN KEY ("appointment_id", "patient_id", "doctor_id") REFERENCES "appointments"("id", "patient_id", "doctor_id") ON DELETE NO ACTION ON UPDATE CASCADE;

