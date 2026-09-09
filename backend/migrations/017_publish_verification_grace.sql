alter table vendors add column if not exists publish_grace_expires_at timestamptz;
alter table vendors add column if not exists publish_grace_used_at timestamptz;

-- Stores already live when this policy is introduced receive the same grace period.
update vendors
set publish_grace_used_at = now(), publish_grace_expires_at = now() + interval '7 days'
where is_published = true and publish_grace_used_at is null;

create index if not exists vendors_publish_grace_expiry_idx
  on vendors(publish_grace_expires_at)
  where is_published = true and publish_grace_expires_at is not null;
