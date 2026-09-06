const DOJAH_BASE_URL = process.env.DOJAH_BASE_URL || "https://api.dojah.io";

export class KycProviderNotConfiguredError extends Error {}
export class KycProviderRejectedError extends Error {}

/**
 * Verifies a NIN with Dojah and returns only data safe for BRIDGE to retain.
 * The raw NIN and provider response must never be logged or stored in our DB.
 */
export async function verifyNinWithDojah(nin: string) {
  const appId = process.env.DOJAH_APP_ID;
  const secret = process.env.DOJAH_SECRET_KEY;
  if (!appId || !secret) throw new KycProviderNotConfiguredError("Dojah is not configured yet");

  const response = await fetch(`${DOJAH_BASE_URL}/api/v1/kyc/nin?nin=${encodeURIComponent(nin)}`, {
    headers: { AppId: appId, Authorization: secret },
  });
  if (!response.ok) throw new KycProviderRejectedError("We could not verify that NIN. Check it and try again.");

  const data = await response.json() as { entity?: { id?: string; nin?: string; vnin?: string } };
  const reference = data.entity?.id || data.entity?.nin || data.entity?.vnin;
  if (!reference) throw new KycProviderRejectedError("The identity provider did not return a verification result");
  return { provider: "dojah", providerReference: `nin:${reference.slice(-8)}` };
}

export async function sendDojahOtp(input: { destination: string; channel: "sms" | "email"; code: string }) {
  const appId = process.env.DOJAH_APP_ID;
  const secret = process.env.DOJAH_SECRET_KEY;
  const senderId = process.env.DOJAH_SENDER_ID;
  if (!appId || !secret || !senderId) throw new KycProviderNotConfiguredError("Contact verification is being configured");
  const response = await fetch(`${DOJAH_BASE_URL}/api/v1/messaging/otp`, {
    method: "POST", headers: { AppId: appId, Authorization: secret, "Content-Type": "application/json" },
    body: JSON.stringify({ sender_id: senderId, destination: input.destination, ...(input.channel === "email" ? { email: input.destination } : {}), channel: input.channel, expiry: 10, length: 6, otp: Number(input.code) }),
  });
  const data = await response.json() as { entity?: { reference_id?: string }; message?: string };
  if (!response.ok) throw new Error(data.message || "Could not send verification code");
  return data.entity?.reference_id || null;
}
