# Instructly - Design Specification

**Product:** Instructly - Driving Instructor Operating System
**Type:** Flutter Mobile App (iOS + Android) + Firebase Backend
**Date:** 2026-04-18
**Status:** Approved

---

## 1. Product Overview

Instructly is a mobile app for independent driving instructors to manage their students, bookings, progress tracking, communication, and business operations from a single tool — replacing the current patchwork of calendars, WhatsApp, handwritten notes, and spreadsheets.

**Target Users:**
- **Primary:** Independent driving instructors (UK)
- **Secondary:** Driving schools (Phase 3)
- **End users:** Students (free, no payments through the app)

**Core Value:** Replace multiple tools with one unified system purpose-built for driving instruction.

---

## 2. Architecture

### Stack
- **Frontend:** Flutter (single codebase for iOS + Android)
- **Backend:** Firebase (serverless-first)
  - Firebase Auth (authentication)
  - Cloud Firestore (database)
  - Cloud Functions (business logic, webhooks, scheduled tasks)
  - Firebase Cloud Messaging (push notifications)
  - Firebase Storage (file uploads)
  - Firebase Remote Config (feature flags, trial configuration)
- **Payments:** Stripe via "Run Payments with Stripe" Firebase Extension
- **Admin:** Firebase Console + Flutter Web (lightweight, Phase 2+)

### Why Serverless-First
The data model is naturally document-oriented — each instructor is an independent unit with their own students, bookings, and progress records. Firestore handles this perfectly with real-time sync, offline support, and automatic scaling. No custom server to manage. Can serve thousands of instructors before hitting any limits. Migration to a hybrid model (Cloud Run for complex queries) is possible later if analytics demands grow.

### Flutter Architecture: Feature-First with Clean Layers

```
lib/
  app/
    app.dart                 # MaterialApp, routing, theme
    theme/
      app_theme.dart         # ThemeData, color schemes
      typography.dart        # Text styles
      motion.dart            # Animation curves, durations
    router/
      app_router.dart        # GoRouter configuration
  features/
    auth/
      data/                  # Firebase Auth repository
      domain/                # Auth models, interfaces
      presentation/          # Login, register screens + widgets
    students/
      data/
      domain/
      presentation/
    bookings/
    progress/
    lesson_logs/
    mock_tests/
    messages/
    resources/
    subscription/
    dashboard/
  shared/
    widgets/                 # Reusable UI components
    services/                # FCM, connectivity, etc.
    utils/                   # Date helpers, formatters
  main.dart
```

### State Management: Riverpod
- `StreamProvider` maps directly to Firestore real-time listeners
- Scoped providers per feature
- Mature, testable, excellent Firebase integration

### Routing: GoRouter
- Declarative routing with deep-link support
- Redirect guards for auth/subscription state

### Key Packages

| Purpose | Package |
|---|---|
| State | `flutter_riverpod` |
| Routing | `go_router` |
| Firebase | `firebase_auth`, `cloud_firestore`, `firebase_messaging`, `firebase_storage` |
| Payments | `flutter_stripe` |
| Calendar | `table_calendar` |
| Local storage | `shared_preferences` |
| Forms | `reactive_forms` |
| Date/time | `intl` |

---

## 3. Data Model (Firestore)

### Top-level: Users
```
/users/{userId}
  - role: "instructor" | "student"
  - email, displayName, phone, createdAt
  - (instructors) subscriptionTier, subscriptionStatus, stripeCustomerId
  - (students) linkedInstructorId
```

### Instructor Profile
```
/instructors/{instructorId}
  - profile: name, phone, email, photo
  - certification: licenseNumber, uploadUrl (optional)
  - settings: lessonDurations[], bufferMinutes, travelMinutes
  - teachingAreas: [text descriptions]
  - preferredTestCentres: [names]
  - weeklyAvailability: { mon: [{start, end}], tue: [...], ... }
```

### Students (subcollection under instructor)
```
/instructors/{instructorId}/students/{studentId}
  - name, phone, email
  - status: "active" | "inactive" | "passed"
  - joinedAt, inviteCode
  - notes (general)
```

### Bookings
```
/instructors/{instructorId}/bookings/{bookingId}
  - studentId, studentName (denormalized)
  - startTime, endTime, duration
  - pickupLocation (text)
  - status: "confirmed" | "cancelled" | "completed"
  - recurring: boolean, recurringGroupId?
  - cancellationReason?, lateCancellation: boolean
  - notes
```

