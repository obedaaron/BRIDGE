-- Read state belongs to the participant, not to a message globally: one person
-- opening a conversation must never clear the other participant's unread count.
create table if not exists conversation_read_receipts (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists messages_conversation_sender_created_idx on messages(conversation_id, sender_id, created_at desc);
