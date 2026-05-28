# Instructly — Claude Code Instructions

> This file is loaded automatically by Claude Code every session.
> Keep it tight. Update when conventions change.

## Product

Instructly is a SaaS platform for UK driving instructors (ADIs — Approved Driving Instructors).
Instructors pay £19–£49/month to manage students, bookings, lesson notes, progress tracking,
and automated WhatsApp reminders.

Students use the platform for free (invited by their instructor).

## MVP Scope (V1)

ONLY these features. Do not build anything else without asking.

1. Authentication (instructor + student roles, Supabase Auth)
2. Instructor onboarding (pricing, working hours, teaching area)
3. Student management (add/edit/list, status: active/inactive/passed/test-booked)
4. Calendar + bookings (instructor creates bookings, recurring availability, conflict prevention)
5. Lesson notes (after-lesson form, DVSA skill ratings 1–5)
6. Student progress view (read-only for students)
7. WhatsApp auto-reminders via Twilio (24h before lesson, cancellations)
8. Stripe subscription (£19 Basic, £29 Standard, £49 Premium)
9. Landing page + auth pages

Out of scope until V2: messaging/chat, mock tests, resource library,
driving school multi-instructor mode, analytics dashboard, route planning,
mobile native apps. We ship a PWA first.

## Stack

- **Framework**: Next.js 15 (App Router) with TypeScript strict mode
- **UI**: Tailwind CSS + shadcn/ui components only. No custom CSS unless asked.
- **Database + Auth + Storage**: Supabase (Postgres with RLS enabled on every table)
- **Payments**: Stripe Subscriptions (UK), webhook-driven
- **Messaging**: Twilio WhatsApp Business API
- **Email**: Resend
- **Forms**: react-hook-form + zod validation
- **Dates**: date-fns + date-fns-tz (Europe/London timezone everywhere user-facing)
- **State**: React Server Components by default. TanStack Query only for client-side fetches.
- **Testing**: Vitest (unit), Playwright (critical flows only: signup, booking, payment)
- **Hosting**: Vercel
- **Package manager**: pnpm

## Architecture Rules

- Server Components by default. Add `"use client"` only when needed (forms, interactivity).
- Database access ONLY through the Supabase client. Never write raw SQL in app code.
  Schema changes go in `supabase/migrations/` as numbered SQL files.
- API routes live in `src/app/api/`. Keep them thin — push logic into `src/lib/`.
- All money values stored as integers in pence. Never use floats for currency.
- All dates stored as `timestamptz` in UTC. Format to Europe/London on display.
- All user input validated with zod schemas defined in `src/lib/schemas/`.
- RLS policies are mandatory on every table. Test them.

## File Conventions

- Components: `PascalCase.tsx`
- Utilities, hooks, schemas: `kebab-case.ts`
- One component per file. Co-locate small helpers.
- Server actions live next to the page that uses them, named `actions.ts`.

## Code Style

- No `any`. Use `unknown` and narrow, or define proper types.
- Prefer early returns over nested conditionals.
- Don't write comments unless logic is non-obvious. Code should explain itself.
- Don't add new dependencies without asking me first.
- Don't create new files when editing existing ones works.
- Match the existing code style in the file you're editing.

## Workflow Rules for You (Claude Code)

- Before writing code, restate what you're about to do in 1–2 sentences.
- Stop and ask if requirements are unclear. Don't guess on business logic.
- After any change, run `pnpm typecheck` and `pnpm lint`. Fix errors before declaring done.
- For database changes, write the migration AND update `docs/DATABASE.md`.
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`).
- Never commit `.env*` files or anything in `.gitignore`.
- If a task is taking more than ~5 file edits, pause and summarize progress.

## Domain Glossary

- **ADI**: Approved Driving Instructor (the paying customer)
- **PDI**: Potential Driving Instructor (trainee, may be a future segment)
- **DVSA**: Driver and Vehicle Standards Agency (UK government body)
- **Pupil / Learner / Student**: used interchangeably; the end user being taught
- **Mock test**: Practice driving test administered by the instructor
- **Manoeuvre**: A specific driving skill (parallel park, bay park, emergency stop)
- **Theory test**: Written test, separate from practical driving test
- **Pass Plus**: Post-test advanced training course

## References

- Full PRD: `docs/PRD.md`
- Database schema: `docs/DATABASE.md`
- Architecture decisions: `docs/DECISIONS.md`
