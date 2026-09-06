create table if not exists vendor_subscriptions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  tier text not null check (tier in ('standard', 'premium')),
  status text not null default 'pending' check (status in ('pending', 'active', 'past_due', 'cancelled')),
  amount_kobo bigint not null check (amount_kobo > 0),
  currency char(3) not null default 'NGN',
  payment_reference text unique,
  provider text not null default 'paystack',
  provider_plan_code text not null,
  provider_subscription_code text,
  started_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vendor_subscriptions_vendor_idx on vendor_subscriptions(vendor_id, created_at desc);
