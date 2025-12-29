-- Add pdfUrl column to Issue table
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
