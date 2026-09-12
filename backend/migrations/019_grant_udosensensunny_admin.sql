-- Promotes the existing account once it has registered. This migration is safe to
-- run before registration; re-run it after the account exists if migrations are
-- managed manually.
update users set role = 'admin' where lower(email) = 'udosensensunny@gmail.com';