# Student Onboarding Flow

## Overview

Students sign up with an invite code from their instructor. The system links them to the instructor's account, creating a `students` record. After linking, the student sees their dashboard with instructor info, lessons, and progress.

## Happy Path

```
Instructor shares invite code (e.g. "ABC123")
    ↓
Student opens /signup, selects "Learner", enters invite code
    ↓
Client validates invite code against instructor_settings table (anon RLS policy)
    ↓
supabase.auth.signUp() — stores invite_code in user_metadata
    ↓
[Branch A: Email confirmation ON]
    → Show "Check your email" screen
    → Student clicks confirmation link
    → GET /auth/callback — exchanges code for session
    → linkStudentToInstructor() runs
    → Redirect to /student/dashboard

[Branch B: Email confirmation OFF (auto-confirm)]
    → Session returned immediately
    → linkStudentToInstructor() server action runs
    → router.push("/student/dashboard")
```

## Linking Logic

Three places attempt to link the student (defense in depth):

| Location                          | When it runs                                 | Client used                             |
| --------------------------------- | -------------------------------------------- | --------------------------------------- |
| `signup/page.tsx` → server action | Immediately after signup (Branch B only)     | Service role (bypasses RLS)             |
| `auth/callback/route.ts`          | After email confirmation click (Branch A)    | User's session (authenticated)          |
| `student/dashboard/page.tsx`      | On every dashboard load if no student record | Service role (via server action import) |

### Linking steps (in `linkStudentToInstructor`):

1. Look up `instructor_id` from `instructor_settings` where `invite_code` matches
2. Check if student already linked (`students` where `profile_id = user.id`)
3. Check if instructor pre-added student by email (`students` where `email = user.email` and `profile_id IS NULL`)
   - If yes → update `profile_id` on existing record
4. Otherwise → insert new `students` record

## Corner Cases & Known Issues

### 1. RLS blocks invite code lookup for authenticated users

**Status: FIXED** (`0006_authenticated_invite_code_read.sql`)

`instructor_settings` has these RLS policies:

- `anon_read_invite_code` — allows `anon` role to SELECT (used during signup form validation before auth)
- `instructor_full_access` — allows instructor to CRUD their own row
- `student_read_instructor_settings` — allows students to read their instructor's settings **only if already linked**

**Problem:** After email confirmation, `auth/callback/route.ts` calls `linkStudentToInstructor()` with the user's authenticated session. The invite code lookup on `instructor_settings` **fails** because:

- User is `authenticated`, not `anon` → `anon_read_invite_code` doesn't apply
- User has no `students` record yet → `student_read_instructor_settings` doesn't match
- User isn't the instructor → `instructor_full_access` doesn't match

**Result:** Linking silently fails. Student lands on dashboard showing "Not linked to an instructor."

**Fixed:** Added `authenticated_read_invite_code` policy on `instructor_settings` for SELECT where `invite_code IS NOT NULL`.

### 2. Dashboard fallback saves the day (sometimes)

The dashboard page imports `linkStudentToInstructor` from `@/app/(auth)/actions.ts` which uses **service role** client. This bypasses RLS and should work. But it only fires if:

- `studentRecord` is null (no existing link)
- `user.user_metadata?.invite_code` exists

If this fallback works, the student sees "Not linked" briefly on first load, then on refresh sees the full dashboard.

### 3. Email confirmation link expires

Supabase confirmation links expire (default: 24 hours). If student clicks an expired link:

- `exchangeCodeForSession` returns an error
- Callback redirects to `/login?error=auth_failed`
- Student sees login page with no useful error message

**Fixed:** Login page now shows "Your confirmation link has expired or is invalid. Please sign up again." when `error=auth_failed` query param is present.

### 4. Student signs up without invite code

Prevented at form level — invite code field is required when "Learner" is selected, and validated against `instructor_settings` before `signUp()`. If somehow bypassed:

- No `invite_code` in `user_metadata`
- No linking attempted
- Dashboard shows "Not linked to an instructor yet" with instructions

### 5. Invite code validated but instructor deleted before linking

Race condition: instructor account deleted between code validation and linking.

- `instructor_settings` row gone → lookup returns null → linking silently fails
- Dashboard shows "Not linked"

**Impact:** Extremely rare. No fix needed.

### 6. Student uses same email instructor pre-added

Instructor adds student via student management with email `foo@bar.com`. Student signs up with same email.

- Linking logic checks for pre-added record (email match, `profile_id IS NULL`)
- Updates existing record with `profile_id` → student inherits any data instructor already entered (name, phone, notes, status)

**Works correctly.** Student sees instructor's data immediately.

### 7. Multiple instructors with same student email

Not prevented by schema. If two instructors pre-add the same email:

- `.single()` query on pre-added check may fail (multiple rows)
- Falls through to insert → creates new record for the instructor whose invite code was used
- Student only linked to one instructor

**Current behavior is acceptable** for V1 (one instructor per student).

### 8. Student tries to sign up with wrong role then correct role

If student first signs up as "instructor" by mistake:

- They complete instructor onboarding (or get stuck there)
- They can't switch to student role without a new account
- `role` is in `user_metadata` and `profiles.role` — both set at signup

**No role switching exists.** Would need to delete account and re-register.

### 9. Supabase "User already registered" edge case

If student starts signup, gets "check your email", never confirms, then tries to sign up again:

- Supabase returns "User already registered"
- Student sees "An account with this email already exists. Try logging in."
- But they can't log in (unconfirmed email)

**Fixed:** Signup page now shows "An account with this email already exists. If you haven't confirmed your email yet, check your inbox for the confirmation link."

### 10. Invite code case sensitivity

Handled: code is `.trim().toUpperCase()` at every touchpoint (signup form, linking functions, callback).

### 11. Auth callback runs on every email-link login, not just signup

The callback route handles all Supabase auth code exchanges (signup confirmation, magic links, password reset). The student linking logic only runs when `role === "student"` and `invite_code` exists in metadata, so it's safe — won't interfere with other flows.

## Fixes Applied

1. **Added authenticated RLS policy for invite code lookup** — `0006_authenticated_invite_code_read.sql`
2. **Login page shows expired link error** — when `?error=auth_failed` param present
3. **Signup page handles "already registered but unconfirmed"** — improved error message

## File Map

| File                                             | Role                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| `src/app/(auth)/signup/page.tsx`                 | Signup form, invite code validation, email confirmation screen    |
| `src/app/(auth)/actions.ts`                      | `linkStudentToInstructor` server action (service role)            |
| `src/app/auth/callback/route.ts`                 | Email confirmation handler, student linking, welcome notification |
| `src/app/(student)/student/dashboard/page.tsx`   | Dashboard with fallback linking                                   |
| `src/lib/supabase/middleware.ts`                 | Auth gate, role routing                                           |
| `supabase/migrations/0001_initial_schema.sql`    | Schema, profiles trigger, base RLS                                |
| `supabase/migrations/0002_student_self_link.sql` | Student self-link and self-insert RLS                             |
