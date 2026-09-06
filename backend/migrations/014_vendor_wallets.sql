-- Internal ledger for vendor earnings. Available funds are credited only after a
-- buyer confirms delivery; withdrawals reserve funds before a provider transfer.
create table if not exists vendor_wallets (
  vendor_id uuid primary key references vendors(id) on delete cascade,
  available_kobo bigint not null default 0 check (available_kobo >= 0),
  pending_withdrawal_kobo bigint not null default 0 check (pending_withdrawal_kobo >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists vendor_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  order_id uuid references marketplace_orders(id),
  withdrawal_id uuid,
  entry_type text not null check (entry_type in ('order_credit', 'withdrawal_reserve', 'withdrawal_reversal')),
  amount_kobo bigint not null check (amount_kobo <> 0),
  created_at timestamptz not null default now(),
  unique(order_id, entry_type)
);

create table if not exists vendor_wallet_withdrawals (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  payout_account_id uuid not null references vendor_payout_accounts(id),
  amount_kobo bigint not null check (amount_kobo > 0),
  status text not null default 'requested' check (status in ('requested', 'processing', 'paid', 'failed', 'on_hold', 'cancelled')),
  provider text not null default 'paystack',
  provider_reference text unique,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references users(id),
  failure_reason text
);
alter table vendor_wallet_transactions add constraint vendor_wallet_transactions_withdrawal_fk
  foreign key (withdrawal_id) references vendor_wallet_withdrawals(id) on delete set null;
create index if not exists vendor_wallet_transactions_vendor_idx on vendor_wallet_transactions(vendor_id, created_at desc);
create index if not exists vendor_wallet_withdrawals_review_idx on vendor_wallet_withdrawals(status, requested_at asc);

alter table marketplace_orders drop constraint if exists marketplace_orders_payout_status_check;
alter table marketplace_orders add constraint marketplace_orders_payout_status_check
  check (payout_status in ('not_ready', 'pending', 'wallet_available', 'processing', 'paid', 'failed', 'on_hold'));
