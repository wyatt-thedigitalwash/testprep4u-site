-- TestPrep4U — Admin Role
-- Adds is_admin flag to profiles for gating admin dashboard access.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;
