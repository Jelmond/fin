-- Migration: Remove amount from bonuses/penalties and add tags system
-- Run this in Supabase SQL Editor if you have an existing database

-- Step 1: Remove amount column from bonuses table
ALTER TABLE bonuses DROP COLUMN IF EXISTS amount;

-- Step 2: Remove amount column from penalties table
ALTER TABLE penalties DROP COLUMN IF EXISTS amount;

-- Step 3: Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Step 4: Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS finance_entry_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_entry_id uuid NOT NULL REFERENCES finance_entries(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(finance_entry_id, tag_id)
);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finance_entry_tags_entry_id ON finance_entry_tags(finance_entry_id);
CREATE INDEX IF NOT EXISTS idx_finance_entry_tags_tag_id ON finance_entry_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Step 6: If you had tags as text[] in finance_entries, migrate them (optional)
-- This will migrate existing tags from the old text[] column to the new structure
DO $$
DECLARE
  entry_record RECORD;
  tag_name text;
  tag_id_val uuid;
BEGIN
  -- Only run if tags column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'finance_entries' AND column_name = 'tags'
  ) THEN
    FOR entry_record IN SELECT id, tags FROM finance_entries WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
    LOOP
      FOREACH tag_name IN ARRAY entry_record.tags
      LOOP
        -- Get or create tag
        INSERT INTO tags (name) VALUES (tag_name)
        ON CONFLICT (name) DO NOTHING;
        
        SELECT id INTO tag_id_val FROM tags WHERE name = tag_name;
        
        -- Link tag to entry
        INSERT INTO finance_entry_tags (finance_entry_id, tag_id)
        VALUES (entry_record.id, tag_id_val)
        ON CONFLICT (finance_entry_id, tag_id) DO NOTHING;
      END LOOP;
    END LOOP;
    
    -- Remove old tags column after migration
    ALTER TABLE finance_entries DROP COLUMN IF EXISTS tags;
  END IF;
END $$;

-- Verify changes
-- You can run these to check:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bonuses';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'penalties';
-- SELECT * FROM tags;
-- SELECT * FROM finance_entry_tags LIMIT 10;

