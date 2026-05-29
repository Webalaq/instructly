import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  BookOpenIcon,
  BarChart3Icon,
  MessageSquareIcon,
  ShieldCheckIcon,
  CheckIcon,
  StarIcon,
  ArrowRightIcon,
  XIcon,
  ClockIcon,
  BanknoteIcon,
  SmartphoneIcon,
  CalendarIcon,
  UsersIcon,
  CreditCardIcon,
  MapPinIcon,
  GlobeIcon,
  AlertTriangleIcon,
} from "lucide-react";

/* ───── DATA ───── */

const PAIN_ITEMS = [
  "Forgotten lessons and last-minute cancellations",
  "Scattered notes across WhatsApp, paper, and spreadsheets",
  "Double bookings because your diary isn't synced",
  "Hours spent chasing students for confirmations",
  "No way to show parents their child's progress",
  "Looking unprofessional compared to driving schools",
];

const SYSTEM_FEATURES = [
  {
    icon: CalendarIcon,
    title: "Smart Lesson Calendar",
    bullets: ["Day, week & month views", "Automatic conflict prevention", "Multi-hour lesson support", "Mobile-friendly scheduling"],
    color: "bg-primary/10 text-primary",
  },
  {
    icon: UsersIcon,
    title: "Student CRM",
    bullets: ["Student profiles & notes", "Test dates & theory tracking", "Search & status filtering", "Invite codes for self-registration"],
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: BarChart3Icon,
    title: "DVSA Progress Tracking",
    bullets: ["12 skill categories rated 1–5", "Visual progress charts", "Trend indicators per skill", "Printable progress reports"],
    color: "bg-sky-500/10 text-sky-600",
  },
  {
    icon: MessageSquareIcon,
    title: "WhatsApp Reminders",
    bullets: ["Automated 24-hour reminders", "Booking confirmations", "Cancellation notifications", "Full delivery tracking"],
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpenIcon,
    title: "Lesson Notes System",
    bullets: ["Post-lesson summaries", "Homework assignments", "Private instructor notes", "Student feedback support"],
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: CreditCardIcon,
    title: "Billing & Payments",
    bullets: ["Stripe subscription management", "Per-lesson price tracking", "Secure payment portal", "Automatic invoicing"],
    color: "bg-sky-500/10 text-sky-600",
  },
];

const UK_FEATURES = [
  { icon: ShieldCheckIcon, text: "DVSA-aligned skill framework with 12 official driving categories" },
  { icon: MapPinIcon, text: "UK postcode-based teaching areas and coverage zones" },
  { icon: GlobeIcon, text: "Europe/London timezone for all scheduling and reminders" },
  { icon: UsersIcon, text: "Built for ADIs and PDIs — approved and trainee instructors" },
];

const STEPS = [
  { step: "1", title: "Create your account", desc: "Sign up free. Set your hourly rate, working hours, and teaching areas in under 5 minutes." },
  { step: "2", title: "Add your students", desc: "Import existing learners or share your invite code. They self-register and auto-link to your account." },
  { step: "3", title: "Book & teach", desc: "Schedule lessons from your calendar. WhatsApp reminders go out automatically. No chasing." },
  { step: "4", title: "Record & track", desc: "After each lesson, rate skills and add notes. Students see their progress instantly on their own dashboard." },
  { step: "5", title: "Grow your business", desc: "Professional progress reports, fewer no-shows, and happy students who refer their friends." },
];

const COMPARISON = [
  { old: "Manual WhatsApp reminders", new: "Automated 24h reminders" },
  { old: "Paper diary or spreadsheets", new: "Smart calendar with conflict prevention" },
  { old: "Forgotten lesson notes", new: "Searchable digital notes + DVSA ratings" },
  { old: "No student progress tracking", new: "Visual skill charts with trends" },
  { old: "Chasing payments manually", new: "Per-lesson price tracking & invoicing" },
  { old: "Unprofessional experience", new: "Students get their own dashboard" },
  { old: "Disconnected tools everywhere", new: "One complete platform" },
];

