-- Vitals: text holding JSON -> real jsonb, converted in place (Prisma's default would drop the column)
ALTER TABLE "medical_records" ALTER COLUMN "vitals" TYPE JSONB USING "vitals"::jsonb;

-- One catalogue entry per medicine name + strength (also serves name lookups)
DROP INDEX "medicines_name_idx";
CREATE UNIQUE INDEX "medicines_name_strength_key" ON "medicines"("name", "strength");
