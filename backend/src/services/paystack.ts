import crypto from "crypto";

const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";

type PaystackTransaction = {
  status: boolean;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    authorization_url?: string;
    metadata?: { order_id?: string };
  };
  message?: string;
};

type PaystackRefund = {
  status: boolean;
  data?: { id?: number | string; status?: string };
  message?: string;
};

type PaystackResult<T> = { status: boolean; data?: T; message?: string };

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack is not configured");
  return key;
}

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

async function paystackFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json() as PaystackTransaction;
  if (!response.ok || !data.status) throw new Error(data.message || "Paystack request failed");
  return data;
}

export async function initializePaystackPayment({ orderId, email, amountKobo }: { orderId: string; email: string; amountKobo: number }) {
  const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${process.env.FRONTEND_URL || "http://localhost:5173"}/orders`;
  const result = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: String(amountKobo),
      currency: "NGN",
      callback_url: callbackUrl,
      metadata: { order_id: orderId },
    }),
  });
  if (!result.data?.reference || !result.data.authorization_url) throw new Error("Paystack did not return a checkout link");
  return { reference: result.data.reference, authorizationUrl: result.data.authorization_url };
}

export async function initializePaystackSubscription(input: { email: string; amountKobo: number; planCode: string; vendorId: string }) {
  const callbackUrl = process.env.PAYSTACK_SUBSCRIPTION_CALLBACK_URL || `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard/plans`;
  const result = await paystackFetch("/transaction/initialize", { method: "POST", body: JSON.stringify({ email: input.email, amount: String(input.amountKobo), currency: "NGN", plan: input.planCode, callback_url: callbackUrl, metadata: { kind: "vendor_subscription", vendor_id: input.vendorId } }) });
  if (!result.data?.reference || !result.data.authorization_url) throw new Error("Paystack did not return a subscription checkout link");
  return { reference: result.data.reference, authorizationUrl: result.data.authorization_url };
}

export async function verifyPaystackPayment(reference: string) {
  const result = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
  return result.data;
}

export async function createPaystackRefund(reference: string, amountKobo: number, reason: string) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: reference, amount: amountKobo, currency: "NGN", customer_note: reason, merchant_note: "BRIDGE protected-order refund" }),
  });
  const data = await response.json() as PaystackRefund;
  if (!response.ok || !data.status || !data.data?.id) throw new Error(data.message || "Paystack refund request failed");
  return { reference: String(data.data.id), status: data.data.status || "pending" };
}

async function transferFetch<T>(path: string, body?: unknown) {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json() as PaystackResult<T>;
  if (!response.ok || !data.status || !data.data) throw new Error(data.message || "Paystack transfer request failed");
  return data.data;
}

export async function listPaystackBanks() {
  return transferFetch<{ name: string; code: string; active: boolean }[]>("/bank?country=nigeria&currency=NGN&perPage=100");
}

export async function createPaystackTransferRecipient(input: { name: string; accountNumber: string; bankCode: string }) {
  const data = await transferFetch<{ recipient_code?: string; details?: { account_name?: string; bank_name?: string } }>("/transferrecipient", { type: "nuban", name: input.name, account_number: input.accountNumber, bank_code: input.bankCode, currency: "NGN" });
  if (!data.recipient_code) throw new Error("Paystack did not return a payout recipient");
  return { recipientCode: data.recipient_code, accountName: data.details?.account_name || input.name, bankName: data.details?.bank_name || null };
}

export async function initiatePaystackTransfer(input: { recipientCode: string; amountKobo: number; reference: string; reason: string }) {
  const data = await transferFetch<{ transfer_code?: string; status?: string; reference?: string }>("/transfer", { source: "balance", recipient: input.recipientCode, amount: input.amountKobo, reference: input.reference, reason: input.reason, currency: "NGN" });
  if (!data.transfer_code && !data.reference) throw new Error("Paystack did not return a transfer reference");
  return { reference: data.reference || input.reference, transferCode: data.transfer_code || null, status: data.status || "pending" };
}

export function isValidPaystackSignature(rawBody: Buffer, signature: string | undefined) {
  if (!signature) return false;
  if (!isPaystackConfigured()) return false;
  const expected = crypto.createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}
