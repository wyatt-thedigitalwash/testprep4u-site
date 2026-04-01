-- 010_fix_scorm_paths.sql
-- Reverts scorm_entry_path values from the failed Supabase Storage migration.
-- Strips "storage:" prefix and restores "scorm/" prefix so paths resolve
-- to public/scorm/ as static assets.

update public.course_modules
set scorm_entry_path = 'scorm/' || replace(scorm_entry_path, 'storage:', '')
where scorm_entry_path like 'storage:%';
