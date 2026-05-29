import { Html, Head, Body, Container, Section, Text, Hr } from "@react-email/components";
import { colors, fontFamily } from "./styles";

interface WelcomeEmailProps {
  studentName: string;
  instructorName: string;
}

export function WelcomeEmail({ studentName, instructorName }: WelcomeEmailProps) {
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
              Welcome to Instructly!
            </Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, margin: "0 0 12px" }}>
              Hi {studentName},
            </Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, margin: "0 0 12px" }}>
              You&apos;re all set up. You&apos;re connected with {instructorName}.
            </Text>
            <Text style={{ fontSize: 15, color: colors.textMuted, margin: "0 0 12px" }}>
              In the Instructly app you&apos;ll be able to view your upcoming lessons, track your
              progress across DVSA skill categories, and receive reminders before each session.
            </Text>
            <Text style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
              Your instructor will add lesson notes and skill ratings after each lesson so you can
              follow your improvement over time.
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
