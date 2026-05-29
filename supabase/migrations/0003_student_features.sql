-- =============================================================
-- Student self-service features
-- =============================================================

-- 1. Lesson requests table (student suggests preferred times)
create table if not exists lesson_requests (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  instructor_id uuid not null references profiles(id) on delete cascade,
  preferred_date date not null,
  preferred_time text not null,
  duration_minutes integer not null default 60,
  message       text,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table lesson_requests enable row level security;

drop policy if exists "student_manage_own_requests" on lesson_requests;
create policy "student_manage_own_requests" on lesson_requests
  for all to authenticated
  using (
    student_id in (select id from students where profile_id = auth.uid())
  )
  with check (
    student_id in (select id from students where profile_id = auth.uid())
  );

drop policy if exists "instructor_manage_requests" on lesson_requests;
create policy "instructor_manage_requests" on lesson_requests
  for all to authenticated
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid());

drop trigger if exists set_updated_at on lesson_requests;
create trigger set_updated_at before update on lesson_requests
  for each row execute function set_updated_at();

-- 2. Student feedback column on lesson_notes
alter table lesson_notes add column if not exists student_feedback text;

-- 3. Allow students to cancel their own upcoming bookings
drop policy if exists "student_cancel_own_booking" on bookings;
create policy "student_cancel_own_booking" on bookings
  for update to authenticated
  using (
    student_id in (select id from students where profile_id = auth.uid())
    and status = 'scheduled'
  )
  with check (
    status = 'cancelled'
    and student_id in (select id from students where profile_id = auth.uid())
  );

-- 4. Allow students to update their own lesson feedback
drop policy if exists "student_update_feedback" on lesson_notes;
create policy "student_update_feedback" on lesson_notes
  for update to authenticated
  using (
    booking_id in (
      select b.id from bookings b
      join students s on s.id = b.student_id
      where s.profile_id = auth.uid()
    )
  )
  with check (
    booking_id in (
      select b.id from bookings b
      join students s on s.id = b.student_id
      where s.profile_id = auth.uid()
    )
  );
