# Instructly — Roadmap

> What's next after MVP. Updated 2026-06-01.

## V1.1 — Post-Launch Polish (Week 1-2 after launch)

Priority fixes and improvements based on early user feedback.

- [ ] Custom email templates (Resend) — branded booking confirmations, lesson summaries
- [ ] Error monitoring (Sentry) — catch errors before users report them
- [ ] Analytics (PostHog or Plausible) — track signups, conversion, feature usage
- [ ] Proper 404/500 error pages
- [ ] Rate limiting on API routes (prevent abuse)
- [ ] Loading skeletons on all async pages
- [ ] Onboarding tour for new instructors (highlight key features)

## V1.2 — Compliance + Trust (Week 2-4)

Required for UK SaaS taking payments and handling personal data.

- [ ] Terms of Service page
- [ ] Privacy Policy page (GDPR-compliant)
- [ ] Cookie consent banner
- [ ] GDPR data export (user requests their data)
- [ ] GDPR data deletion (user requests account removal)
- [ ] Data processing agreement for Supabase/Stripe/Twilio

## V2.0 — Growth Features

Features that unlock next tier of value and retention.

### Messaging + Communication
- [ ] In-app messaging between instructor and student
- [ ] Bulk message to all students (announcement)
- [ ] SMS reminders (fallback when WhatsApp unavailable)

### Analytics Dashboard
- [ ] Instructor dashboard: revenue, lesson count, cancellation rate
- [ ] Student retention metrics
- [ ] Popular time slots heatmap
- [ ] Monthly revenue reports

### Calendar Enhancements
- [ ] Drag-to-reschedule on calendar
- [ ] Day view
- [ ] Google Calendar sync (2-way)
- [ ] Recurring bookings (same student, same time weekly)

### Student Experience
- [ ] Mock test module (practice questions)
- [ ] Theory test tracking
- [ ] Resource library (instructor uploads PDFs/videos)
- [ ] Student self-booking from available slots
- [ ] Lesson payment tracking (instructor marks as paid)

### Business Features
- [ ] Multi-instructor school mode (driving school manages multiple ADIs)
- [ ] Instructor referral program
- [ ] Annual billing discount
- [ ] White-label option for driving schools

## V3.0 — Platform

Long-term vision features.

- [ ] Marketplace: students find local instructors
- [ ] Route planning with Maps integration
- [ ] AI lesson plan suggestions based on progress
- [ ] Pass Plus course management
- [ ] Integration with DVSA test booking system
- [ ] Native mobile apps (iOS + Android)

## Out of Scope (No Plans)

- Payments from students to instructors (we handle SaaS sub only)
- Video calling / virtual lessons
- Fleet management
- Insurance integration
