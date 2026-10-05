-- Delivery-only catalogue checkout and gift delivery support.
alter table marketplace_orders add column if not exists buyer_contact_name text;
alter table marketplace_orders add column if not exists buyer_contact_phone text;
alter table marketplace_orders add column if not exists is_gift boolean not null default false;
alter table marketplace_orders add column if not exists gift_message text;
alter table marketplace_orders add column if not exists gift_recipient_name text;
alter table marketplace_orders add column if not exists gift_recipient_phone text;
alter table listings add column if not exists image_urls text[] not null default '{}';
