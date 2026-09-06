alter table listings add column if not exists image_url text;
alter table listings add column if not exists stock_quantity integer check (stock_quantity is null or stock_quantity >= 0);

create table if not exists marketplace_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace_orders(id) on delete cascade,
  listing_id uuid references listings(id), title text not null, quantity integer not null check (quantity > 0),
  unit_amount_kobo bigint not null check (unit_amount_kobo >= 0), created_at timestamptz not null default now()
);

create table if not exists user_terms_acceptances (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  terms_type text not null, version text not null, accepted_at timestamptz not null default now(),
  unique(user_id, terms_type, version)
);
