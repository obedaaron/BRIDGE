-- A protected order keeps the agreed amount intact and records BRIDGE's fee separately.
-- No card or bank-account data is stored in this database.
alter table marketplace_orders add column if not exists platform_fee_kobo bigint not null default 0 check (platform_fee_kobo >= 0);
alter table marketplace_orders add column if not exists seller_amount_kobo bigint not null default 0 check (seller_amount_kobo >= 0);
alter table marketplace_orders add column if not exists delivery_proof_url text;
alter table marketplace_orders add column if not exists delivered_at timestamptz;
alter table marketplace_orders add column if not exists disputed_at timestamptz;
alter table marketplace_orders add column if not exists refunded_at timestamptz;
alter table marketplace_orders add column if not exists refund_reference text;
alter table marketplace_orders add column if not exists payout_status text not null default 'not_ready'
  check (payout_status in ('not_ready', 'pending', 'paid', 'failed', 'on_hold'));
alter table marketplace_orders add column if not exists payout_reference text;

create index if not exists marketplace_orders_status_idx on marketplace_orders(status, created_at desc);
