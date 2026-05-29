import type { Metadata } from "next";
import { SeoArticle, FeatureList } from "../SeoArticle";

export const metadata: Metadata = {
  title: "Driving Instructor CRM — Manage Students Professionally | Instructly",
  description: "The CRM built for driving instructors. Track students, lesson history, skill progress, theory status, and test dates from one simple dashboard.",
};

export default function Page() {
  return (
    <SeoArticle
      title="The CRM Built for Driving Instructors"
      subtitle="Stop managing students through WhatsApp contacts and spreadsheets. Instructly gives you a professional student management system designed for ADIs."
    >
      <h2>What is a driving instructor CRM?</h2>
      <p>
        A CRM (Customer Relationship Management) system helps you keep track of every student — their contact details, lesson history, skill progress, theory test status, driving test dates, and private notes. Instead of scattered information across your phone, paper diary, and memory, everything is in one searchable place.
      </p>

      <h2>Why driving instructors need a CRM</h2>
      <p>
        When you have 15–30 active students, keeping track of everyone becomes impossible without a system. Common problems without a CRM:
      </p>
      <FeatureList items={[
        "Forgetting what you covered in the last lesson",
        "Not knowing which students have passed their theory",
        "Missing test dates and failing to prepare students",
        "Losing track of who has paid and who hasn&apos;t",
        "No way to show parents their child&apos;s progress",
        "Manually texting each student for confirmations",
      ]} />

      <h2>How Instructly&apos;s CRM works</h2>

      <h3>Student profiles</h3>
      <p>
        Each student has a detailed profile with their name, email, phone, status (active, test booked, passed, inactive), theory test status, driving test date, and private instructor notes. Search and filter students instantly.
      </p>

      <h3>Automatic student registration</h3>
      <p>
        Share your unique invite code with students. When they sign up, they automatically link to your account — no manual data entry. If you pre-added them by email, the system matches and links their profile seamlessly.
      </p>

      <h3>Lesson history and notes</h3>
      <p>
        Every lesson is recorded with a summary, homework, private notes, and skill ratings. You build a complete history for each student that follows their journey from first lesson to test day.
      </p>

      <h3>DVSA skill tracking</h3>
      <p>
        Rate students on 12 DVSA-aligned driving skills after each lesson. Track improvement over time with visual charts. Students and parents can see exactly where they stand — making your instruction more transparent and professional.
      </p>

      <h2>The result</h2>
      <p>
        With Instructly&apos;s CRM, you spend less time on admin and more time teaching. Students get a professional experience that drives referrals. Parents see progress reports that build trust. And you never forget a detail again.
      </p>
    </SeoArticle>
  );
}
