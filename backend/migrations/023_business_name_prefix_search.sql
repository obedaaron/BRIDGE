-- Keep one-character business-name autocomplete searches index-backed.
create index if not exists vendors_published_business_name_prefix_idx
  on vendors (lower(business_name) text_pattern_ops)
  where is_published = true;