-- CreateIndex
CREATE UNIQUE INDEX "uq_doctor_slot_scheduled" ON "appointments"("doctor_id", "appointment_date", "appointment_time") WHERE (status = 'SCHEDULED');

