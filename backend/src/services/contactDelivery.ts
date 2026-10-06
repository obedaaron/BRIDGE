type EmailMessage = { to: string; subject: string; text: string };

export class ContactDeliveryNotConfiguredError extends Error {}

function required(name: string, message: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ContactDeliveryNotConfiguredError(message);
  return value;
}

async function sendEmail(message: EmailMessage) {
  const apiKey = required("RESEND_API_KEY", "Email verification is not configured yet");
  const from = required("RESEND_FROM", "Email verification is not configured yet");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
  });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) throw new Error(result.message || "Could not send email");
  return { messageId: result.id || null };
}

export async function sendVerificationEmail(input: { destination: string; code: string }) {
  const result = await sendEmail({
    to: input.destination,
    subject: "Your BRIDGE verification code",
    text: `Your BRIDGE email verification code is ${input.code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
  });
  return result.messageId;
}

export async function sendPasswordResetEmail(input: { destination: string; resetUrl: string }) {
  const result = await sendEmail({
    to: input.destination,
    subject: "Reset your BRIDGE password",
    text: `Use this link to reset your BRIDGE password: ${input.resetUrl}\n\nThis link expires in 30 minutes. If you did not request a password reset, you can ignore this email.`,
  });
  return result.messageId;
}
export async function sendVerificationSms(input: { destination: string; code: string }) {
  const baseUrl = required("TERMII_BASE_URL", "Phone verification is not configured yet").replace(/\/$/, "");
  const apiKey = required("TERMII_API_KEY", "Phone verification is not configured yet");
  const senderId = required("TERMII_SENDER_ID", "Phone verification is not configured yet");
  const channel = process.env.TERMII_CHANNEL === "generic" ? "generic" : "dnd";
  const response = await fetch(`${baseUrl}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      to: input.destination,
      from: senderId,
      sms: `Your BRIDGE verification code is ${input.code}. It expires in 10 minutes.`,
      type: "plain",
      channel,
    }),
  });
  const data = await response.json().catch(() => ({})) as { code?: string; message?: string; message_id?: string; message_id_str?: string };
  if (!response.ok || data.code !== "ok") throw new Error(data.message || "Could not send verification SMS");
  return data.message_id_str || data.message_id || null;
}
