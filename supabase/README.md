# Supabase — Database Setup

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A Supabase project (local or hosted)

## Running migrations locally

```bash
# Start local Supabase (Docker required)
supabase start

# Apply migrations
supabase db reset    # drops everything and re-runs all migrations + seed

# Or apply just new migrations
supabase migration up
```

## Running against hosted project

```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Seed data

`seed.sql` runs automatically after `supabase db reset`.

Before seeding, create two test users in the Supabase Dashboard
(Authentication > Users > Add User):

| Email                | Password    | User metadata                              |
|----------------------|-------------|--------------------------------------------|
| instructor@test.com  | password123 | `{"role": "instructor", "full_name": "Sarah Test"}` |
| student@test.com     | password123 | `{"role": "student", "full_name": "Aisha Khan"}`    |

The seed script finds these users by their `role` metadata and creates
sample settings, availability, a student record, and a booking.

## Creating new migrations

```bash
supabase migration new description_of_change
```

This creates a timestamped file in `migrations/`. Write your SQL there,
then update `docs/DATABASE.md` to match.
