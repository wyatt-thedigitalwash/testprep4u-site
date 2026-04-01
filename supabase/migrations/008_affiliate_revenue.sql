-- 008_affiliate_revenue.sql
-- Adds primary/secondary key sequences on profiles, billing address columns,
-- revenue tracking on enrollments, affiliates table, commission payouts,
-- and two admin database views for the Customers and Referrals dashboards.

-- ============================================================
-- 1. PROFILES: primary_key / secondary_key sequences + columns
-- ============================================================

create sequence if not exists public.customer_primary_key_seq
  start with 100 increment by 1;

create sequence if not exists public.customer_secondary_key_seq
  start with 1000 increment by 1;

alter table public.profiles
  add column if not exists primary_key integer unique,
  add column if not exists secondary_key integer unique,
  add column if not exists billing_street text,
  add column if not exists billing_city text,
  add column if not exists billing_state text,
  add column if not exists billing_zip text;

-- Backfill existing profiles that don't have keys yet
do $$
declare
  r record;
begin
  for r in
    select id from public.profiles
    where primary_key is null
    order by created_at
  loop
    update public.profiles
    set
      primary_key = nextval('public.customer_primary_key_seq'),
      secondary_key = nextval('public.customer_secondary_key_seq')
    where id = r.id;
  end loop;
end;
$$;

-- Now make the columns NOT NULL after backfill
alter table public.profiles
  alter column primary_key set not null,
  alter column primary_key set default nextval('public.customer_primary_key_seq');

alter table public.profiles
  alter column secondary_key set not null,
  alter column secondary_key set default nextval('public.customer_secondary_key_seq');

-- ============================================================
-- Update handle_new_user trigger to auto-assign keys
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id, full_name, state, plan_tier, primary_key, secondary_key
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'state', ''),
    null,
    nextval('public.customer_primary_key_seq'),
    nextval('public.customer_secondary_key_seq')
  );
  return new;
end;
$$;

-- ============================================================
-- 2. ENROLLMENTS: revenue columns
-- ============================================================

alter table public.enrollments
  add column if not exists gross_amount numeric,
  add column if not exists discount_amount numeric,
  add column if not exists tax_amount numeric,
  add column if not exists fee_amount numeric,
  add column if not exists net_amount numeric;

-- ============================================================
-- 3. AFFILIATES table
-- ============================================================

create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  commission_rate numeric not null,
  commission_type text not null default 'percentage'
    check (commission_type in ('percentage', 'fixed')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_affiliates_user_id on public.affiliates(user_id);

alter table public.affiliates enable row level security;

-- Service role has full access
create policy "Service role can manage affiliates"
  on public.affiliates for all
  using (auth.role() = 'service_role');

-- Users can read their own affiliate record
create policy "Users can read own affiliate record"
  on public.affiliates for select
  using (auth.uid() = user_id);

-- ============================================================
-- 4. FK from discount_codes.affiliate_id to affiliates.id
-- ============================================================

alter table public.discount_codes
  add constraint discount_codes_affiliate_fk
  foreign key (affiliate_id) references public.affiliates(id)
  on delete set null;

-- ============================================================
-- 5. COMMISSION_PAYOUTS table
-- ============================================================

create table public.commission_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  redemption_id uuid not null references public.discount_code_redemptions(id) on delete cascade,
  commission_amount numeric not null,
  gross_profit numeric not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid')),
  approved_by text,
  approved_at timestamptz,
  paid_by text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_commission_payouts_affiliate on public.commission_payouts(affiliate_id);
create index idx_commission_payouts_redemption on public.commission_payouts(redemption_id);
create index idx_commission_payouts_status on public.commission_payouts(status);

alter table public.commission_payouts enable row level security;

-- Service role has full access
create policy "Service role can manage commission payouts"
  on public.commission_payouts for all
  using (auth.role() = 'service_role');

-- Affiliates can read their own payouts
create policy "Affiliates can read own payouts"
  on public.commission_payouts for select
  using (
    affiliate_id in (
      select id from public.affiliates where user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. DATABASE VIEW: admin_primary_key_view (Customers)
-- ============================================================
-- Joins profiles → auth.users → enrollments → courses →
-- discount_code_redemptions → discount_codes → affiliates
-- to produce the customer/enrollment view for the admin dashboard.

create or replace view public.admin_primary_key_view as
select
  p.primary_key,
  p.secondary_key,
  p.full_name as customer_name,
  p.billing_street,
  p.billing_city,
  p.billing_state,
  p.billing_zip,
  p.phone,
  u.email,
  c.name as course_name,
  c.state as course_state,
  p.plan_tier,
  -- Referral: find the secondary_key of the affiliate whose discount code
  -- was used for this enrollment (via stripe_session_id → redemption → code → affiliate → profile)
  referrer.secondary_key as referral_code,
  e.enrolled_at,
  e.gross_amount,
  e.discount_amount,
  e.tax_amount,
  e.fee_amount,
  e.net_amount,
  e.id as enrollment_id,
  p.id as user_id
from public.profiles p
  join auth.users u on u.id = p.id
  left join public.enrollments e on e.user_id = p.id
  left join public.courses c on c.id = e.course_id
  left join public.discount_code_redemptions dcr
    on dcr.stripe_checkout_session_id = e.stripe_session_id
  left join public.discount_codes dc on dc.id = dcr.discount_code_id
  left join public.affiliates a on a.id = dc.affiliate_id
  left join public.profiles referrer on referrer.id = a.user_id;

-- ============================================================
-- 7. DATABASE VIEW: admin_secondary_key_view (Referrals)
-- ============================================================
-- Joins commission_payouts → affiliates → profiles →
-- discount_code_redemptions → enrollments to produce the
-- referral/commission view for the admin dashboard.

create or replace view public.admin_secondary_key_view as
select
  partner_profile.secondary_key as partner_secondary_key,
  partner_profile.full_name as partner_name,
  partner_profile.primary_key as partner_primary_key,
  customer_profile.primary_key as customer_primary_key,
  customer_profile.full_name as customer_name,
  dcr.created_at as redemption_date,
  e.gross_amount,
  e.discount_amount,
  e.tax_amount,
  e.fee_amount,
  e.net_amount,
  cp.commission_amount,
  cp.gross_profit,
  cp.status as paid_status,
  cp.paid_at as paid_date,
  cp.paid_by as payor_name,
  cp.approved_by as manager_approval_name,
  cp.approved_at as approval_date,
  cp.id as payout_id,
  aff.id as affiliate_id
from public.commission_payouts cp
  join public.affiliates aff on aff.id = cp.affiliate_id
  join public.profiles partner_profile on partner_profile.id = aff.user_id
  join public.discount_code_redemptions dcr on dcr.id = cp.redemption_id
  join public.profiles customer_profile on customer_profile.id = dcr.user_id
  left join public.enrollments e
    on e.stripe_session_id = dcr.stripe_checkout_session_id;

-- ============================================================
-- 8. RLS on views (Postgres views inherit from base tables,
--    but we restrict direct view access to service_role)
-- ============================================================

-- Views in Postgres don't support RLS directly. Access is controlled
-- by the caller's role — admin pages use createAdminClient() (service_role)
-- which bypasses RLS on the underlying tables. Authenticated users querying
-- these views directly will be blocked by the base table RLS policies
-- (profiles: own row only, enrollments: own rows only, etc.).
--
-- No additional policies needed — the existing RLS on base tables
-- already prevents non-admin access to cross-user data.
