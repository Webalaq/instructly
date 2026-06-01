-- Protect instructor_private_notes from student access via column-level privileges.
--
-- Revoke SELECT on the private column from authenticated role,
-- then grant it only to service_role (instructor server actions use service role
-- for lesson note reads that need private notes).

-- Revoke all SELECT and re-grant only safe columns to authenticated
revoke select on lesson_notes from authenticated;

grant select (
  id,
  booking_id,
  summary,
  homework,
  student_feedback,
  created_at,
  updated_at
) on lesson_notes to authenticated;

-- Service role gets full access (used by instructor server actions)
grant select on lesson_notes to service_role;

-- Ensure INSERT/UPDATE still work for both roles
grant insert, update on lesson_notes to authenticated;
grant insert, update on lesson_notes to service_role;
