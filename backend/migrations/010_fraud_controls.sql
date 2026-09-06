-- Risk findings are separate from payment records so every hold and reviewer decision is auditable.
create table if not exists marketplace_fraud_alerts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace_orders(id) on delete cascade,
  code text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references users(id),
  resolution_note text
);
create index if not exists marketplace_fraud_alerts_review_idx on marketplace_fraud_alerts(status, severity, created_at asc);
create unique index if not exists marketplace_fraud_alerts_open_code_idx on marketplace_fraud_alerts(order_id, code) where status = 'open';

-- Claiming a payout before calling the provider prevents two admins releasing it.
alter table marketplace_orders drop constraint if exists marketplace_orders_payout_status_check;
alter table marketplace_orders add constraint marketplace_orders_payout_status_check
  check (payout_status in ('not_ready', 'pending', 'processing', 'paid', 'failed', 'on_hold'));
