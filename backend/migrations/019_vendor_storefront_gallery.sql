create table if not exists vendor_storefront_gallery_images (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  image_url text not null,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (vendor_id, position)
);

create index if not exists vendor_storefront_gallery_images_vendor_position_idx
  on vendor_storefront_gallery_images (vendor_id, position);
