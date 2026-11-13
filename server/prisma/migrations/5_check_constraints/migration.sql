-- Value rules the database enforces itself. Prisma can't model CHECKs, but leaves them alone.
ALTER TABLE "pharmacy_inventory"
  ADD CONSTRAINT "chk_inventory_stock" CHECK ("stock_quantity" >= 0),
  ADD CONSTRAINT "chk_inventory_reorder" CHECK ("reorder_level" >= 0),
  ADD CONSTRAINT "chk_inventory_price" CHECK ("unit_price" >= 0);

ALTER TABLE "medicines" ADD CONSTRAINT "chk_medicine_price" CHECK ("price" >= 0);
ALTER TABLE "doctors" ADD CONSTRAINT "chk_doctor_fee" CHECK ("consultation_fee" >= 0);
ALTER TABLE "doctors" ADD CONSTRAINT "chk_doctor_experience" CHECK ("experience_years" BETWEEN 0 AND 70);
ALTER TABLE "patients" ADD CONSTRAINT "chk_patient_age" CHECK ("age" BETWEEN 0 AND 130);

ALTER TABLE "prescription_items"
  ADD CONSTRAINT "chk_item_quantity" CHECK ("quantity_prescribed" > 0),
  ADD CONSTRAINT "chk_item_duration" CHECK ("duration_days" > 0);

ALTER TABLE "prescriptions" ADD CONSTRAINT "chk_prescription_validity" CHECK ("valid_until" IS NULL OR "valid_until" >= "issue_date");

ALTER TABLE "consultations"
  ADD CONSTRAINT "chk_consultation_rating" CHECK ("quality_rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "chk_consultation_times" CHECK ("end_time" IS NULL OR "start_time" IS NULL OR "end_time" >= "start_time");

ALTER TABLE "hospitals"
  ADD CONSTRAINT "chk_hospital_beds" CHECK ("total_beds" >= 0 AND "available_beds" BETWEEN 0 AND "total_beds");
