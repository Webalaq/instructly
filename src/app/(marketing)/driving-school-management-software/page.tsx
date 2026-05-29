import type { Metadata } from "next";
import { SeoArticle, FeatureList } from "../SeoArticle";

export const metadata: Metadata = {
  title: "Driving School Management Software | Instructly",
  description: "Complete driving school management software for UK instructors. Manage bookings, students, lesson notes, progress tracking, and billing from one platform.",
};

export default function Page() {
  return (
    <SeoArticle
      title="Driving School Management Software"
      subtitle="Everything you need to run your driving school professionally — without the spreadsheet chaos."
    >
      <h2>What is driving school management software?</h2>
      <p>
        Driving school management software is a platform that handles the operational side of running a driving instruction business: scheduling lessons, managing students, recording progress, sending reminders, and tracking payments. It replaces the patchwork of paper diaries, WhatsApp groups, and spreadsheets that most independent instructors rely on.
      </p>

      <h2>The problem with manual management</h2>
      <p>
        Independent driving instructors typically spend 5–10 hours per week on admin tasks that add no value to their teaching:
      </p>
      <FeatureList items={[
        "Manually texting students to confirm tomorrow's lessons",
        "Updating paper diaries or phone calendars after every booking change",
        "Searching through WhatsApp message history to find a student's details",
        "Writing lesson notes on paper that get lost or become unreadable",
        "Having no way to show students or parents measurable progress",
        "Chasing late payments without a clear record of what's owed",
      ]} />

      <h2>What Instructly includes</h2>

      <h3>Booking management</h3>
      <p>
        Smart calendar with day, week, and month views. Automatic overlap prevention — the system blocks double bookings at the database level. Multi-hour lessons display correctly across time slots. Duration picker with auto-calculated end times makes booking fast.
      </p>

      <h3>Student CRM</h3>
      <p>
        Full student profiles with status tracking (active, test booked, passed, inactive), theory test progress, driving test dates, and private notes. Search and filter by name, email, or status. Students self-register with an invite code — no manual data entry.
      </p>

      <h3>Lesson notes and DVSA tracking</h3>
      <p>
        After each lesson, record a summary, set homework, add private notes, and rate 12 DVSA-aligned driving skills on a 1–5 scale. Students see their progress charts and skill trends — a professional experience that builds trust and drives referrals.
      </p>

      <h3>Automated reminders</h3>
      <p>
        WhatsApp reminders sent automatically 24 hours before every lesson. Cancellation and confirmation messages included. Delivery tracking shows which messages were sent and received. Most instructors see no-shows drop by 60–80%.
      </p>

      <h3>Billing</h3>
      <p>
        Stripe integration for subscription management. Per-lesson price tracking. Students see lesson costs on their dashboard. Instructors can track paid vs unpaid lessons at a glance.
      </p>

      <h2>Who is it for?</h2>
      <p>
        Instructly is built for independent UK driving instructors — both DVSA-approved ADIs and trainee PDIs. Whether you teach part-time with 10 students or full-time with 40+, the platform scales with you. Plans start at £19/month with a 14-day free trial.
      </p>
    </SeoArticle>
  );
}
