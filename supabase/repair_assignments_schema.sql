-- =============================================
-- Repair existing assignments table
-- =============================================
-- Run this in your Supabase SQL Editor if the app shows:
-- "Could not find the 'deadline' column of 'assignments' in the schema cache"
--
-- This keeps the frontend contract as:
-- assignments(id, user_id, title, subject, deadline, status, priority, created_at)
-- =============================================

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS deadline DATE;

-- If you previously created the table with a due_date column, copy it once.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'due_date'
  ) THEN
    UPDATE assignments
    SET deadline = due_date
    WHERE deadline IS NULL;
  END IF;
END $$;

-- Existing rows need a value before the column can be required.
UPDATE assignments
SET deadline = CURRENT_DATE
WHERE deadline IS NULL;

ALTER TABLE assignments
  ALTER COLUMN deadline SET NOT NULL;

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not started',
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add the same value checks as the main schema if they are missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignments_status_check'
  ) THEN
    ALTER TABLE assignments
      ADD CONSTRAINT assignments_status_check
      CHECK (status IN ('not started', 'in progress', 'done'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignments_priority_check'
  ) THEN
    ALTER TABLE assignments
      ADD CONSTRAINT assignments_priority_check
      CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Ask PostgREST/Supabase API to refresh its schema cache.
NOTIFY pgrst, 'reload schema';
