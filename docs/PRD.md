# Instructly — Product Requirements (MVP)

> The full vision lives in the original product doc.
> This file is what we ship in V1. Anything not here is V2+.

## One-line pitch

A booking, notes, and WhatsApp-reminder system for UK driving instructors that pays for itself by reducing no-shows.

## Target customer

UK Approved Driving Instructors (ADIs), independent, 20-100 active students, currently juggling Google Calendar + WhatsApp + paper notes.

## Core jobs to be done

1. **"Stop losing money to no-shows"** → WhatsApp reminders 24h before lesson
2. **"Stop the back-and-forth scheduling chaos"** → Single source of truth calendar
3. **"Remember what we covered last week"** → Lesson notes + progress tracking that travels with the student

## Pricing

- **Basic** — £19/month. 20 students max, calendar + notes.
- **Standard** — £29/month. Unlimited students, full progress tracking.
- **Premium** — £49/month. WhatsApp automation, priority support.

14-day free trial, no card required.

## Personas

### Sarah, the independent ADI

- 38, runs her own driving school for 6 years
- 45 active students, charges £40/hr
- Uses Google Calendar + a notebook + WhatsApp
- Pain: spends 45 mins/day rescheduling, has 2-3 no-shows per week
- Wins if: she gets 30 mins of her evening back and recovers £80/week in no-show revenue

### James, the new ADI

- 28, qualified 6 months ago
- 12 students, growing
- Tech-comfortable, uses a paper diary because nothing else "feels right"
- Pain: forgets what each student was working on
- Wins if: he looks professional to students and grows confidently

### Aisha, the learner

- 19, 8 lessons in
- Wants to know what to revise, when her next lesson is, how she's progressing
- Pain: instructor texts are scattered, no clear picture of progress
- Wins if: she has a clean app showing progress and upcoming lessons

## V1 User Flows

### Instructor signup → first booking

1. Land on / → sign up as instructor → email verification
2. Onboarding wizard: rate, working hours, postcodes
3. Add first student (name, email, phone)
4. Student receives SMS invite, signs up via magic link
5. Instructor creates a booking from calendar
6. Booking confirmation sent (in-app for student, push for instructor)

### Lesson day flow

1. 24h before: student gets WhatsApp reminder
2. 1h before: instructor sees lesson on dashboard
3. After lesson: instructor opens booking → "Add notes"
4. Notes screen on mobile: skill ratings (1-5 on each), free-text summary, homework
5. Student can view notes + updated progress chart

### Subscription flow

1. Trial expires → modal blocks creating new bookings
2. Click "Subscribe" → Stripe Checkout
3. On return: subscription active, full access restored
4. Webhook updates database state

## V1 Acceptance Criteria

**Authentication**

- [ ] Instructor signup with email verification
- [ ] Student signup via invite code/link only
- [ ] Role-based routing (instructor/student/admin)
- [ ] Password reset via email

**Instructor onboarding**

- [ ] 3-step wizard captures rate, hours, area
- [ ] Generates unique invite code
- [ ] Can edit settings later from /instructor/settings

**Student management**

- [ ] Add/edit/list students with status filter
- [ ] Send invite SMS (stubbed in week 5, live by week 8)
- [ ] Soft-delete (set status to inactive, don't drop the row)

**Calendar + bookings**

- [ ] Week view + day view
- [ ] Drag/click to create booking
- [ ] Edit/cancel booking with reason
- [ ] No overlapping bookings allowed
- [ ] Recurring availability per weekday
- [ ] Block out holidays / one-off unavailable slots

**Lesson notes + progress**

- [ ] After-lesson note form (mobile-optimized)
- [ ] 12 skill ratings on a 1-5 scale (DVSA categories from DATABASE.md)
- [ ] Student progress page: chart of average ratings over time
- [ ] Student lesson history with notes

**WhatsApp**

- [ ] Twilio account + WhatsApp templates approved
- [ ] Auto-send 24h reminder
- [ ] Manual "send reminder" button
- [ ] Auto-send on booking cancellation
- [ ] Message audit log

**Subscriptions**

- [ ] Stripe Checkout for upgrades
- [ ] Free 14-day trial on signup
- [ ] Trial expiry blocks new bookings (read-only otherwise)
- [ ] Customer portal for managing payment method
- [ ] Webhook handles subscription lifecycle events

**Polish**

- [ ] PWA manifest, installable on iOS + Android
- [ ] Mobile-first layouts throughout
- [ ] Loading states on every async action
- [ ] Toast notifications for success/error
- [ ] Landing page with pricing, FAQ, signup CTA

## Out of Scope for V1

- Real-time chat/messaging (WhatsApp covers it)
- Mock test module
- Video/PDF resource library
- Multi-instructor school mode
- Analytics dashboard beyond a basic count widget
- Route planning / Maps integration
- Theory test practice
- Marketplace features
- Payments to instructor (we handle the SaaS sub only, not lesson payments)
