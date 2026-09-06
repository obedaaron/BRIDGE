-- Promotion slots are a plan entitlement, not a paid-per-click advertising product.
create table if not exists vendor_promotions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  listing_id uuid not null unique references listings(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists vendor_promotions_active_idx on vendor_promotions(vendor_id, ends_at desc) where status = 'active';
