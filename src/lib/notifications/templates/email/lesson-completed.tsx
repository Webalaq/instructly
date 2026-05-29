import { Html, Head, Body, Container, Section, Text, Hr } from "@react-email/components";
import { colors, fontFamily } from "./styles";

interface LessonCompletedEmailProps {
  studentName: string;
  instructorName: string;
  date: string;
  actionUrl?: string;
}

export function LessonCompletedEmail({
  studentName,
  instructorName,
  date,
  actionUrl,
}: LessonCompletedEmailProps) {
  const appUrl = actionUrl ?? "https://app.instructly.co.uk/student/progress";

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: colors.background, fontFamily, margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 480, padding: "40px 20px", margin: "0 auto" }}>
          <Section
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 32,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: colors.textPrimary,
                margin: "0 0 16px",
              }}
            >
              Lesson Complete
            </Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, margin: "0 0 12px" }}>
              Hi {studentName},
            </Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, margin: "0 0 12px" }}>
              {instructorName} has added lesson notes and skill ratings for your session on {date}.
            </Text>
            <Text style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
              <a href={appUrl} style={{ color: colors.primary, fontWeight: 600 }}>
                Log in to Instructly
              </a>{" "}
              to view your progress.
            </Text>
          </Section>
          <Hr style={{ borderColor: colors.border, margin: "24px 0 12px" }} />
          <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", margin: 0 }}>
            Instructly — Driving lesson management
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
