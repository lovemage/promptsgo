-- Add media column to comments table
-- This allows users to upload one image or video with their comment

ALTER TABLE comments
ADD COLUMN IF NOT EXISTS media TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN comments.media IS 'URL of uploaded image or video (one per comment)';

