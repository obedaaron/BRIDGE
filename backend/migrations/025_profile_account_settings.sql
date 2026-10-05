-- Customer profile fields and privacy preferences.
alter table users add column if not exists username text;
alter table users add column if not exists personalized_ads_enabled boolean not null default false;
create unique index if not exists users_username_lower_unique_idx on users (lower(username)) where username is not null;
