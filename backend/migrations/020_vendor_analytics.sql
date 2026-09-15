-- Aggregated daily storefront activity. This deliberately contains no visitor identifiers.
create table if not exists vendor_storefront_daily_metrics (
  vendor_id uuid not null references vendors(id) on delete cascade,
  metric_date date not null,
  store_views integer not null default 0 check (store_views >= 0),
  primary key (vendor_id, metric_date)
);

create index if not exists vendor_storefront_daily_metrics_vendor_date_idx
  on vendor_storefront_daily_metrics (vendor_id, metric_date desc);

-- Interest events are pseudonymous to the logged-in account and only influence marketplace ranking.
create table if not exists user_marketplace_interests (
  user_id uuid not null references users(id) on delete cascade,
  interest_key text not null check (char_length(interest_key) between 2 and 120),
  weight integer not null default 1 check (weight > 0),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, interest_key)
);

create index if not exists user_marketplace_interests_user_weight_idx
  on user_marketplace_interests (user_id, weight desc, last_seen_at desc);
