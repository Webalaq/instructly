import { Html, Head, Body, Container, Section, Text, Hr } from "@react-email/components";
import { colors, fontFamily } from "./styles";

interface RescheduleResponseEmailProps {
  studentName: string;
  status: "accepted" | "declined";
  newDate: string;
  newTime: string;
  oldDate: string;
  oldTime: string;
}

export function RescheduleResponseEmail({
  studentName,
  status,
  newDate,
  newTime,
  oldDate,
  oldTime,
}: RescheduleResponseEmailProps) {
  const accepted = status === "accepted";

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
                color: accepted ? colors.green : colors.orange,
                margin: "0 0 16px",
              }}
            >
              {accepted ? "Reschedule Accepted" : "Reschedule Declined"}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, margin: "0 0 20px" }}>
              Hi {studentName},{" "}
              {accepted
                ? `your reschedule request has been accepted. Your lesson is now on ${newDate} at ${newTime}.`
                : `your reschedule request was declined. Your original lesson time on ${oldDate} at ${oldTime} remains unchanged.`}
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
