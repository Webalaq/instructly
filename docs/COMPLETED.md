# Instructly — Completed Features (MVP)

> What's built and shipped. Updated 2026-06-01.

## 1. Authentication

- [x] Instructor signup with email verification
- [x] Student signup via invite code or shareable link
- [x] Role-based routing (instructor → `/instructor/*`, student → `/student/*`)
- [x] Password reset via email (Supabase built-in)
- [x] Auth middleware protecting all routes
- [x] OAuth callback with student-instructor auto-linking

## 2. Instructor Onboarding

- [x] 3-step wizard: pricing, working hours, teaching area (postcodes)
- [x] Generates unique invite code per instructor
- [x] Editable from `/instructor/profile`
- [x] Shareable invite link with Web Share API (native mobile share sheet)

## 3. Student Management

- [x] Add/edit students via dialog form
- [x] List with status filter tabs (all, active, inactive, passed, test-booked)
- [x] Search by name
- [x] Soft limits per plan (20 Basic, unlimited Standard/Premium)
- [x] Soft-delete (status → inactive, row preserved)
- [x] Auto-link student to instructor on signup (3-location defense-in-depth)

## 4. Calendar + Bookings

- [x] Week calendar view with time grid
- [x] Click to create booking (30-min increments)
- [x] Edit/cancel booking with status tracking
- [x] No overlapping bookings (DB exclusion constraint + app-level check)
- [x] Recurring availability per weekday (instructor settings)
- [x] Block out dates for holidays / time off
- [x] `computeAvailableSlots()` conflict prevention

## 5. Lesson Notes + Progress

- [x] After-lesson note form (mobile-optimized dialog)
- [x] 12 DVSA skill ratings on 1-5 scale
- [x] Summary, homework, private instructor notes fields
- [x] Private notes protected via column-level GRANT/REVOKE (migration 0007)
- [x] Student progress page: timeline chart, skill averages, category filter
- [x] Student lesson history with notes (read-only)
- [x] Export/print progress reports

## 6. WhatsApp Auto-Reminders

- [x] Twilio WhatsApp integration (`/api/whatsapp/send`)
- [x] Cron job sends 24h-before reminders (`/api/cron/reminders`)
- [x] Booking confirmation + cancellation messages
- [x] Plan-gated: Premium only for WhatsApp
- [x] Message audit log (`whatsapp_messages` table)
- [x] Fallback: email + push notifications for all plans

## 7. Stripe Subscriptions

- [x] Three tiers: Basic £19, Standard £29, Premium £49 (stored in pence)
- [x] 14-day free trial
- [x] Stripe Checkout (`/api/stripe/checkout`)
- [x] Customer portal (`/api/stripe/portal`)
- [x] Webhook handles lifecycle events (`/api/stripe/webhook`)
- [x] Feature-gating via `plan-limits.ts`

## 8. Notifications

- [x] Email notifications via Resend (booking confirmations, reminders)
- [x] Web Push notifications (VAPID, service worker)
- [x] Push subscription management UI (PushSubscriptionBanner)
- [x] SSR-safe hydration via `useSyncExternalStore`

## 9. Landing Page + Auth

- [x] Marketing landing page with features, testimonials, pricing
- [x] Login page with error handling (expired links)
- [x] Signup page with role selection
- [x] Invite-aware signup (auto-selects student role, hides fields)
- [x] Email confirmation flow with "check your email" screen

## 10. PWA + Mobile

- [x] Web app manifest with icons (192px, 512px)
- [x] Service worker via Serwist
- [x] Install App button on profile pages (Android native prompt, iOS instructions)
- [x] Standalone display mode detection
- [x] Mobile-first responsive layouts

## 11. Security + RLS

- [x] RLS policies on every table
- [x] Column-level privilege for `instructor_private_notes`
- [x] Service role client for privileged operations (reschedule, notes)
- [x] Invite code readable by both anon + authenticated roles (migrations 0006, 0007)
- [x] Zod validation on all user input
- [x] Auth middleware excludes public assets (manifest, sw.js)

## 12. Student Features

- [x] Dashboard with next lesson card
- [x] Bookings view (upcoming + past)
- [x] Progress view with skill charts
- [x] Lesson request + reschedule flow
- [x] Profile page with account info
