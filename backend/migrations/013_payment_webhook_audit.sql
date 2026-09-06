-- Keep a minimal, non-sensitive audit trail of provider delivery and processing.
-- The raw webhook payload is deliberately not stored because it may include customer data.
create table if not exists payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_key text not null,
  event_type text not null,
  provider_reference text,
  processing_status text not null check (processing_status in ('processed')),
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create unique index if not exists payment_webhook_events_provider_key_idx on payment_webhook_events(provider, event_key);
create index if not exists payment_webhook_events_reference_idx on payment_webhook_events(provider_reference, received_at desc);
