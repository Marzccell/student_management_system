-- Remove client grants on installations that already applied the workspace upgrade.
BEGIN;
REVOKE ALL ON FUNCTION public.studyflow_require_file_cleanup() FROM public, anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
