-- CreateEnum
CREATE TYPE "ambulancetype" AS ENUM ('BLS', 'ALS', 'PATIENT_TRANSPORT');

-- CreateEnum
CREATE TYPE "ambulancestatus" AS ENUM ('AVAILABLE', 'DISPATCHED', 'ON_DUTY', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "triageseverity" AS ENUM ('CRITICAL', 'URGENT', 'NORMAL');

-- CreateEnum
CREATE TYPE "emergencyrequeststatus" AS ENUM ('PENDING', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED_SCENE', 'TRANSPORTING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ambulances" (
    "id" SERIAL NOT NULL,
    "vehicle_number" VARCHAR(20) NOT NULL,
    "ambulance_type" "ambulancetype" NOT NULL DEFAULT 'BLS',
    "station_location" VARCHAR(150) NOT NULL,
    "driver_name" VARCHAR(100) NOT NULL,
    "driver_phone" VARCHAR(20) NOT NULL,
    "paramedic_name" VARCHAR(100),
    "status" "ambulancestatus" NOT NULL DEFAULT 'AVAILABLE',
    "has_oxygen" BOOLEAN NOT NULL DEFAULT true,
    "has_ventilator" BOOLEAN NOT NULL DEFAULT false,
    "is_demo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambulances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_requests" (
    "id" SERIAL NOT NULL,
    "request_number" VARCHAR(30) NOT NULL,
    "caller_name" VARCHAR(100) NOT NULL,
    "caller_phone" VARCHAR(20) NOT NULL,
    "pickup_village" VARCHAR(100) NOT NULL,
    "pickup_landmark" VARCHAR(255),
    "destination_hospital_id" INTEGER,
    "ambulance_id" INTEGER,
    "triage_severity" "triageseverity" NOT NULL DEFAULT 'URGENT',
    "chief_complaint" TEXT NOT NULL,
    "patient_name" VARCHAR(100),
    "patient_age" INTEGER,
    "status" "emergencyrequeststatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "dispatched_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "is_demo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ambulances_vehicle_number_key" ON "ambulances"("vehicle_number");
CREATE INDEX "ambulances_status_idx" ON "ambulances"("status");
CREATE INDEX "ambulances_station_location_idx" ON "ambulances"("station_location");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_requests_request_number_key" ON "emergency_requests"("request_number");
CREATE INDEX "emergency_requests_status_idx" ON "emergency_requests"("status");
CREATE INDEX "emergency_requests_pickup_village_idx" ON "emergency_requests"("pickup_village");
CREATE INDEX "emergency_requests_ambulance_id_idx" ON "emergency_requests"("ambulance_id");
CREATE INDEX "emergency_requests_destination_hospital_id_idx" ON "emergency_requests"("destination_hospital_id");

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_destination_hospital_id_fkey" FOREIGN KEY ("destination_hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
