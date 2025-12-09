-- Run this in your Supabase SQL Editor to add the source_url column

ALTER TABLE global_prompts ADD COLUMN IF NOT EXISTS source_url TEXT;
