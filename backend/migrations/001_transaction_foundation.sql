-- Apply this migration after the existing BRIDGE schema. It creates the audit
-- trail required for negotiated, protected marketplace transactions.
create extension if not exists pgcrypto;

create table if not exists marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  vendor_id uuid not null references vendors(id),
  buyer_id uuid not null references users(id),
  seller_id uuid not null references users(id),
  title text not null,
  description text,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency char(3) not null default 'NGN',
  delivery_terms text,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'rejected', 'cancelled', 'payment_pending', 'paid', 'in_progress', 'delivered', 'completed', 'refunded', 'disputed')),
  expires_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_orders_conversation_idx on marketplace_orders(conversation_id, created_at desc);
create index if not exists marketplace_orders_buyer_idx on marketplace_orders(buyer_id, created_at desc);
create index if not exists marketplace_orders_vendor_idx on marketplace_orders(vendor_id, created_at desc);

create table if not exists marketplace_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace_orders(id) on delete cascade,
  actor_id uuid references users(id),
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists marketplace_order_events_order_idx on marketplace_order_events(order_id, created_at asc);
