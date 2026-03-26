-- 003_completion_flow.sql
-- Adds affidavit signing metadata, Stripe session idempotency key,
-- plan_tier fix, and RLS hardening.

-- ── Affidavit signing metadata on enrollments ──────────────
alter table public.enrollments
  add column if not exists affidavit_ip text,
  add column if not exists affidavit_user_agent text,
  add column if not exists affidavit_typed_name text;

-- ── Stripe session ID for webhook idempotency ──────────────
alter table public.enrollments
  add column if not exists stripe_session_id text;

create unique index if not exists idx_enrollments_stripe_session_id
  on public.enrollments(stripe_session_id)
  where stripe_session_id is not null;

-- ── Make plan_tier nullable (new users don't have a plan yet) ──
-- Drop the existing CHECK constraint and re-add with 'none' option,
-- then make the column nullable with a default.
alter table public.profiles
  alter column plan_tier drop not null,
  alter column plan_tier set default null;
-- Drop existing check and add new one that allows null
alter table public.profiles
  drop constraint if exists profiles_plan_tier_check;
alter table public.profiles
  add constraint profiles_plan_tier_check
  check (plan_tier is null or plan_tier in ('essentials', 'pro', 'premium'));

-- ── Restrict enrollment updates to service role only ──────────
-- Drop the overly permissive update policy and replace with service-role only
drop policy if exists "Service role can update enrollments" on public.enrollments;
create policy "Service role can update enrollments"
  on public.enrollments for update
  using (auth.role() = 'service_role');
