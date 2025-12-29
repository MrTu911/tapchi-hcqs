-- Database Optimization Script for Tạp chí Hậu cần Quân sự
-- Run this to optimize database performance

-- ============================================
-- 1. ANALYZE TABLES (Update statistics)
-- ============================================
ANALYZE "User";
ANALYZE "Submission";
ANALYZE "Article";
ANALYZE "Review";
ANALYZE "Issue";
ANALYZE "AuditLog";

-- ============================================
-- 2. VACUUM (Cleanup dead rows)
-- ============================================
-- Note: Run VACUUM separately during low-traffic periods
-- VACUUM ANALYZE "User";
-- VACUUM ANALYZE "Submission";
-- VACUUM ANALYZE "Article";
-- VACUUM ANALYZE "Review";
-- VACUUM ANALYZE "Issue";
-- VACUUM ANALYZE "AuditLog";

-- ============================================
-- 3. CREATE ADDITIONAL INDEXES (if not exists)
-- ============================================

-- Submission search optimization
CREATE INDEX IF NOT EXISTS "idx_submission_author_status" 
  ON "Submission" ("authorId", "status");

CREATE INDEX IF NOT EXISTS "idx_submission_created_at" 
  ON "Submission" ("createdAt" DESC);

-- Article search optimization
CREATE INDEX IF NOT EXISTS "idx_article_issue_published" 
  ON "Article" ("issueId", "publishedAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_article_category" 
  ON "Article" ("categoryId");

-- Review workflow optimization
CREATE INDEX IF NOT EXISTS "idx_review_status" 
  ON "Review" ("status");

CREATE INDEX IF NOT EXISTS "idx_review_reviewer_status" 
  ON "Review" ("reviewerId", "status");

-- Issue management optimization
CREATE INDEX IF NOT EXISTS "idx_issue_status_year" 
  ON "Issue" ("status", "year" DESC);

-- Audit log queries optimization
CREATE INDEX IF NOT EXISTS "idx_auditlog_actor_created" 
  ON "AuditLog" ("actorId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_auditlog_action_created" 
  ON "AuditLog" ("action", "createdAt" DESC);

-- Full-text search indexes (GIN for better text search)
CREATE INDEX IF NOT EXISTS "idx_submission_title_gin" 
  ON "Submission" USING gin(to_tsvector('english', "title"));

CREATE INDEX IF NOT EXISTS "idx_submission_abstract_gin" 
  ON "Submission" USING gin(to_tsvector('english', "abstract_vi"));

CREATE INDEX IF NOT EXISTS "idx_article_title_gin" 
  ON "Article" USING gin(to_tsvector('english', "title"));

-- ============================================
-- 4. QUERY PERFORMANCE VIEWS
-- ============================================

-- View for slow queries monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- View for table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- View for index usage statistics
CREATE OR REPLACE VIEW index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- ============================================
-- 5. HELPFUL QUERIES FOR MONITORING
-- ============================================

-- Check database size
-- SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table bloat
-- SELECT * FROM table_sizes;

-- Check unused indexes
-- SELECT * FROM index_usage WHERE index_scans = 0;

-- Check slow queries
-- SELECT * FROM slow_queries;

-- Check active connections
-- SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check long-running queries
-- SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
-- FROM pg_stat_activity
-- WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 minutes'
-- ORDER BY duration DESC;
