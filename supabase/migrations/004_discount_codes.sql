-- TestPrep4U — Discount Codes
-- Foundational for affiliate tracking system (Phase 5).
-- discount_codes.affiliate_id will reference a future affiliates table.

-- ============================================================
-- DISCOUNT CODES
-- ============================================================

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  max_uses integer,
  current_uses integer not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  affiliate_id uuid,  -- FK to future affiliates table
  applicable_products text[],  -- null = all products, otherwise array of Stripe price IDs
  created_at timestamptz not null default now(),

  -- Store uppercase, enforce unique on uppercase
  constraint discount_codes_code_upper check (code = upper(code))
);

create unique index discount_codes_code_unique on public.discount_codes (upper(code));

-- RLS: discount codes are read-only from the client (validated via API routes).
-- Only service_role / admin can insert/update.
alter table public.discount_codes enable row level security;

create policy "Anyone can read active discount codes"
  on public.discount_codes for select
  using (true);

-- ============================================================
-- DISCOUNT CODE REDEMPTIONS
-- ============================================================

create table public.discount_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text not null,
  amount_discounted numeric not null,
  created_at timestamptz not null default now()
);

alter table public.discount_code_redemptions enable row level security;

create policy "Users can read own redemptions"
  on public.discount_code_redemptions for select
  using (auth.uid() = user_id);

-- Index for looking up redemptions by checkout session (webhook idempotency)
create index discount_code_redemptions_session_idx
  on public.discount_code_redemptions (stripe_checkout_session_id);

-- Index for counting uses per code
create index discount_code_redemptions_code_idx
  on public.discount_code_redemptions (discount_code_id);

-- ============================================================
-- HELPER: Atomic increment of current_uses
-- ============================================================

create or replace function public.increment_discount_uses(code_id uuid)
returns void
language sql
security definer
as $$
  update public.discount_codes
  set current_uses = current_uses + 1
  where id = code_id;
$$;
