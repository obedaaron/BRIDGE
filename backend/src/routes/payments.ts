import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { initializePaystackPayment, isPaystackConfigured, isValidPaystackSignature, verifyPaystackPayment } from "../services/paystack";
import { activateSubscriptionByReference } from "./subscriptions";
import { assessOrderRisk, hasPaymentBlockingAlert } from "../services/fraud";
import { settleWalletWithdrawal } from "../services/wallet";

const router = Router();

async function recordSuccessfulPayment(reference: string) {
  const verification = await verifyPaystackPayment(reference);
  if (verification?.status !== "success" || !verification.metadata?.order_id) throw new Error("Payment has not completed");

  const expectedResult = await pool.query(
    "select buyer_total_kobo, amount_kobo, currency from marketplace_orders where id = $1 and payment_reference = $2",
    [verification.metadata.order_id, reference]
  );
  const expectedAmount = Number(expectedResult.rows[0]?.buyer_total_kobo) || Number(expectedResult.rows[0]?.amount_kobo);
  if (!expectedAmount || Number(verification.amount) !== expectedAmount || verification.currency !== expectedResult.rows[0]?.currency) throw new Error("Payment details do not match this order");

  const result = await pool.query(
    `update marketplace_orders set status = 'paid', paid_at = now(), updated_at = now()
     where id = $1 and payment_reference = $2 and status in ('accepted', 'payment_pending')
     returning *`,
    [verification.metadata.order_id, reference]
  );
  if (result.rows[0]) {
    await pool.query(
      "insert into marketplace_order_events (order_id, event_type, note) values ($1, 'paid', 'Paystack payment verified')",
      [result.rows[0].id]
    );
  }
  if (result.rows[0]) return result.rows[0];
  const existing = await pool.query("select * from marketplace_orders where id = $1 and payment_reference = $2", [verification.metadata.order_id, reference]);
  return existing.rows[0] || null;
}

router.post("/orders/:id/paystack", requireAuth, async (req, res) => {
  const orderResult = await pool.query(
    `select o.*, u.email from marketplace_orders o join users u on u.id = o.buyer_id
     where o.id = $1 and o.buyer_id = $2`,
    [req.params.id, req.user!.userId]
  );
  const order = orderResult.rows[0];
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "payment_pending" && order.payment_authorization_url && order.payment_reference) {
    return res.json({ authorizationUrl: order.payment_authorization_url, reference: order.payment_reference, resumed: true });
  }
  if (order.status !== "accepted") return res.status(409).json({ error: "This order is not ready for payment" });

  try {
    await assessOrderRisk(order);
    if (await hasPaymentBlockingAlert(order.id)) return res.status(409).json({ error: "This payment requires a BRIDGE safety review before it can proceed" });
    const amountKobo = Number(order.buyer_total_kobo) || Number(order.amount_kobo);
    const payment = await initializePaystackPayment({ orderId: order.id, email: order.email, amountKobo });
    await pool.query(
      `update marketplace_orders set status = 'payment_pending', payment_provider = 'paystack', payment_reference = $1,
       payment_authorization_url = $2, updated_at = now() where id = $3`,
      [payment.reference, payment.authorizationUrl, order.id]
    );
    await pool.query(
      "insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'payment_pending', 'Paystack checkout initialized')",
      [order.id, req.user!.userId]
    );
    res.json({ authorizationUrl: payment.authorizationUrl, reference: payment.reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not initialize payment";
    res.status(message === "Paystack is not configured" ? 503 : 502).json({ error: message });
  }
});

router.get("/paystack/verify/:reference", requireAuth, async (req, res) => {
  const ownsOrder = await pool.query(
    "select id from marketplace_orders where payment_reference = $1 and buyer_id = $2",
    [req.params.reference, req.user!.userId]
  );
  if (!ownsOrder.rows[0]) return res.status(404).json({ error: "Payment not found" });
  try { res.json({ order: await recordSuccessfulPayment(req.params.reference as string) }); }
  catch (err) { res.status(409).json({ error: err instanceof Error ? err.message : "Payment verification failed" }); }
});

router.get("/health", requireAuth, async (_req, res) => {
  // Safe for operational dashboards: never expose provider credentials.
  res.json({ provider: "paystack", configured: isPaystackConfigured(), webhookPath: "/payments/paystack/webhook" });
});

// Register this route with express.raw() before the JSON body parser.
export async function paystackWebhookHandler(req: import("express").Request, res: import("express").Response) {
  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody) || !isValidPaystackSignature(rawBody, req.header("x-paystack-signature"))) return res.sendStatus(401);
  try {
    const event = JSON.parse(rawBody.toString("utf8")) as { event?: string; data?: { reference?: string; transfer_code?: string; id?: string | number } };
    const reference = event.data?.transfer_code || event.data?.reference || String(event.data?.id || "");
    const eventKey = `${event.event || "unknown"}:${reference}`;
    const alreadyProcessed = await pool.query("select id from payment_webhook_events where provider = 'paystack' and event_key = $1 and processing_status = 'processed'", [eventKey]);
    if (alreadyProcessed.rows[0]) return res.sendStatus(200);
    if (event.event === "charge.success" && event.data?.reference) {
      await recordSuccessfulPayment(event.data.reference);
      await activateSubscriptionByReference(event.data.reference);
    }
    if (event.event === "transfer.success" && reference) {
      await pool.query("update marketplace_orders set payout_status = 'paid', updated_at = now() where payout_reference = $1 and payout_status = 'processing'", [reference]);
      await settleWalletWithdrawal(reference, true);
    }
    if ((event.event === "transfer.failed" || event.event === "transfer.reversed") && reference) {
      await pool.query("update marketplace_orders set payout_status = 'failed', updated_at = now() where payout_reference = $1 and payout_status = 'processing'", [reference]);
      await settleWalletWithdrawal(reference, false);
    }
    await pool.query(
      `insert into payment_webhook_events (provider, event_key, event_type, provider_reference, processing_status, processed_at)
       values ('paystack', $1, $2, $3, 'processed', now())
       on conflict (provider, event_key) do update set processing_status = 'processed', processed_at = now(), processing_error = null`,
      [eventKey, event.event || "unknown", reference || null]
    );
  } catch (err) {
    console.error("Paystack webhook processing failed", err);
    return res.sendStatus(500);
  }
  res.sendStatus(200);
}

export default router;
