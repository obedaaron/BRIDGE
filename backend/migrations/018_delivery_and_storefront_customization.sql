alter table vendors add column if not exists out_of_city_delivery_fee_kobo bigint not null default 0 check (out_of_city_delivery_fee_kobo >= 0);
alter table vendors add column if not exists storefront_cover_url text;
alter table vendors add column if not exists storefront_accent_color text;
alter table vendors add column if not exists storefront_layout text not null default 'classic' check (storefront_layout in ('classic', 'modern', 'minimal'));

alter table marketplace_orders add column if not exists fulfilment_method text not null default 'pickup' check (fulfilment_method in ('pickup', 'local_delivery', 'outside_delivery'));
alter table marketplace_orders add column if not exists delivery_fee_kobo bigint not null default 0 check (delivery_fee_kobo >= 0);
alter table marketplace_orders add column if not exists pickup_location text;
alter table marketplace_orders add column if not exists delivery_address text;
alter table marketplace_orders add column if not exists delivery_city text;
alter table marketplace_orders add column if not exists delivery_state text;
alter table marketplace_orders add column if not exists buyer_contact_name text;
alter table marketplace_orders add column if not exists buyer_contact_phone text;
alter table marketplace_orders add column if not exists buyer_contact_submitted_at timestamptz;