-- =============================================================
-- Email + Push notification tables
-- =============================================================

-- 1. Email message tracking (mirrors whatsapp_messages pattern)
create table if not exists email_messages (
  id              uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  template_key    text not null,
  status          text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  resend_id       text,
  booking_id      uuid references bookings(id) on delete set null,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

alter table email_messages enable row level security;

-- 2. Push subscriptions
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table push_subscriptions enable row level security;

create policy "users_manage_own_subscriptions" on push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists idx_push_subscriptions_user on push_subscriptions (user_id);