### Progress Tracking
```
/instructors/{instructorId}/students/{studentId}/progress/{skillId}
  - skillName, category: "manoeuvres" | "road_skills" | "custom"
  - rating: 1-5
  - lastUpdated
  - instructorNotes
```

### Lesson Logs
```
/instructors/{instructorId}/students/{studentId}/lessonLogs/{logId}
  - bookingId
  - date, duration
  - skillsCovered: [skillIds]
  - notes, areasToImprove
```

### Mock Tests
```
/instructors/{instructorId}/students/{studentId}/mockTests/{testId}
  - date, result: "pass" | "fail"
  - minorFaults: number, majorFaults: number
  - faultDetails: [{skill, type, notes}]
  - sharedWithStudent: boolean
```

### Messages
```
/instructors/{instructorId}/messages/{messageId}
  - fromId, toId, fromRole
  - text, attachmentUrl?
  - createdAt, read: boolean
```

### Learning Resources
```
/instructors/{instructorId}/resources/{resourceId}
  - title, category: "parking" | "roundabouts" | ...
  - type: "video_link" | "pdf" | "image"
  - url
  - createdAt
```

### Invites
```
/instructors/{instructorId}/invites/{code}
  - createdAt, expiresAt (7 days)
  - claimed: boolean, claimedBy?
```

### Blocked Slots
```
/instructors/{instructorId}/blockedSlots/{slotId}
  - date, startTime, endTime
  - reason?
```

### Subscription (managed by Stripe Extension)
```
/customers/{uid}
  - stripeId
  - subscriptions/ (subcollection)
    - status: "active" | "trialing" | "past_due" | "canceled"
    - tier: "basic" | "pro" | "premium"
    - currentPeriodEnd
    - cancelAtPeriodEnd
```

### Notifications
```
/users/{userId}/notifications/{notifId}
  - type, title, body
  - relatedId (bookingId, etc.)
  - createdAt, read: boolean
```

### Key Data Model Decisions
- **Students as subcollection under instructors** — keeps queries scoped, simplifies security rules. A student is linked to one instructor in MVP. Multi-instructor (driving schools) is Phase 3.
- **Denormalized studentName on bookings** — avoids extra read per booking when rendering calendar.
- **Messages flat under instructor** — query for threads filtered by toId/fromId.
- **Invite codes as document IDs** — direct lookup, no query needed.

---

## 4. UI/UX Design