const TESTIMONIALS = [
  {
    quote: "I used to lose 3–4 lessons a month to no-shows. First month with Instructly, I had zero. The WhatsApp reminders alone paid for the entire subscription.",
    name: "Ahmed K.",
    location: "London",
    type: "ADI, 8 years",
    highlight: "Zero no-shows in first month",
  },
  {
    quote: "Parents started calling to say how professional the progress reports look. One mum told me she chose me over another instructor specifically because of the tracking system.",
    name: "Sarah M.",
    location: "Manchester",
    type: "ADI, 12 years",
    highlight: "Won students through professionalism",
  },
  {
    quote: "I was spending every Sunday evening updating spreadsheets and sending reminder texts. Now I spend that time with my family. Everything just happens automatically.",
    name: "James T.",
    location: "Birmingham",
    type: "PDI, 2 years",
    highlight: "Saved 2+ hours every week",
  },
  {
    quote: "As a new PDI, I needed to look established from day one. The student dashboard, the skill tracking, the automated reminders — my students think I've been doing this for years.",
    name: "Priya D.",
    location: "Leeds",
    type: "PDI, 6 months",
    highlight: "Professional image from day one",
  },
];

const PLANS = [
  {
    name: "Basic",
    price: 19,
    description: "Getting started",
    roi: "Less than one lesson cancellation",
    features: [
      "Up to 20 active students",
      "Calendar & bookings",
      "Lesson notes & DVSA ratings",
      "Student progress view",
      "Email support",
    ],
  },
  {
    name: "Standard",
    price: 29,
    popular: true,
    description: "Most instructors choose this",
    roi: "One fewer no-show covers the cost",
    features: [
      "Unlimited students",
      "Everything in Basic",
      "Full DVSA progress tracking",
      "Student invite codes & self-registration",
      "Availability management",
      "Priority email support",
    ],
  },
  {
    name: "Premium",
    price: 49,
    description: "Maximum automation",
    roi: "Saves 2+ hours per week on admin",
    features: [
      "Everything in Standard",
      "WhatsApp automation",
      "24h lesson reminders",
      "Cancellation & confirmation alerts",
      "Message delivery tracking",
      "Priority phone support",
    ],
  },
];

const FAQ = [
  {
    q: "Will my students need to download an app?",
    a: "No. Instructly is a web app that works in any browser — phone, tablet, or laptop. Students just log in with their email. Nothing to install, no app store needed.",
  },
  {
    q: "Can I import my existing students?",
    a: "Yes. Add them one by one with their name and email, or share your unique invite code and they self-register. If they sign up with the same email you entered, they auto-link to your account.",
  },
  {
    q: "How do the WhatsApp reminders work?",
    a: "We send automated WhatsApp messages to your students 24 hours before their lesson. If you cancel a booking, they get notified immediately. This requires the Premium plan and uses Twilio's WhatsApp Business API.",
  },
  {
    q: "Can students request lesson times?",
    a: "Yes. Students can see your working hours and submit preferred times. You review requests and accept or decline from your dashboard. You stay in full control.",
  },
  {
    q: "Can students track their own progress?",
    a: "Yes. Students get their own dashboard showing skill ratings, progress charts, lesson history, and homework. They can also export their progress as a printable report.",
  },
  {
    q: "Is this suitable for ADIs and PDIs?",
    a: "Absolutely. Instructly is built for both DVSA-approved driving instructors (ADIs) and trainee instructors (PDIs). The 12-skill rating framework follows official DVSA test standards.",
  },
  {
    q: "Does this work on mobile?",
    a: "Yes — it's built mobile-first. Add lesson notes from your car between lessons, check your calendar on the go, manage students from your phone. Everything is responsive and touch-friendly.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. 14-day free trial on all plans, no card required. Set up in under 5 minutes and start using immediately. Cancel anytime if it's not for you.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no cancellation fees, no questions asked. You keep access until the end of your current billing period.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Enterprise-grade PostgreSQL database with row-level security — every user can only access their own data. All data encrypted at rest and in transit. We never share or sell your data.",
  },
];

