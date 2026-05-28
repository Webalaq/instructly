# Instructly — Database Schema

> Update this file whenever a migration is added.
> Source of truth lives in `supabase/migrations/`.

## Principles

- Every table has `id` (uuid, default `gen_random_uuid()`), `created_at`, `updated_at`.
- All foreign keys use `ON DELETE` rules explicitly — never default.
- Row Level Security (RLS) enabled on every table. No exceptions.
- Money in pence (integer). Durations in minutes (integer).
- All timestamps are `timestamptz`, stored in UTC.

## Tables

### `profiles`

Extends `auth.users`. Created via trigger on user signup.

| Column     | Type        | Notes                                |
| ---------- | ----------- | ------------------------------------ |
| id         | uuid PK     | references auth.users(id)            |
| role       | text        | 'instructor' \| 'student' \| 'admin' |
| full_name  | text        |                                      |
| phone      | text        | E.164 format, for WhatsApp           |
| avatar_url | text        | nullable                             |
| created_at | timestamptz |                                      |
| updated_at | timestamptz |                                      |

### `instructor_settings`

One row per instructor.

| Column                 | Type        | Notes                                          |
| ---------------------- | ----------- | ---------------------------------------------- |
| instructor_id          | uuid PK     | FK profiles(id)                                |
| hourly_rate_pence      | integer     | e.g. 4000 = £40/hr                             |
| default_lesson_minutes | integer     | 60, 90, or 120                                 |
| working_hours          | jsonb       | { mon: [{start: "09:00", end: "17:00"}], ... } |
| postcodes              | text[]      | service areas                                  |
| business_name          | text        | nullable                                       |
| invite_code            | text UNIQUE | for students to join                           |

### `students`

Students belong to one instructor. (V2: could be shared in school mode.)

| Column        | Type    | Notes                                               |
| ------------- | ------- | --------------------------------------------------- |
| id            | uuid PK |                                                     |
| instructor_id | uuid    | FK profiles(id) ON DELETE CASCADE                   |
| profile_id    | uuid    | FK profiles(id), nullable until student signs up    |
| full_name     | text    | required even before profile exists                 |
| email         | text    |                                                     |
| phone         | text    | E.164                                               |
| status        | text    | 'active' \| 'inactive' \| 'passed' \| 'test_booked' |
| theory_passed | boolean | default false                                       |
| test_date     | date    | nullable                                            |
| notes         | text    | private instructor notes                            |

### `availability_slots`

Recurring weekly availability + one-off overrides/blocks.

| Column        | Type        | Notes                                   |
| ------------- | ----------- | --------------------------------------- |
| id            | uuid PK     |                                         |
| instructor_id | uuid        | FK profiles(id) ON DELETE CASCADE       |
| type          | text        | 'recurring' \| 'one_off' \| 'blocked'   |
| day_of_week   | smallint    | 0=Sun..6=Sat (for recurring)            |
| start_time    | time        | for recurring                           |
| end_time      | time        | for recurring                           |
| date          | date        | for one_off and blocked                 |
| start_at      | timestamptz | for one_off and blocked (full datetime) |
| end_at        | timestamptz |                                         |

### `bookings`

The core entity.

| Column              | Type        | Notes                                                  |
| ------------------- | ----------- | ------------------------------------------------------ |
| id                  | uuid PK     |                                                        |
| instructor_id       | uuid        | FK profiles(id)                                        |
| student_id          | uuid        | FK students(id)                                        |
| start_at            | timestamptz |                                                        |
| end_at              | timestamptz |                                                        |
| status              | text        | 'scheduled' \| 'completed' \| 'cancelled' \| 'no_show' |
| pickup_location     | text        | nullable                                               |
| price_pence         | integer     | snapshot of price at booking time                      |
| paid                | boolean     | default false                                          |
| cancellation_reason | text        | nullable                                               |

Constraint: no overlapping bookings for same instructor. Enforce with exclusion constraint.

### `lesson_notes`

One row per completed booking.

| Column                   | Type        | Notes                             |
| ------------------------ | ----------- | --------------------------------- |
| id                       | uuid PK     |                                   |
| booking_id               | uuid UNIQUE | FK bookings(id) ON DELETE CASCADE |
| summary                  | text        | what was covered                  |
| homework                 | text        | nullable                          |
| instructor_private_notes | text        | not visible to student            |

### `skill_ratings`

Granular DVSA-aligned skill tracking. Many rows per lesson.

| Column     | Type     | Notes                                          |
| ---------- | -------- | ---------------------------------------------- |
| id         | uuid PK  |                                                |
| booking_id | uuid     | FK bookings(id) ON DELETE CASCADE              |
| student_id | uuid     | FK students(id) (denormalized for query speed) |
| skill_key  | text     | enum value, see below                          |
| rating     | smallint | 1–5 (1 = needs lots of work, 5 = test-ready)   |

**Skill keys** (V1 set, expand later):

- `vehicle_control.steering`
- `vehicle_control.clutch`
- `vehicle_control.gears`
- `road_awareness.junctions`
- `road_awareness.roundabouts`
- `road_awareness.lanes`
- `manoeuvres.parallel_park`
- `manoeuvres.bay_park`
- `manoeuvres.emergency_stop`
- `safety.mirrors`
- `safety.speed`
- `safety.hazard_response`

### `subscriptions`

Stripe subscription state per instructor.

| Column                 | Type        | Notes                                              |
| ---------------------- | ----------- | -------------------------------------------------- |
| instructor_id          | uuid PK     | FK profiles(id)                                    |
| stripe_customer_id     | text UNIQUE |                                                    |
| stripe_subscription_id | text UNIQUE | nullable until first sub                           |
| plan                   | text        | 'basic' \| 'standard' \| 'premium'                 |
| status                 | text        | 'trialing' \| 'active' \| 'past_due' \| 'canceled' |
| current_period_end     | timestamptz |                                                    |
| trial_ends_at          | timestamptz | nullable                                           |

### `whatsapp_messages`

Audit log of every message sent.

| Column          | Type        | Notes                                         |
| --------------- | ----------- | --------------------------------------------- |
| id              | uuid PK     |                                               |
| booking_id      | uuid        | FK bookings(id), nullable                     |
| recipient_phone | text        | E.164                                         |
| template_key    | text        | e.g. 'reminder_24h', 'cancellation'           |
| status          | text        | 'queued' \| 'sent' \| 'delivered' \| 'failed' |
| twilio_sid      | text        |                                               |
| sent_at         | timestamptz |                                               |

## RLS Policy Patterns

For every table, write four policies (SELECT, INSERT, UPDATE, DELETE). The default rule:

- **Instructors**: can do everything on rows where `instructor_id = auth.uid()`.
- **Students**: SELECT only on rows where they are the related student.
- **Admins**: bypass via service role key (server-side only).

Example pattern for `bookings`:

```sql
CREATE POLICY "instructor_full_access" ON bookings
  FOR ALL TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "student_read_own" ON bookings
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE profile_id = auth.uid()
    )
  );
```

## Indexes to Add

- `bookings(instructor_id, start_at)` — calendar queries
- `bookings(student_id, start_at)` — student history
- `students(instructor_id, status)` — student lists
- `skill_ratings(student_id, skill_key)` — progress aggregation
- `whatsapp_messages(booking_id)` — audit lookups
