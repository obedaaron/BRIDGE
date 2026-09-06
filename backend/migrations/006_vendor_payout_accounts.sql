-- Raw bank account numbers are sent directly to Paystack and are never retained by BRIDGE.
create table if not exists vendor_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null unique references vendors(id) on delete cascade,
  provider text not null default 'paystack',
  recipient_code text not null unique,
  bank_code text not null,
  bank_name text,
  account_name text,
  account_last4 char(4) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
