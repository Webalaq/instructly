-- Allow authenticated users (not yet linked students) to look up invite codes
-- during the onboarding linking flow. Without this, the auth callback's
-- linkStudentToInstructor() silently fails because the user is authenticated
-- (not anon) but has no students record yet.

drop policy if exists "authenticated_read_invite_code" on instructor_settings;
create policy "authenticated_read_invite_code" on instructor_settings
  for select to authenticated
  using (invite_code is not null);
