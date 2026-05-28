# Technology Guide for Instructly

A plain-English walkthrough of every tool in the stack — what it does,
why we chose it, what it costs, and where it could fail.

---

## The Big Picture

A web app needs four basic capabilities:

1. **Render pages** that users see in their browser
2. **Store data** somewhere persistent
3. **Authenticate users** so they only see their own stuff
4. **Connect to outside services** (payments, messages, email)

Modern stacks bundle these. Here's ours:

```
┌─────────────────────────────────────────────────────┐
│  USER'S PHONE / BROWSER                             │
│  ↓                                                  │
│  Next.js (rendering + routing + APIs)               │
│  ↓                                                  │
│  Supabase (database + auth + file storage)          │
│  ↓                                                  │
│  Stripe (payments) · Twilio (WhatsApp) · Resend (email) │
└─────────────────────────────────────────────────────┘
```

All of this runs on Vercel (the hosting platform).

---

## Next.js 15 — The Framework

**What it is**: A React framework. React is the most popular way to build interactive web UIs. Next.js wraps React with routing, server-side rendering, and a backend API layer.

**Why we use it**:

- One repo for frontend AND backend. Solo devs need this.
- Server Components render HTML on the server, so users see content faster.
- Claude Code is exceptionally fluent in Next.js patterns.
- Deploys to Vercel with one command.

**Two concepts you'll see constantly**:

- **App Router**: The new way to organize pages. Folders = URLs. `app/instructor/students/page.tsx` becomes `/instructor/students`.
- **Server vs Client Components**: By default everything runs on the server (faster, more secure). Add `"use client"` at the top of a file when you need browser-only stuff like form interactions.

**Cost**: Free (open source).

**Where it could fail**: Server Components have a learning curve. Don't fight them — when Claude Code says "this needs to be a Client Component," trust it.

---

## TypeScript — The Language

**What it is**: JavaScript with types. You declare what shape your data is in, and the compiler catches mistakes before they hit production.

**Why we use it**:

- Catches half your bugs at compile time
- Makes Claude Code's suggestions much more accurate (it can see the types)
- Self-documenting — you read a function signature and know what it does

**Cost**: Free.

**Where it could fail**: Type errors can be cryptic. When stuck, paste the error into Claude.

---

## Tailwind CSS + shadcn/ui — The Styling

**Tailwind** is a way to style HTML by adding small utility classes directly to elements:

```html
<button class="bg-blue-500 text-white px-4 py-2 rounded">Click</button>
```

No separate CSS files for most things.

**shadcn/ui** is a collection of pre-built components (buttons, forms, dialogs, calendars) that use Tailwind underneath. You copy them into your project — you own the code, no library to update.

**Why we use them**:

- shadcn/ui gives you a professional UI on day one
- Tailwind means you never write CSS from scratch
- Both are extremely well documented and Claude knows them perfectly

**Cost**: Free.

**Where it could fail**: It can look "AI-generated" if you don't tweak. Pick a distinct accent color, use one nice font, and you'll be fine.

---

## Supabase — The Backend in a Box

**What it is**: A hosted Postgres database, plus authentication, plus file storage, plus realtime subscriptions, all behind one SDK.

It's the single biggest time-saver in this stack. It replaces what would be 3-4 separate services.

**Four things it gives you**:

1. **Postgres database**. The most respected relational database in the world. We store everything in it.

2. **Authentication**. Email/password, magic links, social login, all built-in. You don't write a single line of auth code yourself. **This alone saves you 2-3 weeks.**

