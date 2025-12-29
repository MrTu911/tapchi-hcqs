-- ✅ Giai đoạn 2: PostgreSQL Full-Text Search Setup
-- Tạo tsvector column và GIN index cho Submission table

-- Thêm tsvector column (nếu chưa có)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Submission' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE "Submission" ADD COLUMN "search_vector" tsvector;
  END IF;
END $$;

-- Tạo function để update search_vector
CREATE OR REPLACE FUNCTION submission_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."abstractVn", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW."abstractEn", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Drop trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS submission_search_vector_trigger ON "Submission";

-- Tạo trigger để auto-update search_vector
CREATE TRIGGER submission_search_vector_trigger
BEFORE INSERT OR UPDATE ON "Submission"
FOR EACH ROW EXECUTE FUNCTION submission_search_vector_update();

-- Update tất cả rows hiện tại
UPDATE "Submission" SET "search_vector" = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("abstractVn", '')), 'B') ||
  setweight(to_tsvector('english', COALESCE("abstractEn", '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(keywords, ' '), '')), 'C');

-- Tạo GIN index cho performance
CREATE INDEX IF NOT EXISTS "Submission_search_vector_idx" 
ON "Submission" USING GIN("search_vector");

-- Create index for common queries
CREATE INDEX IF NOT EXISTS "Submission_status_createdAt_idx" 
ON "Submission"(status, "createdAt" DESC);

