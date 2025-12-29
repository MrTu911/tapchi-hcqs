-- Proper enum migration for PostgreSQL
-- This handles data migration safely

BEGIN;

-- Step 1: Add new enum values to the existing enum
ALTER TYPE "SecurityLevel" ADD VALUE IF NOT EXISTS 'PUBLIC';
ALTER TYPE "SecurityLevel" ADD VALUE IF NOT EXISTS 'CONFIDENTIAL';
ALTER TYPE "SecurityLevel" ADD VALUE IF NOT EXISTS 'SECRET';
ALTER TYPE "SecurityLevel" ADD VALUE IF NOT EXISTS 'TOP_SECRET';

-- Step 2: Create a temporary column with text type
ALTER TABLE "Submission" ADD COLUMN "securityLevel_temp" TEXT;

-- Step 3: Copy and transform the data
UPDATE "Submission" 
SET "securityLevel_temp" = CASE
  WHEN "securityLevel"::text = 'OPEN' THEN 'PUBLIC'
  WHEN "securityLevel"::text = 'INTERNAL' THEN 'CONFIDENTIAL'
  WHEN "securityLevel"::text = 'SENSITIVE' THEN 'SECRET'
  ELSE "securityLevel"::text
END;

-- Step 4: Drop the old column
ALTER TABLE "Submission" DROP COLUMN "securityLevel";

-- Step 5: Rename temp column to original name
ALTER TABLE "Submission" RENAME COLUMN "securityLevel_temp" TO "securityLevel";

-- Step 6: Convert the text column back to the enum type (with only new values)
ALTER TABLE "Submission" 
ALTER COLUMN "securityLevel" TYPE "SecurityLevel" 
USING "securityLevel"::"SecurityLevel";

-- Step 7: Set default value
ALTER TABLE "Submission" 
ALTER COLUMN "securityLevel" SET DEFAULT 'PUBLIC'::"SecurityLevel";

-- Step 8: Drop old enum values (this recreates the enum)
-- Note: We'll need to recreate the enum type cleanly
DROP TYPE "SecurityLevel";
CREATE TYPE "SecurityLevel" AS ENUM ('PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET');

-- Verify
SELECT "securityLevel", COUNT(*) as count
FROM "Submission"
GROUP BY "securityLevel";

COMMIT;
