import { Router } from "express";
import { pool } from "../db";
import { requireAdmin } from "../middleware/admin";
import { createPaystackRefund } from "../services/paystack";
import { initiatePaystackTransfer } from "../services/paystack";
import { hasPayoutBlockingAlert } from "../services/fraud";

const router = Router();

router.get("/verifications", requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  const result = await pool.query(
    `select vv.*, v.business_name, v.slug
     from vendor_verifications vv
     join vendors v on v.id = vv.vendor_id
     where ($1::text is null or vv.status = $1)
     order by vv.created_at asc`,
    [status || null]
  );
  res.json({ verifications: result.rows });
});

router.patch("/verifications/:id", requireAdmin, async (req, res) => {
  const { status } = req.body;
  const reviewNote = typeof req.body.reviewNote === "string" ? req.body.reviewNote.trim() : "";
  const checklist = req.body.checklist;
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  if (reviewNote.length < 5 || reviewNote.length > 1000) return res.status(400).json({ error: "Add a review note of 5 to 1000 characters" });
  if (checklist !== undefined && (typeof checklist !== "object" || checklist === null || Array.isArray(checklist))) return res.status(400).json({ error: "Invalid review checklist" });

  const result = await pool.query(
    `update vendor_verifications set status = $1, reviewed_by = $2, reviewed_at = now(), review_note = $3, review_checklist = $4
     where id = $5 and status = 'pending' returning *`,
    [status, req.user!.userId, reviewNote, checklist ? JSON.stringify(checklist) : null, req.params.id]
  );
  const verification = result.rows[0];
  if (!verification) return res.status(404).json({ error: "Not found" });

  if (status === "approved") {
    const badgeMap: Record<string, string> = {
      identity: "identity_verified",
      kyc: "identity_verified",
      business: "business_verified",
      kyb: "business_verified",
      location: "location_verified",
      skill: "skill_verified",
      bridge: "bridge_verified",
    };
    await pool.query("update vendors set verification_status = $1 where id = $2", [
      badgeMap[verification.type], verification.vendor_id,
    ]);
  }

  res.json({ verification });
});

router.get("/vendors", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `select id, business_name, slug, city, state, verification_status, subscription_tier, is_published, logo_url, created_at
     from vendors order by created_at desc`
  );
  res.json({ vendors: result.rows });
});

router.patch("/vendors/:id/publish", requireAdmin, async (req, res) => {
  const result = await pool.query(
    "update vendors set is_published = not is_published where id = $1 returning *",
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Vendor not found" });
  res.json({ vendor: result.rows[0] });
});

router.get("/orders", requireAdmin, async (_req, res) => {
  const result = await pool.query(
    `select o.*, v.business_name as vendor_name, u.full_name as buyer_name
     from marketplace_orders o join vendors v on v.id = o.vendor_id join users u on u.id = o.buyer_id
     order by o.created_at desc`
  );
  res.json({ orders: result.rows });
});

router.get("/wallet-withdrawals", requireAdmin, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "requested";
  const result = await pool.query(
    `select w.*, v.business_name, p.bank_name, p.account_name, p.account_last4
     from vendor_wallet_withdrawals w join vendors v on v.id = w.vendor_id
     join vendor_payout_accounts p on p.id = w.payout_account_id
     where ($1::text is null or w.status = $1) order by w.requested_at asc`,
    [status === "all" ? null : status]
  );
  res.json({ withdrawals: result.rows });
});

router.post("/wallet-withdrawals/:id/release", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `select w.*, p.recipient_code from vendor_wallet_withdrawals w
     join vendor_payout_accounts p on p.id = w.payout_account_id and p.is_active = true
     where w.id = $1`, [req.params.id]
  );
  const withdrawal = result.rows[0];
  if (!withdrawal) return res.status(404).json({ error: "Withdrawal or active payout account not found" });
  if (withdrawal.status !== "requested") return res.status(409).json({ error: "This withdrawal is not ready for release" });
  const risk = await pool.query(
    `select a.id from marketplace_fraud_alerts a join marketplace_orders o on o.id = a.order_id
     where o.vendor_id = $1 and a.status = 'open' and a.severity in ('high', 'critical') limit 1`,
    [withdrawal.vendor_id]
  );
  if (risk.rows[0]) return res.status(409).json({ error: "Resolve the vendor's high-risk fraud alerts before releasing wallet funds" });
  const reference = `bridge-wallet-${String(withdrawal.id).replace(/[^a-z0-9-]/gi, "").toLowerCase()}`;
  const claim = await pool.query("update vendor_wallet_withdrawals set status = 'processing', processed_by = $1, provider_reference = $2 where id = $3 and status = 'requested' returning *", [req.user!.userId, reference, withdrawal.id]);
  if (!claim.rows[0]) return res.status(409).json({ error: "This withdrawal is already being processed" });
  try {
    const transfer = await initiatePaystackTransfer({ recipientCode: withdrawal.recipient_code, amountKobo: Number(withdrawal.amount_kobo), reference, reason: `BRIDGE wallet withdrawal ${withdrawal.id}` });
    const providerReference = transfer.transferCode || transfer.reference;
    const updated = await pool.query("update vendor_wallet_withdrawals set provider_reference = $1 where id = $2 returning *", [providerReference, withdrawal.id]);
    res.json({ withdrawal: updated.rows[0], transfer });
  } catch (err) {
    await pool.query("update vendor_wallet_withdrawals set status = 'on_hold', failure_reason = $1 where id = $2 and status = 'processing'", [err instanceof Error ? err.message : "Transfer initiation failed", withdrawal.id]);
    res.status(502).json({ error: "Withdrawal is on hold for reconciliation before it can be retried" });
  }
});

