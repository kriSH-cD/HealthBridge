-- CreateEnum
CREATE TYPE "transferstatus" AS ENUM ('PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "stock_transfer_requests" (
    "id" SERIAL NOT NULL,
    "transfer_number" VARCHAR(30) NOT NULL,
    "source_pharmacy_id" INTEGER NOT NULL,
    "target_pharmacy_id" INTEGER NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiry_date" DATE NOT NULL,
    "status" "transferstatus" NOT NULL DEFAULT 'PENDING',
    "reason" VARCHAR(255),
    "notes" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "is_demo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_requests_transfer_number_key" ON "stock_transfer_requests"("transfer_number");
CREATE INDEX "stock_transfer_requests_status_idx" ON "stock_transfer_requests"("status");
CREATE INDEX "stock_transfer_requests_source_pharmacy_id_idx" ON "stock_transfer_requests"("source_pharmacy_id");
CREATE INDEX "stock_transfer_requests_target_pharmacy_id_idx" ON "stock_transfer_requests"("target_pharmacy_id");
CREATE INDEX "stock_transfer_requests_medicine_id_idx" ON "stock_transfer_requests"("medicine_id");

-- AddForeignKey
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_source_pharmacy_id_fkey" FOREIGN KEY ("source_pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_target_pharmacy_id_fkey" FOREIGN KEY ("target_pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
