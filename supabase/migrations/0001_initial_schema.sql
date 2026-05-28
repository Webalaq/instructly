-- =============================================================
-- Instructly — Initial Schema Migration
-- =============================================================
-- All 9 tables, RLS policies, indexes, triggers, constraints.
-- Follows docs/DATABASE.md exactly.
-- =============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";  -- needed for exclusion constraint on bookings

-- =============================================================
-- 1. profiles
-- =============================================================
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('instructor', 'student', 'admin')),
  full_name  text not null,
  phone      text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: users can read own profile, instructors can read student profiles
create policy "users_read_own_profile" on profiles
  for select to authenticated
  using (id = auth.uid());

create policy "instructors_read_student_profiles" on profiles
  for select to authenticated
  using (
    role = 'student'
    and id in (
      select profile_id from students where instructor_id = auth.uid()
    )
  );

create policy "users_update_own_profile" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- =============================================================
-- 2. instructor_settings
-- =============================================================
create table instructor_settings (
  instructor_id          uuid primary key references profiles(id) on delete cascade,
  hourly_rate_pence      integer,
  default_lesson_minutes integer default 60 check (default_lesson_minutes in (60, 90, 120)),
  working_hours          jsonb default '{}'::jsonb,
  postcodes              text[] default '{}',
  business_name          text,
  invite_code            text unique,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table instructor_settings enable row level security;

create policy "instructor_full_access" on instructor_settings
  for all to authenticated
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid());

-- Students can read their instructor's settings (for invite code validation)
create policy "student_read_instructor_settings" on instructor_settings
  for select to authenticated
  using (
    instructor_id in (
      select instructor_id from students where profile_id = auth.uid()
    )
  );

-- Anon users can validate invite codes during signup
create policy "anon_read_invite_code" on instructor_settings
  for select to anon
  using (true);

-- =============================================================
-- 3. students
-- =============================================================
create table students (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles(id) on delete cascade,
  profile_id    uuid references profiles(id) on delete set null,
  full_name     text not null,
  email         text,
  phone         text,
  status        text not null default 'active' check (status in ('active', 'inactive', 'passed', 'test_booked')),
  theory_passed boolean not null default false,
  test_date     date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table students enable row level security;

create policy "instructor_full_access" on students
  for all to authenticated
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid());

create policy "student_read_own" on students
  for select to authenticated
  using (profile_id = auth.uid());

-- =============================================================
-- 4. availability_slots
-- =============================================================
create table availability_slots (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles(id) on delete cascade,
  type          text not null check (type in ('recurring', 'one_off', 'blocked')),
  day_of_week   smallint check (day_of_week between 0 and 6),
  start_time    time,
  end_time      time,
  date          date,
  start_at      timestamptz,
  end_at        timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table availability_slots enable row level security;

create policy "instructor_full_access" on availability_slots
  for all to authenticated
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid());

create policy "student_read_instructor_availability" on availability_slots
  for select to authenticated
  using (
    instructor_id in (
      select instructor_id from students where profile_id = auth.uid()
    )
  );

-- =============================================================
-- 5. bookings
-- =============================================================
create table bookings (
  id                  uuid primary key default gen_random_uuid(),
  instructor_id       uuid not null references profiles(id) on delete cascade,
  student_id          uuid not null references students(id) on delete cascade,
  start_at            timestamptz not null,
  end_at              timestamptz not null,
  status              text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  pickup_location     text,
  price_pence         integer not null,
  paid                boolean not null default false,
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Prevent overlapping bookings for the same instructor
  -- Uses btree_gist extension for tstzrange exclusion
  constraint no_overlapping_bookings
    exclude using gist (
      instructor_id with =,
      tstzrange(start_at, end_at) with &&
    )
    where (status not in ('cancelled'))
);

alter table bookings enable row level security;

create policy "instructor_full_access" on bookings
  for all to authenticated
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid());

create policy "student_read_own" on bookings
  for select to authenticated
  using (
    student_id in (
      select id from students where profile_id = auth.uid()
    )
  );

-- =============================================================
-- 6. lesson_notes
-- =============================================================
create table lesson_notes (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null unique references bookings(id) on delete cascade,
  summary                  text not null,
  homework                 text,
  instructor_private_notes text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table lesson_notes enable row level security;

-- Instructor access via booking ownership
create policy "instructor_full_access" on lesson_notes
  for all to authenticated
  using (
    booking_id in (
      select id from bookings where instructor_id = auth.uid()
    )
  )
  with check (
    booking_id in (
      select id from bookings where instructor_id = auth.uid()
    )
  );

-- Students can read notes for their own bookings (except private notes — handled in app layer)
create policy "student_read_own" on lesson_notes
  for select to authenticated
  using (
    booking_id in (
      select b.id from bookings b
      join students s on s.id = b.student_id
      where s.profile_id = auth.uid()
    )
  );

-- =============================================================
-- 7. skill_ratings
-- =============================================================
create table skill_ratings (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  skill_key  text not null check (skill_key in (
    'vehicle_control.steering',
    'vehicle_control.clutch',
    'vehicle_control.gears',
    'road_awareness.junctions',
    'road_awareness.roundabouts',
    'road_awareness.lanes',
    'manoeuvres.parallel_park',
    'manoeuvres.bay_park',
    'manoeuvres.emergency_stop',
    'safety.mirrors',
    'safety.speed',
    'safety.hazard_response'
  )),
  rating     smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table skill_ratings enable row level security;

create policy "instructor_full_access" on skill_ratings
  for all to authenticated
  using (
    booking_id in (
      select id from bookings where instructor_id = auth.uid()
    )
  )
  with check (
    booking_id in (
      select id from bookings where instructor_id = auth.uid()
    )
  );

create policy "student_read_own" on skill_ratings
  for select to authenticated
  using (
    student_id in (
      select id from students where profile_id = auth.uid()
    )
  );

-- =============================================================
-- 8. subscriptions
-- =============================================================
create table subscriptions (
  instructor_id          uuid primary key references profiles(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  plan                   text not null default 'basic' check (plan in ('basic', 'standard', 'premium')),
  status                 text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  current_period_end     timestamptz,
  trial_ends_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "instructor_read_own" on subscriptions
  for select to authenticated
  using (instructor_id = auth.uid());

-- Updates come from Stripe webhooks via service role, not from client.
-- No INSERT/UPDATE/DELETE policies for authenticated — only service role writes.

-- =============================================================
-- 9. whatsapp_messages
-- =============================================================
create table whatsapp_messages (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid references bookings(id) on delete set null,
  recipient_phone text not null,
  template_key    text not null,
  status          text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed')),
  twilio_sid      text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table whatsapp_messages enable row level security;

create policy "instructor_read_own" on whatsapp_messages
  for select to authenticated
  using (
    booking_id in (
      select id from bookings where instructor_id = auth.uid()
    )
  );

-- Writes come from server-side Twilio integration via service role.

-- =============================================================
-- Indexes
-- =============================================================
create index idx_bookings_instructor_start on bookings (instructor_id, start_at);
create index idx_bookings_student_start on bookings (student_id, start_at);
create index idx_students_instructor_status on students (instructor_id, status);
create index idx_skill_ratings_student_skill on skill_ratings (student_id, skill_key);
create index idx_whatsapp_messages_booking on whatsapp_messages (booking_id);

-- =============================================================
-- updated_at trigger (reusable)
-- =============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on instructor_settings
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on students
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on availability_slots
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on bookings
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on lesson_notes
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on skill_ratings
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on subscriptions
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on whatsapp_messages
  for each row execute function public.set_updated_at();
