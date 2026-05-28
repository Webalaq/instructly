-- =============================================================
-- Seed data for local development
-- =============================================================
-- Run AFTER migration. Assumes Supabase auth has test users.
--
-- Test users must be created via Supabase Dashboard or CLI first:
--   Instructor: instructor@test.com / password123
--   Student:    student@test.com / password123
--
-- Then paste their UUIDs below.
-- =============================================================

-- Replace these with actual auth.users UUIDs after creating test users
-- in the Supabase Dashboard (Authentication > Users > Add User)
do $$
declare
  v_instructor_id uuid;
  v_student_profile_id uuid;
  v_student_id uuid;
  v_booking_id uuid;
begin
  -- Get the first instructor user (or skip if none exist)
  select id into v_instructor_id
  from auth.users
  where raw_user_meta_data ->> 'role' = 'instructor'
  limit 1;

  if v_instructor_id is null then
    raise notice 'No instructor user found. Create test users first, then re-run seed.';
    return;
  end if;

  -- Get the first student user
  select id into v_student_profile_id
  from auth.users
  where raw_user_meta_data ->> 'role' = 'student'
  limit 1;

  -- Instructor settings
  insert into instructor_settings (instructor_id, hourly_rate_pence, default_lesson_minutes, working_hours, postcodes, business_name, invite_code)
  values (
    v_instructor_id,
    4000, -- £40/hr
    60,
    '{
      "mon": [{"start": "09:00", "end": "17:00"}],
      "tue": [{"start": "09:00", "end": "17:00"}],
      "wed": [{"start": "09:00", "end": "17:00"}],
      "thu": [{"start": "09:00", "end": "17:00"}],
      "fri": [{"start": "09:00", "end": "16:00"}],
      "sat": [{"start": "10:00", "end": "14:00"}],
      "sun": []
    }'::jsonb,
    array['SW1A', 'SW1V', 'SW1W'],
    'Sarah''s Driving School',
    'ABC123'
  )
  on conflict (instructor_id) do nothing;

  -- Sample availability slots (recurring)
  insert into availability_slots (instructor_id, type, day_of_week, start_time, end_time) values
    (v_instructor_id, 'recurring', 1, '09:00', '17:00'),  -- Mon
    (v_instructor_id, 'recurring', 2, '09:00', '17:00'),  -- Tue
    (v_instructor_id, 'recurring', 3, '09:00', '17:00'),  -- Wed
    (v_instructor_id, 'recurring', 4, '09:00', '17:00'),  -- Thu
    (v_instructor_id, 'recurring', 5, '09:00', '16:00'),  -- Fri
    (v_instructor_id, 'recurring', 6, '10:00', '14:00');   -- Sat

  -- Test student
  insert into students (id, instructor_id, profile_id, full_name, email, phone, status)
  values (
    gen_random_uuid(),
    v_instructor_id,
    v_student_profile_id,  -- null if no student user exists yet
    'Aisha Khan',
    'student@test.com',
    '+447700900001',
    'active'
  )
  returning id into v_student_id;

  -- Sample booking (tomorrow at 10am, 1 hour)
  insert into bookings (id, instructor_id, student_id, start_at, end_at, status, pickup_location, price_pence)
  values (
    gen_random_uuid(),
    v_instructor_id,
    v_student_id,
    (current_date + interval '1 day' + interval '10 hours')::timestamptz,
    (current_date + interval '1 day' + interval '11 hours')::timestamptz,
    'scheduled',
    '42 High Street, London SW1A 1AA',
    4000
  )
  returning id into v_booking_id;

  -- Sample subscription (trialing)
  insert into subscriptions (instructor_id, plan, status, trial_ends_at)
  values (
    v_instructor_id,
    'standard',
    'trialing',
    now() + interval '14 days'
  )
  on conflict (instructor_id) do nothing;

  raise notice 'Seed complete. Instructor: %, Student: %', v_instructor_id, v_student_id;
end;
$$;
