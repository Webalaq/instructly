import { Html, Head, Body, Container, Section, Text, Hr } from "@react-email/components";
import { colors, fontFamily } from "./styles";

interface CancellationEmailProps {
  studentName: string;
  instructorName: string;
  date: string;
  time: string;
}

export function CancellationEmail({
  studentName,
  instructorName,
  date,
  time,
}: CancellationEmailProps) {
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
              Lesson Cancelled
            </Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, margin: "0 0 20px" }}>
              Hi {studentName}, your lesson with {instructorName} on {date} at {time} has been
              cancelled.
            </Text>
            <Text style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
              Please contact your instructor to reschedule.
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