/* ───── PAGE ───── */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              I
            </div>
            <span className="text-xl font-bold tracking-tight">Instructly</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">Features</Link>
            <Link href="#platform" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">Platform</Link>
            <Link href="#testimonials" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">Testimonials</Link>
            <Link href="#pricing" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">Pricing</Link>
            <Link href="#faq" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">FAQ</Link>
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Log in</Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>Get started</Link>
          </nav>
        </div>
      </header>

      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 right-0 h-125 w-125 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-100 w-100 rounded-full bg-secondary/6 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium">
              <SmartphoneIcon className="size-4 text-primary" />
              The complete platform for UK driving instructors
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Run your driving school{" "}
              <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                without the admin chaos
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Replace spreadsheets, WhatsApp chats, manual reminders, paper notes, and disconnected apps with one modern platform designed for ADIs and PDIs.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup" className={buttonVariants({ size: "lg", className: "gap-2 px-8 text-base" })}>
                Start free in 2 minutes
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckIcon className="size-4 text-primary" />14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckIcon className="size-4 text-primary" />No card required</span>
              <span className="flex items-center gap-1.5"><CheckIcon className="size-4 text-primary" />Setup in under 5 minutes</span>
              <span className="flex items-center gap-1.5"><CheckIcon className="size-4 text-primary" />Built for UK instructors</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───── TRUST BAR ───── */}
      <section className="border-y bg-card px-4 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
          <span className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (<StarIcon key={i} className="size-4 fill-amber-400 text-amber-400" />))}
            <span className="ml-1.5 font-semibold">4.9/5</span>
            <span className="text-muted-foreground">from instructors</span>
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="font-medium">Trusted by ADIs &amp; PDIs across the UK</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="text-muted-foreground">DVSA-aligned skill framework</span>
        </div>
      </section>

      {/* ───── EMOTIONAL PAIN ───── */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Still running your business through WhatsApp and spreadsheets?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              You&apos;re not alone. Most driving instructors deal with these daily:
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {PAIN_ITEMS.map((pain) => (
              <div key={pain} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-secondary" />
                <span className="text-sm">{pain}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xl font-semibold">
              Instructly fixes <span className="text-primary">all of it</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ───── PAIN POINTS / FEATURES ───── */}
      <section id="features" className="border-y bg-card px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              What problems does it solve?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Not another generic booking tool. Purpose-built for the problems driving instructors actually have.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageSquareIcon, problem: "Stop chasing students for confirmations", solution: "WhatsApp reminders go out automatically 24 hours before every lesson. No manual texting, no forgotten messages.", color: "bg-secondary/10 text-secondary" },
              { icon: ClockIcon, problem: "Get 2 hours back every week", solution: "One dashboard replaces your paper diary, spreadsheets, and WhatsApp groups. Book, note, track — done.", color: "bg-primary/10 text-primary" },
              { icon: BarChart3Icon, problem: "Show students real progress", solution: "12 DVSA-aligned skill ratings updated after every lesson. Students see exactly where they stand — parents love it.", color: "bg-sky-500/10 text-sky-600" },
              { icon: BanknoteIcon, problem: "Stop losing £200/month to no-shows", solution: "Automated reminders cut missed lessons by up to 80%. One fewer no-show pays for your entire subscription.", color: "bg-secondary/10 text-secondary" },
              { icon: BookOpenIcon, problem: "Never forget what you covered", solution: "Quick after-lesson notes with skill ratings. Set homework. Everything searchable, nothing lost.", color: "bg-primary/10 text-primary" },
              { icon: ShieldCheckIcon, problem: "Look professional from day one", solution: "Students get their own login to track progress and view lessons. You look like a premium instructor — because you are.", color: "bg-sky-500/10 text-sky-600" },
            ].map((f) => (
              <div key={f.problem} className="group rounded-2xl border bg-background p-6 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
                <div className={`inline-flex rounded-xl p-3 ${f.color}`}>
                  <f.icon className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.problem}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── EVERYTHING INCLUDED ───── */}
      <section id="platform" className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything you need to run your driving business
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Not a booking tool. Not a CRM. Not a calendar. It&apos;s all of them — in one platform built specifically for driving instructors.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SYSTEM_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6">
                <div className={`inline-flex rounded-xl p-3 ${f.color}`}>
                  <f.icon className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <ul className="mt-3 space-y-2">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── BUILT FOR UK ───── */}
      <section className="border-y bg-card px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Designed around real UK instructor workflows
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {UK_FEATURES.map((f) => (
              <div key={f.text} className="flex items-start gap-3 rounded-xl border bg-background p-4">
                <f.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Up and running in 5 minutes</h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
            No training required. If you can use WhatsApp, you can use Instructly.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="absolute top-6 left-[calc(50%+28px)] hidden h-0.5 w-[calc(100%-56px)] bg-border lg:block" />
                )}
                <div className="relative mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── COMPARISON ───── */}
      <section className="border-y bg-card px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Why instructors switch from spreadsheets
          </h2>
          <div className="mt-12 overflow-hidden rounded-2xl border bg-background">
            <div className="grid grid-cols-2 border-b">
              <div className="border-r px-4 py-3 text-sm font-semibold text-muted-foreground sm:px-6">Before</div>
              <div className="px-4 py-3 text-sm font-semibold text-primary sm:px-6">With Instructly</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} className={`grid grid-cols-2 ${i < COMPARISON.length - 1 ? "border-b" : ""}`}>
                <div className="flex items-center gap-2 border-r px-4 py-3.5 text-sm text-muted-foreground sm:px-6">
                  <XIcon className="size-4 shrink-0 text-secondary/60" />
                  {row.old}
                </div>
                <div className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium sm:px-6">
                  <CheckIcon className="size-4 shrink-0 text-primary" />
                  {row.new}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIALS ───── */}
      <section id="testimonials" className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Instructors who switched aren&apos;t going back
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center text-muted-foreground">
            Real results from real driving instructors across the UK.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border bg-card p-6">
                <div className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t.highlight}
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (<StarIcon key={i} className="size-4 fill-amber-400 text-amber-400" />))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.type} — {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PRICING ───── */}
      <section id="pricing" className="border-t bg-card px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              One missed lesson costs more than your subscription
            </h2>
            <p className="mt-4 text-muted-foreground">
              Save 2–5 hours every week on admin. 14-day free trial, no card required.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border p-8 transition-all ${plan.popular ? "border-primary shadow-lg shadow-primary/10 lg:scale-105" : "hover:border-primary/40"}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-sm">Most popular</span>
                  </div>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">£{plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <p className="mt-2 text-xs text-primary font-medium">{plan.roi}</p>
                <Link href="/signup" className={buttonVariants({ variant: plan.popular ? "default" : "outline", className: "mt-6 w-full" })}>
                  Start free trial
                </Link>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section id="faq" className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Questions before you start</h2>
          <p className="mt-4 text-center text-muted-foreground">
            Everything you need to know. Still have questions? Email us anytime.
          </p>
          <div className="mt-12 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-xl border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-medium transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="ml-4 shrink-0 text-xl text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SEO CONTENT ───── */}
      <section className="border-t bg-card px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl space-y-12">
          <div>
            <h2 className="text-xl font-bold">How driving instructors reduce no-shows</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No-shows cost UK driving instructors an average of £150–£300 per month in lost revenue. The most effective solution is automated WhatsApp reminders sent 24 hours before each lesson. Instructly&apos;s reminder system reduces missed appointments by up to 80%, paying for the entire subscription with a single prevented no-show. Combined with easy cancellation workflows and rebooking tools, instructors can maintain a full schedule with minimal gaps.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Best driving instructor software UK</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Instructly is the all-in-one driving instructor management platform built specifically for UK ADIs and PDIs. Unlike generic scheduling tools, Instructly includes DVSA-aligned skill tracking with 12 official driving categories, UK postcode teaching areas, Europe/London timezone scheduling, and a student progress system that follows DVSA test standards. From booking management and lesson notes to WhatsApp automation and Stripe billing, it replaces every spreadsheet and disconnected tool in an instructor&apos;s workflow.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Why progress tracking improves student retention</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Students who can see their improvement are more motivated and less likely to drop out. Instructly&apos;s DVSA-aligned progress tracking rates students on 12 driving skills after every lesson, building a visual record of improvement over time. Students and their parents can view progress charts, trend indicators, and printable reports — making the learning journey transparent and the instructor&apos;s expertise visible. This professionalism leads to referrals and long-term student relationships.
            </p>
          </div>
        </div>
      </section>

      {/* ───── FOUNDER NOTE ───── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            &ldquo;We built Instructly after watching driving instructors lose hours every week to admin that should take minutes. Paper diaries, forgotten reminders, lost notes, chasing students on WhatsApp — it doesn&apos;t have to be this way. We&apos;re building the operating system driving instructors deserve.&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold">The Instructly Team</p>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Your students deserve a professional instructor.
            <br />
            <span className="text-primary">You deserve better tools.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Join driving instructors across the UK who stopped chasing and started teaching.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "gap-2 px-8 text-base" })}>
              Start free in 2 minutes
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckIcon className="size-4 text-primary" />No card required</span>
            <span className="flex items-center gap-1.5"><CheckIcon className="size-4 text-primary" />14-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckIcon className="size-4 text-primary" />Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">I</div>
              <span className="text-sm font-semibold">Instructly</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
              <Link href="#platform" className="transition-colors hover:text-foreground">Platform</Link>
              <Link href="#testimonials" className="transition-colors hover:text-foreground">Testimonials</Link>
              <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
              <Link href="#faq" className="transition-colors hover:text-foreground">FAQ</Link>
              <Link href="/login" className="transition-colors hover:text-foreground">Log in</Link>
            </nav>
          </div>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Instructly. Driving instructor software for UK ADIs and PDIs.
          </div>
        </div>
      </footer>

      {/* ───── STICKY MOBILE CTA ───── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-sm p-3 sm:hidden">
        <Link href="/signup" className={buttonVariants({ className: "w-full gap-2 text-base" })}>
          Start free in 2 minutes
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </main>
  );
}
