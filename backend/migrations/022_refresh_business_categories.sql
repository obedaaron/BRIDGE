-- Refresh BRIDGE categories while preserving each vendor's category assignment.
insert into categories (name, slug) values
  ('Fashion & Accessories', 'fashion-accessories'),
  ('Electronics', 'electronics'),
  ('Food & Beverages', 'food-beverages'),
  ('Beauty & Personal Care', 'beauty-personal-care'),
  ('Home & Living', 'home-living'),
  ('Repairs & Maintenance', 'repairs-maintenance'),
  ('Hair & Beauty', 'hair-beauty'),
  ('Tailoring & Alterations', 'tailoring-alterations'),
  ('Logistics & Delivery', 'logistics-delivery'),
  ('Digital Services', 'digital-services'),
  ('Health & Wellness', 'health-wellness'),
  ('Education & Training', 'education-training'),
  ('Events & Media', 'events-media'),
  ('Auto & Mobility', 'auto-mobility'),
  ('Other Services', 'other-services')
on conflict (slug) do update set name = excluded.name;

update vendors v
set category_id = target.id
from categories old
join categories target on target.slug = case
  when lower(old.slug || ' ' || old.name) ~ '(fashion|apparel|clothing)' then 'fashion-accessories'
  when lower(old.slug || ' ' || old.name) ~ '(hair|barber|salon)' then 'hair-beauty'
  when lower(old.slug || ' ' || old.name) ~ '(beauty|cosmetic|skin)' then 'beauty-personal-care'
  when lower(old.slug || ' ' || old.name) ~ '(food|cater|beverage|restaurant|bakery|drink)' then 'food-beverages'
  when lower(old.slug || ' ' || old.name) ~ '(electronic|gadget|phone|computer)' then 'electronics'
  when lower(old.slug || ' ' || old.name) ~ '(tailor|sewing|alteration)' then 'tailoring-alterations'
  when lower(old.slug || ' ' || old.name) ~ '(repair|mechanic|plumb|electri|maintenance)' then 'repairs-maintenance'
  when lower(old.slug || ' ' || old.name) ~ '(home|interior|furniture|clean)' then 'home-living'
  when lower(old.slug || ' ' || old.name) ~ '(logistic|delivery|courier|transport)' then 'logistics-delivery'
  when lower(old.slug || ' ' || old.name) ~ '(digital|software|web|tech|marketing)' then 'digital-services'
  when lower(old.slug || ' ' || old.name) ~ '(health|wellness|fitness|medical)' then 'health-wellness'
  when lower(old.slug || ' ' || old.name) ~ '(educat|tutor|training|school)' then 'education-training'
  when lower(old.slug || ' ' || old.name) ~ '(event|photo|media|music|entertain)' then 'events-media'
  when lower(old.slug || ' ' || old.name) ~ '(auto|vehicle|car|motor|mechanic)' then 'auto-mobility'
  else 'other-services'
end
where v.category_id = old.id
  and old.slug not in ('fashion-accessories','electronics','food-beverages','beauty-personal-care','home-living','repairs-maintenance','hair-beauty','tailoring-alterations','logistics-delivery','digital-services','health-wellness','education-training','events-media','auto-mobility','other-services');

update listings l
set category_id = v.category_id
from vendors v, categories old
where l.vendor_id = v.id
  and l.category_id = old.id
  and old.slug not in ('fashion-accessories','electronics','food-beverages','beauty-personal-care','home-living','repairs-maintenance','hair-beauty','tailoring-alterations','logistics-delivery','digital-services','health-wellness','education-training','events-media','auto-mobility','other-services');

delete from categories
where slug not in ('fashion-accessories','electronics','food-beverages','beauty-personal-care','home-living','repairs-maintenance','hair-beauty','tailoring-alterations','logistics-delivery','digital-services','health-wellness','education-training','events-media','auto-mobility','other-services');