### Aesthetic: "Professional Warmth"
Clean and trustworthy (business tool), warm and approachable (instructors aren't corporate users). A premium productivity app that doesn't feel cold.

### Color Palette
```
Primary:           #1B6B4A  (deep forest green - trust, driving/road association)
Secondary:         #F5A623  (warm amber - energy, attention, CTA accent)
Surface:           #FAFAF7  (warm off-white)
Card:              #FFFFFF
Text:              #1A1A1A  (near-black, softer than pure black)
Text Secondary:    #6B7280
Error:             #DC3545
Success:           #22C55E
Background Accent: #F0F7F4  (light green tint for sections)
```

### Typography
- **Display/Headings:** `DM Serif Display` — elegant, distinctive, personality without being playful. Screen titles, empty states, onboarding.
- **Body/UI:** `Plus Jakarta Sans` — geometric, modern, highly legible at small sizes. Body text, buttons, labels, form fields.
- **Scale:** 12 / 14 / 16 / 20 / 24 / 32

### Motion & Micro-interactions
- **Screen transitions:** Shared element hero animations (list to detail)
- **Calendar:** Smooth page swipe between weeks, bookings fade-slide in with staggered 50ms delays
- **Progress ratings:** Animated radial fill when updating skill rating (1 to 5 fills a circle)
- **"Test Ready" indicator:** Confetti-burst animation when student hits threshold
- **Pull-to-refresh:** Custom driving-themed animation (steering wheel rotation)
- **Booking confirmation:** Haptic feedback + checkmark scale-bounce

### Spatial Composition
- Cards with 16px padding, 12px border radius
- Generous negative space on calendar and student list (most-used screens)
- Strategic breathing room over information density

### Navigation

**Instructor (bottom nav, 4 tabs):**
- Home/Dashboard
- Calendar
- Students
- More (settings, subscription, resources)

**Student (bottom nav, 3 tabs):**
- Bookings
- Progress
- Resources

**Primary action:** Floating action button for "New Booking" (always accessible)

### Key Screens — Instructor

| Screen | Purpose | Design |
|---|---|---|
| Dashboard | Today's lessons, quick stats | Card-based, count-up animation on numbers |
| Calendar | Weekly/daily booking view | `table_calendar` with custom day cells, lesson count dots |
| Student List | All students, search/filter | Alphabetical, status badges (green=active, amber=test-ready, grey=inactive) |
| Student Detail | Profile, progress, logs | Tabbed: Overview / Progress / Lessons / Mock Tests |
| Progress Tracker | Skill ratings grid | Skill cards with filled circles (1-5), color-coded by proficiency |
| Booking Detail | Single lesson view | Student name, time, location, status actions |
| Lesson Log Form | Post-lesson notes | Quick-entry: tap skills, write notes, rate |

### Key Screens — Student

| Screen | Purpose | Design |
|---|---|---|
| My Bookings | Upcoming + past | Timeline view, next lesson prominent at top |
| Book Lesson | Pick available slot | Date to time to confirm flow (when self-booking enabled, Phase 2) |
| My Progress | Skill overview | Radar/spider chart of categories + individual skill list |
| Resources | Learning materials | Category cards with thumbnails |

---

## 5. Authentication & User Flows

### Instructor Registration
1. Email/password sign-up via Firebase Auth
2. Cloud Function `onCreate` trigger creates `/users/{uid}` (role: instructor) and `/instructors/{uid}` profile doc
3. Onboarding wizard (3 steps with progress bar):
   - Step 1: Profile (name, phone, photo)
   - Step 2: Teaching setup (lesson durations, buffer time, teaching areas, test centres)
   - Step 3: Availability (weekly recurring schedule — toggle days, set time ranges)
4. Lands on Dashboard, prompted to add first student or start subscription

### Student Registration
1. Receives invite link or 6-digit code from instructor
2. Opens app, signs up with email/password
3. Cloud Function validates invite code, links student to instructor
4. Minimal onboarding: name, phone
5. Lands on "My Bookings" screen

### Invite System
- Instructor generates invite from Student Management screen
- Creates `/instructors/{id}/invites/{code}` with 7-day expiry
- Share options: deep link or display code for manual entry
- One invite = one student. Claimed invites marked.

### Auth Guards (GoRouter redirects)
```
Not logged in          -> /login
Instructor, no profile -> /onboarding
Instructor, no sub     -> /subscribe (after trial)
Instructor, active     -> /instructor/dashboard
Student, active        -> /student/bookings
```

### Firestore Security Rules
- Instructors read/write only their own subcollections
- Students read only their own data under linked instructor
- Students can create bookings only in open slots (when self-booking enabled)
- Cloud Functions handle cross-document writes

---

## 6. Booking System

### Availability
- Weekly recurring availability set by instructor (e.g., Mon 8am-5pm)
- Stored as `weeklyAvailability` map on instructor doc
- Blocked dates/times for holidays stored in `/instructors/{id}/blockedSlots/`

### Booking Creation — Instructor-Initiated
1. FAB -> "New Booking"
2. Select student
3. Pick date -> available time slots (availability - existing bookings - buffer)
4. Pick duration (from instructor's configured options)
5. Add pickup location (text field)
6. Optional: toggle "Recurring weekly" (creates 4/8 weeks with shared `recurringGroupId`)
7. Confirm -> Firestore write -> Cloud Function sends push notification

### Booking Creation — Student Self-Booking (Phase 2)
1. Student views available slots (read-only openings)
2. Picks date -> time -> duration
3. Adds pickup location
4. Confirm -> status: "pending"
5. Instructor notified -> approves or declines
6. Student notified of outcome

### Booking States
```
confirmed -> completed  (instructor marks after lesson)
confirmed -> cancelled  (either party, with reason)
pending   -> confirmed | declined  (student-initiated, Phase 2)
```

### Cancellation Rules
- Cloud Function checks timing: <24h = "late cancellation" (tracked in analytics)
- Recurring booking cancellation: "This lesson only" or "All future lessons"

### Buffer & Travel Time
- Buffer time auto-blocked after each booking (configurable, e.g., 15 min)
- Travel time manual in MVP (instructor accounts in availability). Automated with Maps in Phase 3.

---

## 7. Notifications

### FCM Push Notifications

| Event | Recipient | Timing |
|---|---|---|
| Booking confirmed | Student | Immediate |
| Booking cancelled | Other party | Immediate |
| Booking reminder | Both | 24h + 2h before |
| Student self-booking request | Instructor | Immediate (Phase 2) |
| Booking approved/declined | Student | Immediate (Phase 2) |
| Progress updated | Student | Immediate |
| Mock test result shared | Student | Immediate |
| New message | Recipient | Immediate |

### Implementation
- **Immediate:** Cloud Function Firestore triggers (`onDocumentCreated`, `onDocumentUpdated`)
- **Scheduled reminders:** Cloud Scheduler runs hourly -> queries bookings in 24h/2h -> sends FCM
- **In-app history:** Notifications stored in `/users/{id}/notifications/{notifId}`
- Badge count on notifications bell icon

---

## 8. Subscription & Payments

### Stripe + Firebase Extension
1. Extension mirrors Stripe subscription state in `/customers/{uid}` collection
2. Instructor taps "Subscribe" -> Cloud Function creates Stripe Checkout Session
3. Opens Stripe Checkout in WebView/browser
4. Stripe webhook -> Extension updates Firestore
5. App reads `subscriptionStatus` in real-time -> unlocks features

### Pricing Tiers

| Feature | Basic (£6.99/mo) | Pro (£12.99/mo) | Premium (£19.99/mo) |
|---|---|---|---|
| Students | Up to 10 | Unlimited | Unlimited |
| Booking system | Yes | Yes | Yes |
| Lesson notes | Yes | Yes | Yes |
| Progress tracking | Basic (rating only) | Full (DVSA + custom) | Full |
| Mock tests | No | Yes | Yes |
| Messaging | No | Yes | Yes |
| Dashboard analytics | No | Basic | Full |
| Learning resources | No | No | Yes |
| Priority support | No | No | Yes |
| *Future: WhatsApp* | No | No | Yes |

### Free Trial
- Configurable via Firebase Remote Config (toggle on/off, set duration: 7/14/30 days)
- Grants Pro-level features during trial
- No credit card required for trial
- After trial: soft paywall — read-only access (view data, can't create new bookings/students)
- Nudge to subscribe, never hard-lock data

### Feature Gating
- Riverpod `subscriptionProvider` streams tier from Firestore
- `FeatureGate` widget: unlocked -> show feature; locked -> greyed out with "Pro"/"Premium" badge -> tap opens upgrade
- Cloud Functions enforce limits server-side (e.g., 10 student cap on Basic)

---

## 9. Messages (MVP — Simple)

- One-way announcements + basic back-and-forth between instructor and student
- No real-time typing indicators or read receipts in MVP
- Messages stored in `/instructors/{id}/messages/` collection
- Queried by participant IDs, ordered by `createdAt`
- Push notification on new message
- No file sharing in MVP (text only)

---

## 10. Progress Tracking

### DVSA-Aligned Default Skills

**Manoeuvres:**
- Parallel parking
- Bay parking (forward + reverse)
- Emergency stop
- Pulling up on the right

**Road Skills:**
- Junctions (T-junctions, crossroads)
- Roundabouts
- Speed control
- Lane discipline
- Mirror use (MSM routine)
- Independent driving
- Dual carriageways
- Pedestrian crossings

### Custom Skills
- Instructors can add custom skills under any category or create new categories
- Custom skills are stored alongside DVSA defaults, marked with `isCustom: true`

### Rating System
- 1-5 scale per skill
- 1 = Not introduced, 2 = Needs significant work, 3 = Developing, 4 = Competent, 5 = Test ready
- Color-coded: 1-2 red, 3 amber, 4-5 green

### "Test Ready" Indicator (Phase 2)
- Calculated when all DVSA skills are rated 4+
- Triggers confetti animation
- Visible to both instructor and student

---

## 11. Phasing

### Phase 1 — MVP
- Authentication (instructor + student, invite system)
- Instructor onboarding wizard
- Student management (CRUD, status)
- Booking system (instructor-initiated, calendar, recurring, cancellations)
- Lesson logs (post-lesson notes, skills covered)
- Basic progress tracking (DVSA defaults + custom, 1-5 rating)
- Push notifications (FCM)
- Subscription system (Stripe, 3 tiers, configurable trial)
- Simple messages (text only, announcements + replies)

### Phase 2 — Growth
- Student self-booking with approval flow
- Mock test system with fault tracking
- Dashboard analytics (lessons, pass rate, cancellations, popular slots)
- Learning resources (video links, PDFs, categorized)
- "Test Ready" indicator with automated threshold

### Phase 3 — Scale
- WhatsApp Business API integration (Premium tier)
- Google Maps integration (pickup pins, saved routes, practice zones)
- Multi-instructor mode (driving schools, shared calendar, admin dashboard)
- Web admin panel

### Phase 4 — Future
- Marketplace (students discover instructors)
- AI lesson feedback / skill recommendations
- Theory test preparation
