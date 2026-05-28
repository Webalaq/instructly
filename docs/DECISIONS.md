# Architecture Decisions

> Append-only log. When you change direction, add a new entry — don't edit old ones.

## ADR-001: Web PWA first, native apps later

**Date**: Project start
**Decision**: Build a Next.js PWA. Skip React Native for V1.
**Why**:

- Ship 3 months faster
- No app store review delays
- No 15–30% IAP cut (use Stripe directly on web)
- Single codebase to maintain solo
- Instructors mostly use phones in landscape between lessons — PWA handles that fine
  **Revisit when**: We have 100+ paying instructors and clear signal they want native (push notifications, offline-first, App Store discoverability).

## ADR-002: Supabase over custom backend

**Date**: Project start
**Decision**: Use Supabase for Postgres, Auth, Storage, Realtime.
**Why**:

- Solo dev — backend boilerplate kills velocity
- RLS replaces a permissions layer
- Auth is the #1 thing not to build yourself
- Free tier covers us to ~50 paying customers
  **Trade-offs**: Vendor lock-in (acceptable — Postgres is portable, Auth is the sticky bit).

## ADR-003: Next.js App Router (not NestJS backend)

**Date**: Project start
**Decision**: Next.js API routes + Server Actions for all backend logic.
**Why**:

- One repo, one deploy, one mental model
- Claude Code is excellent at Next.js patterns
- Server Components reduce client JS dramatically
  **Trade-offs**: If we ever need a heavy background-job system, we'll add Inngest or Trigger.dev.

## ADR-004: Stripe on web, not in-app purchases

**Date**: Project start
**Decision**: All subscriptions via Stripe Checkout.
**Why**: PWA isn't subject to App Store IAP rules. 2.9% + 20p beats 30%.
**Revisit when**: We ship native apps and Apple forces IAP.

## ADR-005: pnpm over npm

**Decision**: Use pnpm.
**Why**: Faster installs, stricter deps, better monorepo support if we ever split.

## ADR-006: WhatsApp before SMS

**Decision**: Twilio WhatsApp Business API as primary notification channel.
**Why**: UK instructors and learners are 95%+ on WhatsApp. SMS is fallback only.
**Risk**: WhatsApp template approval can take days. Submit templates in week 1.
