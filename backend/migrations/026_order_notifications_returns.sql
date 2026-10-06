create table if not exists app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_id uuid references marketplace_orders(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists app_notifications_user_unread_idx on app_notifications(user_id, created_at desc) where read_at is null;
create index if not exists app_notifications_user_created_idx on app_notifications(user_id, created_at desc);

create table if not exists marketplace_return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace_orders(id) on delete cascade unique,
  buyer_id uuid not null references users(id),
  reason text not null,
  details text not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references users(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists marketplace_return_requests_status_idx on marketplace_return_requests(status, created_at);
create table if not exists customer_wallets (
  user_id uuid primary key references users(id) on delete cascade,
  available_kobo bigint not null default 0 check (available_kobo >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists customer_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_id uuid references marketplace_orders(id),
  entry_type text not null check (entry_type in ('order_refund')),
  amount_kobo bigint not null check (amount_kobo > 0),
  created_at timestamptz not null default now(),
  unique(order_id, entry_type)
);

alter table marketplace_orders drop constraint if exists marketplace_orders_status_check;
alter table marketplace_orders add constraint marketplace_orders_status_check
  check (status in ('proposed', 'accepted', 'rejected', 'cancelled', 'payment_pending', 'paid', 'in_progress', 'out_for_delivery', 'delivered', 'completed', 'refunded', 'disputed'));
