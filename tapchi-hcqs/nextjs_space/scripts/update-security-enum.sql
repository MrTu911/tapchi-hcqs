-- Migrate SecurityLevel enum values
-- This must be run BEFORE the Prisma schema is pushed

-- Step 1: Update all existing records to use new enum values
-- Note: This uses a type cast to bypass enum constraints temporarily
UPDATE "Submission" 
SET "securityLevel" = CASE
  WHEN "securityLevel"::text = 'OPEN' THEN 'PUBLIC'
  WHEN "securityLevel"::text = 'INTERNAL' THEN 'CONFIDENTIAL'
  WHEN "securityLevel"::text = 'SENSITIVE' THEN 'SECRET'
  ELSE "securityLevel"::text
END::"SecurityLevel"
WHERE "securityLevel"::text IN ('OPEN', 'INTERNAL', 'SENSITIVE');

-- Verify the update
SELECT "securityLevel", COUNT(*) as count
FROM "Submission"
GROUP BY "securityLevel";
