-- 009_stripe_promo_sync.sql
-- Adds Stripe coupon/promotion code IDs to discount_codes for sync.

alter table public.discount_codes
  add column if not exists stripe_coupon_id text,
  add column if not exists stripe_promo_code_id text;
