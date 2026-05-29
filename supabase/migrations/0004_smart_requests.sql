-- =============================================================
-- Smart lesson requests + reschedule support
-- =============================================================

-- Add columns to lesson_requests for reschedule support
alter table lesson_requests add column if not exists type text not null default 'new'
  check (type in ('new', 'reschedule'));

alter table lesson_requests add column if not exists booking_id uuid references bookings(id) on delete set null;

-- Store computed start/end timestamps (resolved from date+time+duration)
alter table lesson_requests add column if not exists proposed_start_at timestamptz;
alter table lesson_requests add column if not exists proposed_end_at timestamptz;

-- Who initiated: 'student' or 'instructor'
alter table lesson_requests add column if not exists initiated_by text not null default 'student'
  check (initiated_by in ('student', 'instructor'));
