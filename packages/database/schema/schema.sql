-- PostgreSQL Database Schema for GitHub Commit Tracker
-- Version: 1.0.0
-- Description: Tracks GitHub commits and sends Telegram notifications

-- ============================================================================
-- Drop existing tables (if re-creating schema)
-- ============================================================================
-- Uncomment these lines if you need to recreate tables
-- DROP TABLE IF EXISTS commits CASCADE;
-- DROP TABLE IF EXISTS repositories CASCADE;
-- DROP TABLE IF EXISTS tracking_metadata CASCADE;

-- ============================================================================
-- Table: repositories
-- Description: Stores information about tracked repositories and branches
-- ============================================================================
CREATE TABLE repositories (
    id SERIAL PRIMARY KEY,
    repo_string VARCHAR(255) UNIQUE NOT NULL, -- Format: "owner/repo" or "owner/repo:branch"
    owner VARCHAR(100) NOT NULL,
    repo VARCHAR(100) NOT NULL,
    branch VARCHAR(100), -- NULL means default branch
    last_check_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for repositories table
CREATE INDEX idx_repositories_repo_string ON repositories(repo_string);
CREATE INDEX idx_repositories_owner_repo ON repositories(owner, repo);
CREATE INDEX idx_repositories_last_check_time ON repositories(last_check_time);

-- Comment on table
COMMENT ON TABLE repositories IS 'Stores tracked GitHub repositories and their branches';
COMMENT ON COLUMN repositories.repo_string IS 'Unique identifier: owner/repo or owner/repo:branch';
COMMENT ON COLUMN repositories.last_check_time IS 'Last time this repo/branch was checked for new commits';

-- ============================================================================
-- Table: commits
-- Description: Stores commits that have been notified via Telegram
-- ============================================================================
CREATE TABLE commits (
    id SERIAL PRIMARY KEY,
    sha VARCHAR(40) UNIQUE NOT NULL, -- Git commit SHA
    repository_id INTEGER NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    message TEXT,
    commit_date TIMESTAMP WITH TIME ZONE,
    html_url TEXT, -- GitHub commit URL
    notified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
);

-- Indexes for commits table
CREATE INDEX idx_commits_sha ON commits(sha);
CREATE INDEX idx_commits_repository_id ON commits(repository_id);
CREATE INDEX idx_commits_commit_date ON commits(commit_date);
CREATE INDEX idx_commits_notified_at ON commits(notified_at);

-- Comment on table
COMMENT ON TABLE commits IS 'Stores commits that have been notified to prevent duplicates';
COMMENT ON COLUMN commits.sha IS 'Git commit SHA (40 characters)';
COMMENT ON COLUMN commits.notified_at IS 'When the Telegram notification was sent';

-- ============================================================================
-- Table: tracking_metadata
-- Description: Stores global tracking settings and metadata
-- ============================================================================
CREATE TABLE tracking_metadata (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comment on table
COMMENT ON TABLE tracking_metadata IS 'Global settings and metadata for the tracking system';

-- ============================================================================
-- Initial Data
-- ============================================================================
-- Insert default metadata
INSERT INTO tracking_metadata (key, value) VALUES
    ('last_global_check', CURRENT_TIMESTAMP::TEXT),
    ('schema_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for repositories table
CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tracking_metadata table
CREATE TRIGGER update_tracking_metadata_updated_at
    BEFORE UPDATE ON tracking_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Useful Queries (for reference - DO NOT EXECUTE)
-- ============================================================================

-- View all tracked repositories
-- SELECT * FROM repositories ORDER BY created_at DESC;

-- Count commits per repository
-- SELECT
--     r.repo_string,
--     COUNT(c.id) as commit_count,
--     MAX(c.commit_date) as last_commit_date
-- FROM repositories r
-- LEFT JOIN commits c ON r.id = c.repository_id
-- GROUP BY r.repo_string
-- ORDER BY commit_count DESC;

-- Find recent notifications
-- SELECT
--     r.repo_string,
--     c.sha,
--     c.author_name,
--     c.message,
--     c.notified_at
-- FROM commits c
-- JOIN repositories r ON c.repository_id = r.id
-- ORDER BY c.notified_at DESC
-- LIMIT 10;

-- Cleanup old commits (older than 30 days)
-- DELETE FROM commits
-- WHERE notified_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- ============================================================================
-- Schema Information
-- ============================================================================
-- To view table structure:
-- \d repositories
-- \d commits
-- \d tracking_metadata

-- To view indexes:
-- \di

-- To view table sizes:
-- SELECT
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
