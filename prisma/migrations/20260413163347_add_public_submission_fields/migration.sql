-- AlterTable
ALTER TABLE "reimbursement_forms" ADD COLUMN     "is_public_submission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submitter_email" TEXT,
ADD COLUMN     "submitter_name" TEXT,
ADD COLUMN     "submitter_phone" TEXT;
