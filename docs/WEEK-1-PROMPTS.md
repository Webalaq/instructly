# Week 1 — Claude Code Prompts

> Copy-paste these in order. One per session. Use `/clear` between sessions.

---

## Session 1: Project scaffold

```
Read CLAUDE.md, docs/PRD.md, docs/DATABASE.md, and docs/DECISIONS.md.

Then scaffold the project:

1. Initialize Next.js 15 with TypeScript, App Router, Tailwind, ESLint.
   Use pnpm. App lives at the repo root (not in a subfolder).
2. Install and initialize shadcn/ui with the "new-york" style, neutral base color.
3. Install: @supabase/supabase-js, @supabase/ssr, zod, react-hook-form,
   @hookform/resolvers, date-fns, date-fns-tz.
4. Set up the folder structure exactly as described in CLAUDE.md.
5. Create .env.example with all required env vars (Supabase URL/keys,
   Stripe keys, Twilio creds, Resend key) but with placeholder values.
6. Create a basic /app/page.tsx with a placeholder landing page header.

Stop after step 6. Show me what you created and confirm the dev server runs
before moving on.
```

---

## Session 2: Supabase schema

```
Read docs/DATABASE.md.

Create the initial database migration at supabase/migrations/0001_initial_schema.sql.

It must include:
- All 9 tables from DATABASE.md with exact columns, types, and constraints
- The trigger that creates a profiles row when auth.users gets a new entry
- All indexes listed in DATABASE.md
- RLS enabled on every table
- RLS policies for instructor full access and student read-own access
- The exclusion constraint on bookings to prevent overlap

After writing the migration, also create:
- supabase/seed.sql with one test instructor, one test student, sample availability
- A README in supabase/ explaining how to run migrations locally

Do NOT run the migration yet. I will review it first.
```

---

## Session 3: Auth + role-aware routing

```
Build authentication.

1. Create the Supabase server client and browser client helpers in src/lib/supabase/.
   Use @supabase/ssr correctly — cookies via next/headers.
2. Create middleware.ts that refreshes the session and gates routes:
   - /instructor/* requires role = 'instructor'
   - /student/* requires role = 'student'
   - /admin/* requires role = 'admin'
   - Unauthed users hit /login
3. Build /login page with email + password (shadcn Form + react-hook-form + zod).
4. Build /signup page with role selector (instructor or student).
   Students need an invite code; validate against instructor_settings.invite_code.
5. Build /logout server action.

Add Vitest tests for the role-routing middleware logic.
Run pnpm typecheck and pnpm lint. Fix any errors.
```

---

## Session 4: Instructor onboarding

```
Build instructor onboarding at /instructor/onboarding.

After first login, instructors land here if their instructor_settings row is incomplete.

A 3-step wizard:
Step 1: Business basics (business_name optional, hourly_rate_pence required).
Step 2: Working hours (Mon-Sun grid, each day on/off + start/end time).
        Store as jsonb matching the format in DATABASE.md.
Step 3: Service area (multi-postcode input, comma-separated, validate UK format).

On completion, generate a unique invite_code (6 chars, uppercase alphanumeric)
and redirect to /instructor/dashboard.

Use server actions for the form submissions. Validate everything with zod.
```

---

## Session 5: Student management (CRM lite)

```
Build student management.

Pages:
- /instructor/students — list view with status filter, search by name
- /instructor/students/new — add student form
- /instructor/students/[id] — student detail + edit + status changes

Server actions for create/update/delete.

When a student is created, the instructor only provides their details
(no auth account yet). The student gets an SMS invite via Twilio with
a magic-link signup URL containing the invite_code.

For now, stub the SMS sending — log to console. We'll wire Twilio in week 8.

Mobile-first layout. Instructors will use this on their phone.
```

---

## Tips for using these prompts

- Run `pnpm typecheck && pnpm lint && pnpm test` after each session before committing.
- Commit at the end of each session with a `feat:` message.
- If Claude Code asks clarifying questions, answer them — don't tell it to "just decide."
- If it produces something you don't like, push back: "Redo step 3 — I want X not Y."
- If you hit rate limits, switch to Claude.ai web for planning/design and come back to Code for execution.
