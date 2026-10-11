-- Optional reset requested by the account owner.
-- Run AFTER setup_workspace.sql, in Supabase SQL Editor.
-- Replace only the email below with your StudyFlow login email.
-- This removes YOUR tasks, projects, and study sessions, not your login account
-- or other users' data. It refuses to run while private attachment files exist.
BEGIN;
DO $$
DECLARE
  target_email text := 'YOUR_STUDYFLOW_LOGIN_EMAIL';
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE lower(email) = lower(btrim(target_email));
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Enter the email you use to sign in to StudyFlow before running the reset.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM storage.objects WHERE bucket_id = 'task-attachments'
      AND (storage.foldername(name))[1] = target_user_id::text
  ) THEN
    RAISE EXCEPTION 'Delete this account''s task attachments through Supabase Storage or StudyFlow first, then rerun. Do not DELETE storage.objects directly.';
  END IF;
  DELETE FROM public.assignments WHERE user_id = target_user_id;
  DELETE FROM public.study_sessions WHERE user_id = target_user_id;
  DELETE FROM public.projects WHERE user_id = target_user_id;
  RAISE NOTICE 'StudyFlow data reset for %. Your login account is kept.', target_email;
END $$;
COMMIT;