router.get("/fraud-alerts", requireAdmin, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "open";
  const result = await pool.query(
    `select a.*, o.title as order_title, o.amount_kobo, o.buyer_total_kobo, v.business_name as vendor_name, u.full_name as buyer_name
     from marketplace_fraud_alerts a
     join marketplace_orders o on o.id = a.order_id
     join vendors v on v.id = o.vendor_id
     join users u on u.id = o.buyer_id
     where ($1::text is null or a.status = $1)
     order by case a.severity when 'critical' then 1 when 'high' then 2 when 'medium' then 3 else 4 end, a.created_at asc`,
    [status === "all" ? null : status]
  );
  res.json({ alerts: result.rows });
});

router.patch("/fraud-alerts/:id", requireAdmin, async (req, res) => {
  const status = req.body.status;
  const note = typeof req.body.note === "string" ? req.body.note.trim() : "";
  if (!["resolved", "dismissed"].includes(status) || note.length < 5 || note.length > 2000) return res.status(400).json({ error: "Provide a valid resolution and review note" });
  const result = await pool.query(
    `update marketplace_fraud_alerts set status = $1, resolution_note = $2, resolved_by = $3, resolved_at = now()
     where id = $4 and status = 'open' returning *`,
    [status, note, req.user!.userId, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Open fraud alert not found" });
  await pool.query("insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'fraud_reviewed', $3)", [result.rows[0].order_id, req.user!.userId, `Fraud alert ${status}: ${note}`]);
  res.json({ alert: result.rows[0] });
});

router.post("/orders/:id/refund", requireAdmin, async (req, res) => {
  const orderResult = await pool.query("select * from marketplace_orders where id = $1", [req.params.id]);
  const order = orderResult.rows[0];
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (!["paid", "in_progress", "delivered", "disputed"].includes(order.status)) return res.status(409).json({ error: "This order cannot be refunded" });
  if (!order.payment_reference) return res.status(409).json({ error: "No payment reference exists for this order" });
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "BRIDGE dispute resolution";
  try {
    const refund = await createPaystackRefund(order.payment_reference, Number(order.buyer_total_kobo) || Number(order.amount_kobo), reason);
    const updated = await pool.query(
      "update marketplace_orders set status = 'refunded', refunded_at = now(), refund_reference = $1, payout_status = 'not_ready', updated_at = now() where id = $2 returning *",
      [refund.reference, order.id]
    );
    await pool.query("insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'refunded', $3)", [order.id, req.user!.userId, `Paystack refund ${refund.reference}: ${reason}`]);
    res.json({ order: updated.rows[0], refund });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Could not initiate refund" });
  }
});

router.post("/orders/:id/release-payout", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `select o.*, p.recipient_code from marketplace_orders o
     join vendor_payout_accounts p on p.vendor_id = o.vendor_id and p.is_active = true
     where o.id = $1`, [req.params.id]
  );
  const order = result.rows[0];
  if (!order) return res.status(404).json({ error: "A completed order with an active seller payout account is required" });
  if (order.status !== "completed" || order.payout_status !== "pending") return res.status(409).json({ error: "This payout is not ready for release" });
  if (await hasPayoutBlockingAlert(order.id)) return res.status(409).json({ error: "Resolve high-risk alerts before releasing this payout" });
  const reference = `bridge-payout-${String(order.id).replace(/[^a-z0-9-]/gi, "").toLowerCase()}`;
  try {
    const claim = await pool.query("update marketplace_orders set payout_status = 'processing', updated_at = now() where id = $1 and status = 'completed' and payout_status = 'pending' returning id", [order.id]);
    if (!claim.rows[0]) return res.status(409).json({ error: "This payout is already being processed" });
    const transfer = await initiatePaystackTransfer({ recipientCode: order.recipient_code, amountKobo: Number(order.seller_amount_kobo), reference, reason: `BRIDGE order ${order.id}` });
    const updated = await pool.query("update marketplace_orders set payout_status = 'processing', payout_reference = $1, updated_at = now() where id = $2 returning *", [transfer.transferCode || transfer.reference, order.id]);
    await pool.query("insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'payout_released', $3)", [order.id, req.user!.userId, `Paystack transfer ${transfer.transferCode || transfer.reference}`]);
    res.json({ order: updated.rows[0], transfer });
  } catch (err) { await pool.query("update marketplace_orders set payout_status = 'on_hold', updated_at = now() where id = $1 and payout_status = 'processing'", [order.id]); res.status(502).json({ error: "Payout needs manual reconciliation before it can be retried" }); }
});

export default router;
