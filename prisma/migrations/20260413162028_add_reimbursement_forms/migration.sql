-- CreateEnum
CREATE TYPE "reimbursement_form_type" AS ENUM ('medicaid_trip', 'provider_invoice', 'cms_1500');

-- CreateEnum
CREATE TYPE "reimbursement_form_status" AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'denied', 'paid', 'void');

-- CreateTable
CREATE TABLE "reimbursement_forms" (
    "id" TEXT NOT NULL,
    "form_number" TEXT NOT NULL,
    "form_type" "reimbursement_form_type" NOT NULL,
    "status" "reimbursement_form_status" NOT NULL DEFAULT 'draft',
    "trip_id" TEXT,
    "provider_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "patient_name" TEXT,
    "patient_dob" TEXT,
    "medicaid_id" TEXT,
    "authorization_number" TEXT,
    "health_plan_name" TEXT,
    "health_plan_id" TEXT,
    "pickup_address" TEXT,
    "destination_address" TEXT,
    "trip_date" TIMESTAMP(3),
    "pickup_time" TEXT,
    "dropoff_time" TEXT,
    "mobility_type" "mobility_type",
    "mileage" DOUBLE PRECISION,
    "mileage_rate" DOUBLE PRECISION,
    "base_rate" DOUBLE PRECISION,
    "tolls" DOUBLE PRECISION,
    "wait_time" INTEGER,
    "wait_time_rate" DOUBLE PRECISION,
    "driver_name" TEXT,
    "driver_id" TEXT,
    "vehicle_id" TEXT,
    "vehicle_type" TEXT,
    "member_signature_url" TEXT,
    "driver_signature_url" TEXT,
    "attendant_name" TEXT,
    "return_trip" BOOLEAN,
    "trip_purpose" TEXT,
    "invoice_number" TEXT,
    "invoice_date" TIMESTAMP(3),
    "billing_period_start" TIMESTAMP(3),
    "billing_period_end" TIMESTAMP(3),
    "provider_tax_id" TEXT,
    "provider_npi" TEXT,
    "remit_to_name" TEXT,
    "remit_to_address" TEXT,
    "payment_terms" TEXT,
    "insurance_type" TEXT,
    "insured_id_number" TEXT,
    "patient_sex" TEXT,
    "insured_name" TEXT,
    "patient_address" TEXT,
    "patient_city" TEXT,
    "patient_state" TEXT,
    "patient_zip" TEXT,
    "patient_phone" TEXT,
    "patient_rel_to_insured" TEXT,
    "insured_address" TEXT,
    "insured_city" TEXT,
    "insured_state" TEXT,
    "insured_zip" TEXT,
    "patient_condition_rel_to" TEXT,
    "insured_policy_group" TEXT,
    "insured_dob" TEXT,
    "insured_sex" TEXT,
    "insured_plan_name" TEXT,
    "patient_sig_on_file" BOOLEAN,
    "insured_sig_on_file" BOOLEAN,
    "condition_date_of_onset" TIMESTAMP(3),
    "referring_provider_name" TEXT,
    "referring_provider_npi" TEXT,
    "diagnosis_code_1" TEXT,
    "diagnosis_code_2" TEXT,
    "diagnosis_code_3" TEXT,
    "diagnosis_code_4" TEXT,
    "prior_auth_number" TEXT,
    "federal_tax_id" TEXT,
    "federal_tax_id_type" TEXT,
    "patient_account_number" TEXT,
    "accept_assignment" BOOLEAN,
    "amount_paid" DOUBLE PRECISION,
    "billing_provider_name" TEXT,
    "billing_provider_address" TEXT,
    "billing_provider_npi" TEXT,
    "billing_provider_taxonomy" TEXT,
    "facility_name" TEXT,
    "facility_address" TEXT,
    "facility_npi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reimbursement_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms1500_service_lines" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "date_of_service_from" TIMESTAMP(3) NOT NULL,
    "date_of_service_to" TIMESTAMP(3) NOT NULL,
    "place_of_service" TEXT NOT NULL,
    "procedure_code" TEXT NOT NULL,
    "modifiers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "diagnosis_pointer" TEXT NOT NULL,
    "charges" DOUBLE PRECISION NOT NULL,
    "units" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rendering_provider_npi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms1500_service_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_invoice_lines" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "trip_id" TEXT,
    "trip_number" TEXT,
    "service_date" TIMESTAMP(3) NOT NULL,
    "service_description" TEXT NOT NULL,
    "pickup_address" TEXT,
    "destination_address" TEXT,
    "mileage" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reimbursement_forms_form_number_key" ON "reimbursement_forms"("form_number");

-- AddForeignKey
ALTER TABLE "reimbursement_forms" ADD CONSTRAINT "reimbursement_forms_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursement_forms" ADD CONSTRAINT "reimbursement_forms_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursement_forms" ADD CONSTRAINT "reimbursement_forms_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursement_forms" ADD CONSTRAINT "reimbursement_forms_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms1500_service_lines" ADD CONSTRAINT "cms1500_service_lines_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "reimbursement_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_invoice_lines" ADD CONSTRAINT "provider_invoice_lines_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "reimbursement_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
