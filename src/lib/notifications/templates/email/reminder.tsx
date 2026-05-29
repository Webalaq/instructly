import { Html, Head, Body, Container, Section, Text, Hr } from "@react-email/components";
import { colors, fontFamily } from "./styles";

interface ReminderEmailProps {
  studentName: string;
  instructorName: string;
  date: string;
  time: string;
}

export function ReminderEmail({ studentName, instructorName, date, time }: ReminderEmailProps) {
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
              Lesson Tomorrow
            </Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, margin: "0 0 20px" }}>
              Hi {studentName}, just a reminder that you have a driving lesson tomorrow.
            </Text>
            <Section
              style={{
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: "20px 24px",
                border: `1px solid ${colors.border}`,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  margin: "0 0 8px",
                }}
              >
                {date}
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: colors.primary,
                  margin: "0 0 8px",
                }}
              >
                {time}
              </Text>
              <Text style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
                with {instructorName}
              </Text>
            </Section>
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
