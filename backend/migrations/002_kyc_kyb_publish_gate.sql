-- KYC/KYB provider references only: never persist a full NIN or biometric data.
alter table vendor_verifications add column if not exists provider text;
alter table vendor_verifications add column if not exists provider_reference text;
alter table vendor_verifications add column if not exists provider_status text;
alter table vendor_verifications add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists vendor_verifications_active_type_idx
  on vendor_verifications(vendor_id, type)
  where status in ('pending', 'approved');
