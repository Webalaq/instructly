import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { CITIES } from "./cities";

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) return {};
  return {
    title: `Driving Instructor Software ${city.name} | Instructly`,
    description: `The best driving instructor software for ADIs and PDIs in ${city.name}. Manage bookings, students, DVSA progress tracking, and WhatsApp reminders. Try free for 14 days.`,
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) notFound();

  const features = [
    `Smart calendar with conflict prevention for ${city.name} instructors`,
    "Student CRM with invite codes and self-registration",
    "12 DVSA-aligned skill ratings with progress charts",
    "Automated WhatsApp reminders — reduce no-shows by 80%",
    "After-lesson notes with homework and private observations",
    "UK postcode teaching areas and Europe/London scheduling",
    `Stripe billing built for ${city.name}-based driving businesses`,
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <header className="mb-12">
        <div className="mb-4 inline-flex rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          {city.region}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Driving Instructor Software in {city.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The all-in-one platform for {city.name} driving instructors. Manage bookings, track student progress,
          send automated reminders, and run your business professionally — from £19/month.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Why {city.name} instructors choose Instructly</h2>
        <p className="text-muted-foreground mb-6">
          Driving instructors in {city.name} and across {city.region} face the same challenges: no-shows, scattered admin,
          and no way to show students measurable progress. Instructly solves all of these with one simple platform
          built specifically for UK ADIs and PDIs.
        </p>

        <div className="space-y-3">
          {features.map((f) => (
            <div key={f} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How it works for {city.name} instructors</h2>
        <div className="space-y-6 text-muted-foreground">
          <p>
            Sign up in under 5 minutes. Set your hourly rate, working hours, and the {city.name} postcodes
            where you teach. The system generates your unique invite code — share it with students and
            they self-register on their own device.
          </p>
          <p>
            Book lessons from your phone between pickups. The smart calendar prevents double bookings
            automatically. 24 hours before each lesson, your student gets a WhatsApp reminder — no
            texting needed. After the lesson, rate their skills in 30 seconds and they see their
            updated progress chart instantly.
          </p>
          <p>
            Parents in {city.name} love the DVSA-aligned progress tracking. Students can view their
            skill ratings, lesson history, and homework from their own dashboard. This level of
            professionalism drives referrals and helps you build a reputation in {city.region}.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { name: "Basic", price: 19, desc: "Up to 20 students" },
            { name: "Standard", price: 29, desc: "Unlimited students", popular: true },
            { name: "Premium", price: 49, desc: "WhatsApp automation" },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-xl border p-4 text-center ${plan.popular ? "border-primary ring-1 ring-primary" : ""}`}>
              <div className="text-sm font-medium">{plan.name}</div>
              <div className="mt-1 text-2xl font-bold">£{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <div className="mt-1 text-xs text-muted-foreground">{plan.desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">14-day free trial on all plans. No card required.</p>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-bold">Ready to modernise your {city.name} driving school?</h2>
        <p className="mt-2 text-muted-foreground">Join instructors across {city.region} who save hours every week.</p>
        <Link href="/signup" className={buttonVariants({ size: "lg", className: "mt-6 gap-2" })}>
          Start free trial <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      {/* Other cities */}
      <div className="mt-16">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Driving instructor software in other cities</h3>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter((c) => c.slug !== city.slug).slice(0, 12).map((c) => (
            <Link
              key={c.slug}
              href={`/driving-instructor-software/${c.slug}`}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