3. **Row Level Security (RLS)**. Postgres feature that lets you write rules like "users can only read rows where `user_id = their_id`." Instead of checking permissions in your app code (where you'll forget), the database itself enforces it. This is huge for safety.

4. **File storage**. For when students upload profile photos or instructors upload PDFs. S3-compatible.

**Why we use it**:

- Solo dev cannot build auth correctly. Use a service.
- RLS makes the app fundamentally safer.
- Free tier covers 50,000 monthly active users and 500MB database. You'll outgrow it well after revenue arrives.

**Cost**: Free tier generous. Pro is $25/month when you need it (typically around 100+ paying customers).

**Where it could fail**: RLS policies are tricky to get right. **Always test them.** Write a test that logs in as User A and tries to read User B's data — it should fail.

---

## Stripe — Payments

**What it is**: The standard for online payments. Handles cards, subscriptions, taxes, invoices, refunds.

**Why we use it**:

- UK + US support out of the box
- Stripe Checkout is a hosted payment page — you don't handle card details (PCI compliance becomes their problem)
- Subscriptions API is excellent: trials, upgrades, cancellations all handled

**How it works in Instructly**:

1. Instructor clicks "Upgrade to Standard" → we call Stripe to create a Checkout session
2. They get redirected to Stripe's hosted checkout
3. They pay, Stripe redirects them back to us
4. Stripe sends a webhook to our app saying "subscription created"
5. Our webhook handler updates the `subscriptions` table in Supabase

**Cost**: 1.5% + 20p per UK card, 2.5% + 20p international. No monthly fees.

**Where it could fail**: Webhook handling. If your webhook endpoint goes down, subscription state gets out of sync. Stripe retries for 3 days, so it's recoverable, but test webhook handlers carefully using Stripe CLI.

---

## Twilio — WhatsApp Messages

**What it is**: A service for sending SMS, WhatsApp messages, voice calls programmatically.

**Why WhatsApp specifically**:

- UK driving instructors live on WhatsApp
- Read rates are 5-10× higher than email
- It's the killer feature for reducing no-shows

**The catch**:

- WhatsApp Business API requires **pre-approved message templates** for the first message in a 24-hour window
- Template approval takes 1-3 days
- You need a verified business profile (Facebook Business Manager setup)
- **Start the Twilio + WhatsApp setup in Week 1**, even though we don't write the integration until Week 8. The approval delay will kill your timeline otherwise.

**Cost**: ~£0.04 per WhatsApp conversation (24-hour window). Roughly £20/month per active instructor sending reminders to 30 students.

**Where it could fail**: Template rejections. Keep templates simple, non-promotional, and clearly transactional ("Reminder: your lesson at {time} on {date}").

---

## Resend — Transactional Email

**What it is**: A modern email-sending API. Replaces SendGrid/Mailgun.

**Why we use it**:

- Simple API, great DX
- React Email templates — write emails as React components
- Generous free tier

**What we send**: Welcome emails, password resets, payment receipts (Stripe also sends these — pick one), student invites.

**Cost**: Free up to 3,000 emails/month. $20/month for 50k.

---

## Vercel — Hosting

**What it is**: The company that makes Next.js. Their hosting platform is purpose-built for Next.js apps.

**Why we use it**:

- `git push` → live deploy in 60 seconds
- Free SSL, free CDN, free preview URLs for every PR
- Serverless under the hood — scales automatically

**Cost**: Free Hobby tier covers you to ~50 active customers. Pro is $20/month. Watch out for bandwidth charges if you serve a lot of images — use Supabase Storage with public URLs to offload.

**Where it could fail**: Long-running API routes timeout at 10s (Hobby) or 60s (Pro). For anything slow, push it to a background job (Inngest later) or a separate worker.

---

## pnpm — Package Manager

**What it is**: Like npm, but faster and stricter.

**Why**: npm is fine, but pnpm catches more bugs (won't let you use a package you didn't explicitly install) and uses less disk space. Negligible decision either way — use pnpm because Claude Code defaults work fine with it.

---

## Vitest + Playwright — Testing

- **Vitest**: Fast unit testing. Runs in milliseconds. Use for business logic, utilities, validation schemas.
- **Playwright**: Browser automation for end-to-end tests. Use for critical flows only — signup, booking creation, payment.

**Don't try to test everything**. Solo + AI-coded means tests are a safety net for the parts that, if they break, kill your business. That's auth, payments, and bookings. Skip tests for landing pages and dashboards.

**Cost**: Free.

---

## What We Deliberately Did NOT Choose

- **React Native / Expo**: Adds 2-3 months and an entire second codebase. PWA covers V1.
- **NestJS / separate backend**: Doubles deploy complexity for solo dev. Next.js API routes are enough.
- **Prisma / Drizzle ORM**: Supabase's typed client is sufficient. Adding an ORM is two layers of indirection.
- **Redux / Zustand**: Server Components + URL state cover 95% of needs. Add later if needed.
- **MongoDB / NoSQL**: Driving instruction is relational data. Use Postgres.
- **Auth0 / Clerk**: Supabase Auth is included and good enough. One less vendor.
- **Mailchimp / etc.**: Resend is plenty for transactional. Add a marketing tool later when you have a list.

---

## Total Monthly Cost at Launch

| Service         | Cost                              |
| --------------- | --------------------------------- |
| Vercel          | £0 (Hobby)                        |
| Supabase        | £0 (Free tier)                    |
| Stripe          | 1.5% of revenue                   |
| Twilio          | ~£10-20 (low volume to start)     |
| Resend          | £0 (Free tier)                    |
| Domain          | ~£10/year                         |
| **Total fixed** | **~£15/month + transaction fees** |

You can run this business at near-zero burn until you have paying customers. That's the point.

---

## Total Monthly Cost at 100 Paying Instructors (~£3k MRR)

| Service       | Cost                     |
| ------------- | ------------------------ |
| Vercel Pro    | £16                      |
| Supabase Pro  | £20                      |
| Stripe (1.5%) | ~£45                     |
| Twilio        | ~£200 (3000 messages/mo) |
| Resend        | £16                      |
| **Total**     | **~£300/month**          |

That's a 10% margin on infrastructure at 100 customers. Healthy.

---

## What Each Tool Replaces (If You Were Building It "Properly")

| Our tool        | What you'd otherwise build                |
| --------------- | ----------------------------------------- |
| Supabase Auth   | A 3-week auth system you'd get wrong      |
| Supabase RLS    | A permissions layer in app code           |
| Stripe Checkout | A PCI-compliant payment form              |
| shadcn/ui       | A design system from scratch              |
| Next.js         | Express + React Router + a build pipeline |
| Vercel          | A DevOps setup                            |
| Twilio          | A messaging gateway integration           |

You're using ~£15/month of tooling to skip ~6 months of work. That's the deal.
