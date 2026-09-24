-- Keep historical order item snapshots while allowing vendors to remove listings.
alter table marketplace_order_items
  drop constraint if exists marketplace_order_items_listing_id_fkey;

alter table marketplace_order_items
  add constraint marketplace_order_items_listing_id_fkey
  foreign key (listing_id) references listings(id) on delete set null;
