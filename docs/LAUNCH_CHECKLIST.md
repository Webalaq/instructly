# Instructly — Launch Checklist

> Everything needed before going live. Updated 2026-06-01.

## Critical (Must Do Before First User)

### Database
- [ ] Run migration 0006 on Supabase (`0006_authenticated_invite_code_read.sql`)
- [ ] Run migration 0007 on Supabase (`0007_protect_private_notes.sql`)
- [ ] Verify RLS policies work: test student can't read `instructor_private_notes`
- [ ] Verify invite code lookup works for both anon and authenticated roles

### Stripe (Live Mode)
- [ ] Create live Stripe products + prices (Basic £19, Standard £29, Premium £49)
- [ ] Update env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` → live keys
- [ ] Update `STRIPE_PRICE_*` env vars to live price IDs
- [ ] Create webhook endpoint in Stripe dashboard pointing to `yourdomain.com/api/stripe/webhook`
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
- [ ] Test full checkout flow with real card (use £1 test then refund)

### Twilio (WhatsApp)
- [ ] Apply for WhatsApp Business API access via Twilio
- [ ] Submit message templates for Meta approval (reminder_24h, cancellation, booking_confirmation)
- [ ] Update env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- [ ] Test sending WhatsApp message to your own number
- [ ] Note: Meta approval can take 1-2 weeks — start early

### Domain + DNS
- [ ] Purchase domain (e.g., instructly.co.uk)
- [ ] Add custom domain in Vercel project settings
- [ ] Configure DNS records (CNAME or A record)
- [ ] Verify SSL certificate is active
- [ ] Update Supabase Auth redirect URLs to include new domain
- [ ] Update `NEXT_PUBLIC_APP_URL` env var

### Supabase Auth
- [ ] Add production domain to Supabase Auth → URL Configuration → Redirect URLs
- [ ] Customize email templates (confirmation, password reset) with Instructly branding
- [ ] Set Site URL to production domain
- [ ] Test full signup → email confirm → login flow on production

### Environment Variables (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — production service role key
- [ ] `STRIPE_SECRET_KEY` — live key
- [ ] `STRIPE_PUBLISHABLE_KEY` — live key
- [ ] `STRIPE_WEBHOOK_SECRET` — live webhook secret
- [ ] `STRIPE_PRICE_BASIC` / `STANDARD` / `PREMIUM` — live price IDs
- [ ] `TWILIO_ACCOUNT_SID` / `AUTH_TOKEN` / `WHATSAPP_FROM` — production
- [ ] `RESEND_API_KEY` — production key
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — push notification keys
- [ ] `CRON_SECRET` — secure random string for cron job auth

## Important (First Week)

### Monitoring
- [ ] Set up Sentry (or similar) for error tracking
- [ ] Set up Vercel Analytics or PostHog
- [ ] Configure uptime monitoring (e.g., BetterStack)
- [ ] Set up Vercel cron job for `/api/cron/reminders` (daily at 8am UK)

### Legal
- [ ] Write Terms of Service (use SaaS template, adapt for UK law)
- [ ] Write Privacy Policy (GDPR-compliant, list all data processors)
- [ ] Add links to footer of landing page
- [ ] ICO registration (UK data protection) if processing personal data commercially

### Content
- [ ] Review landing page copy — accurate pricing, features, CTA
- [ ] Add real testimonials (or remove placeholder ones)
- [ ] Set up support email (e.g., support@instructly.co.uk)
- [ ] Create a simple FAQ or help page

## Nice to Have (Pre-Launch)

- [ ] Set up Google Search Console
- [ ] Add meta tags / Open Graph images for social sharing
- [ ] Test PWA install on real Android + iPhone devices
- [ ] Load test with 50+ concurrent users
- [ ] Set up database backups schedule in Supabase
- [ ] Create seed data script for demo account

## Launch Day

- [ ] Smoke test all critical flows on production:
  - Instructor signup → onboarding → add student → create booking
  - Student signup via invite link → view dashboard → view progress
  - Stripe checkout → subscription active → feature access
  - WhatsApp reminder sends (if approved)
- [ ] Share link with first 5 beta instructors
- [ ] Monitor Sentry + Vercel logs for first 24h
