import { Html, Head, Body, Container, Section, Text, Hr } from "@react-email/components";
import { colors, fontFamily } from "./styles";

interface RescheduleRequestEmailProps {
  studentName: string;
  requesterName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  actionUrl?: string;
}

export function RescheduleRequestEmail({
  studentName,
  requesterName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  actionUrl,
}: RescheduleRequestEmailProps) {
  const appUrl = actionUrl ?? "https://app.instructly.co.uk/student/requests";

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
              Reschedule Request
            </Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, margin: "0 0 20px" }}>
              Hi {studentName}, {requesterName} wants to reschedule your lesson.
            </Text>
            <Section
              style={{
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: "20px 24px",
                border: `1px solid ${colors.border}`,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  margin: "0 0 8px",
                }}
              >
                Current
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  margin: "0 0 4px",
                }}
              >
                {oldDate}
              </Text>
              <Text style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{oldTime}</Text>
            </Section>
            <Section
              style={{
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: "20px 24px",
                border: `1px solid ${colors.border}`,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.green,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  margin: "0 0 8px",
                }}
              >
                Proposed
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  margin: "0 0 4px",
                }}
              >
                {newDate}
              </Text>
              <Text style={{ fontSize: 15, color: colors.green, margin: 0 }}>{newTime}</Text>
            </Section>
            <Text style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
              <a href={appUrl} style={{ color: colors.primary, fontWeight: 600 }}>
                Log in to Instructly
              </a>{" "}
              to accept or decline.
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
