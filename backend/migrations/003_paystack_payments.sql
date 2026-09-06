-- Paystack payment references. BRIDGE stores provider references, never card details.
alter table marketplace_orders add column if not exists payment_provider text;
alter table marketplace_orders add column if not exists payment_reference text unique;
alter table marketplace_orders add column if not exists payment_authorization_url text;
alter table marketplace_orders add column if not exists paid_at timestamptz;
