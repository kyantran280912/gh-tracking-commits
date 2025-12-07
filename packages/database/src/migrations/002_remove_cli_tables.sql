-- Migration: Remove CLI-specific tables
-- Date: 2025-11-25
-- Description: Drop cli_commits and cli_metadata tables as we move to dashboard-only architecture

-- Drop CLI tables
DROP TABLE IF EXISTS cli_commits CASCADE;
DROP TABLE IF EXISTS cli_metadata CASCADE;

-- Add comment to document this change
COMMENT ON DATABASE postgres IS 'Removed CLI tables - now using packages/scripts with main commits table for tracking';
