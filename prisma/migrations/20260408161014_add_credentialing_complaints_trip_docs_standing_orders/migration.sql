-- CreateEnum
CREATE TYPE "credential_type" AS ENUM ('business_license', 'insurance_coi', 'vehicle_inspection', 'background_check', 'drug_test', 'cpr_certification', 'hipaa_training', 'fwa_training', 'ada_training', 'drivers_license', 'oig_screening', 'sam_screening', 'other');

-- CreateEnum
CREATE TYPE "credential_status" AS ENUM ('valid', 'expiring', 'expired', 'pending', 'rejected');

-- CreateEnum
CREATE TYPE "complaint_status" AS ENUM ('open', 'investigating', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "complaint_category" AS ENUM ('late_pickup', 'no_show_driver', 'vehicle_condition', 'driver_behavior', 'billing', 'accessibility', 'safety', 'other');

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "actual_dropoff_time" TIMESTAMP(3),
ADD COLUMN     "actual_mileage" DOUBLE PRECISION,
ADD COLUMN     "actual_pickup_time" TIMESTAMP(3),
ADD COLUMN     "authorization_number" TEXT,
ADD COLUMN     "driver_id" TEXT,
ADD COLUMN     "driver_name" TEXT,
ADD COLUMN     "medicaid_id" TEXT,
ADD COLUMN     "member_signature_url" TEXT,
ADD COLUMN     "standing_order_id" TEXT,
ADD COLUMN     "vehicle_id" TEXT;

-- CreateTable
CREATE TABLE "provider_credentials" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "type" "credential_type" NOT NULL,
    "status" "credential_status" NOT NULL DEFAULT 'pending',
    "document_number" TEXT,
    "issued_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "complaint_number" TEXT NOT NULL,
    "category" "complaint_category" NOT NULL,
    "status" "complaint_status" NOT NULL DEFAULT 'open',
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "provider_id" TEXT,
    "trip_id" TEXT,
    "reported_by" TEXT NOT NULL,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standing_orders" (
    "id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "patient_phone" TEXT NOT NULL,
    "medicaid_id" TEXT,
    "pickup_address" TEXT NOT NULL,
    "destination_address" TEXT NOT NULL,
    "appointment_time" TEXT NOT NULL,
    "mobility_type" "mobility_type" NOT NULL,
    "special_instructions" TEXT NOT NULL DEFAULT '',
    "provider_id" TEXT,
    "days_of_week" INTEGER[],
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standing_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaints_complaint_number_key" ON "complaints"("complaint_number");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_standing_order_id_fkey" FOREIGN KEY ("standing_order_id") REFERENCES "standing_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
