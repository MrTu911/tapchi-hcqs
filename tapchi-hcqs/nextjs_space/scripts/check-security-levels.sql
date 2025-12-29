-- Check current security level values
SELECT "securityLevel", COUNT(*) as count
FROM "Submission"
GROUP BY "securityLevel";
