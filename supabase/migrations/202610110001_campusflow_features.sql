-- StudyFlow workspace upgrade. PostgreSQL 15+ / Supabase.
-- Apply AFTER the existing assignments/study_sessions schema, on a test database
-- first. This is an additive migration: no task rows or old columns are removed.
BEGIN;

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 10000),
  deadline date,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)
);

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS project_id uuid,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.assignments ALTER COLUMN deadline DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_project_owner_fk' AND conrelid = 'public.assignments'::regclass) THEN
    ALTER TABLE public.assignments ADD CONSTRAINT assignments_project_owner_fk
      FOREIGN KEY (project_id, user_id) REFERENCES public.projects(id, user_id)
      ON DELETE SET NULL (project_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_description_length' AND conrelid = 'public.assignments'::regclass) THEN
    ALTER TABLE public.assignments ADD CONSTRAINT assignments_description_length CHECK (char_length(description) <= 10000);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS projects_user_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS assignments_user_project_idx ON public.assignments(user_id, project_id);
CREATE INDEX IF NOT EXISTS assignments_user_deadline_idx ON public.assignments(user_id, deadline);

CREATE OR REPLACE FUNCTION public.studyflow_touch_project() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS studyflow_project_updated ON public.projects;
CREATE TRIGGER studyflow_project_updated BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.studyflow_touch_project();

CREATE OR REPLACE FUNCTION public.studyflow_task_fields() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  -- Validate new/changed titles without invalidating untouched historical data.
  IF TG_OP = 'INSERT' OR NEW.title IS DISTINCT FROM OLD.title THEN
    IF char_length(btrim(NEW.title)) NOT BETWEEN 1 AND 200 THEN
      RAISE EXCEPTION 'Task title must contain 1 to 200 characters.' USING ERRCODE = '23514';
    END IF;
  END IF;
  NEW.updated_at := now();
  IF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.completed_at := now();
  ELSIF OLD.status <> 'done' THEN
    NEW.completed_at := now();
  ELSE
    -- Old completed tasks retain NULL: their historical completion time is unknown.
    NEW.completed_at := OLD.completed_at;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS studyflow_task_updated ON public.assignments;
CREATE TRIGGER studyflow_task_updated BEFORE INSERT OR UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.studyflow_task_fields();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "studyflow_projects_owner" ON public.projects;
CREATE POLICY "studyflow_projects_owner" ON public.projects FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
REVOKE ALL ON public.projects FROM anon;

-- A restrictive policy also protects against accidentally broad pre-existing
-- permissive assignment policies. Existing ownership policies are preserved.
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "studyflow_assignment_owner_guard" ON public.assignments;
CREATE POLICY "studyflow_assignment_owner_guard" ON public.assignments AS RESTRICTIVE
  FOR ALL TO public USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('task-attachments', 'task-attachments', false, 10485760)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760;

-- File keys: <owner UUID>/<assignment UUID>/<random UUID>_<safe filename>.
-- Storage itself provides file metadata, avoiding two sources of truth.
DROP POLICY IF EXISTS "studyflow_attachment_owner" ON storage.objects;
CREATE POLICY "studyflow_attachment_owner" ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (SELECT 1 FROM public.assignments a
      WHERE a.id::text = (storage.foldername(name))[2] AND a.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (SELECT 1 FROM public.assignments a
      WHERE a.id::text = (storage.foldername(name))[2] AND a.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "studyflow_attachment_guard" ON storage.objects;
CREATE POLICY "studyflow_attachment_guard" ON storage.objects AS RESTRICTIVE FOR ALL TO public
  USING (
    bucket_id <> 'task-attachments' OR (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      AND EXISTS (SELECT 1 FROM public.assignments a
        WHERE a.id::text = (storage.foldername(name))[2] AND a.user_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    bucket_id <> 'task-attachments' OR (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      AND EXISTS (SELECT 1 FROM public.assignments a
        WHERE a.id::text = (storage.foldername(name))[2] AND a.user_id = (SELECT auth.uid()))
    )
  );

-- Refuse direct task deletion until Storage's API has removed its attachments.
-- This also protects files when an older application version deletes a task.
CREATE OR REPLACE FUNCTION public.studyflow_require_file_cleanup() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'task-attachments'
    AND (storage.foldername(o.name))[1] = OLD.user_id::text
    AND (storage.foldername(o.name))[2] = OLD.id::text) THEN
    RAISE EXCEPTION 'Remove task attachments before deleting this task.' USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END $$;
-- Supabase may explicitly grant new functions to client roles by default.
-- This function runs only through the task deletion trigger.
REVOKE ALL ON FUNCTION public.studyflow_require_file_cleanup() FROM public, anon, authenticated;
DROP TRIGGER IF EXISTS studyflow_task_file_cleanup ON public.assignments;
CREATE TRIGGER studyflow_task_file_cleanup BEFORE DELETE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.studyflow_require_file_cleanup();

NOTIFY pgrst, 'reload schema';
COMMIT;
