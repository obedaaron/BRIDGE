alter table users add column if not exists deletion_requested_at timestamptz;
alter table users add column if not exists deletion_scheduled_for timestamptz;
alter table users add column if not exists account_deletion_completed_at timestamptz;

create index if not exists users_scheduled_deletion_idx
  on users (deletion_scheduled_for)
  where deletion_scheduled_for is not null;
