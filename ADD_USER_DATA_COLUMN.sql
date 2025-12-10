
-- Add a JSONB column 'data' to the 'users' table to store user-specific application state (prompts, categories, settings)
ALTER TABLE users ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
