alter table users add column if not exists phone text;
alter table users add column if not exists email_verified_at timestamptz;
alter table users add column if not exists phone_verified_at timestamptz;

create table if not exists contact_verification_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('email', 'phone')),
  destination text not null,
  code_hash text not null,
  provider_reference text,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists contact_verification_challenges_lookup_idx on contact_verification_challenges(user_id, type, created_at desc);
