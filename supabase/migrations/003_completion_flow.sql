-- 003_completion_flow.sql
-- Adds affidavit signing metadata and ensures certificate table is ready.

-- ── Affidavit signing metadata on enrollments ──────────────
alter table public.enrollments
  add column if not exists affidavit_ip text,
  add column if not exists affidavit_user_agent text,
  add column if not exists affidavit_typed_name text;
