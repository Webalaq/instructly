-- Allow students to link themselves to an existing student record (by email match)
-- and to create a new student record when signing up with an invite code.

-- Policy: student can update their own profile_id on a record that matches their email
drop policy if exists "student_link_self_by_email" on students;
create policy "student_link_self_by_email" on students
  for update to authenticated
  using (
    email = (select email from auth.users where id = auth.uid())
    and profile_id is null
  )
  with check (
    profile_id = auth.uid()
  );

-- Policy: student can insert a record for themselves (linked to an instructor)
drop policy if exists "student_insert_self" on students;
create policy "student_insert_self" on students
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and (select role from profiles where id = auth.uid()) = 'student'
  );
