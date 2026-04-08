-- AlterTable: add code column as nullable first
ALTER TABLE "providers" ADD COLUMN "code" TEXT;

-- Backfill existing rows with sequential codes
UPDATE "providers" SET "code" = 'PRV-' || LPAD(ROW_NUMBER::TEXT, 3, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "created_at") AS ROW_NUMBER
  FROM "providers"
) AS numbered
WHERE "providers"."id" = numbered.id;

-- Make code required and unique
ALTER TABLE "providers" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "providers_code_key" ON "providers"("code");
