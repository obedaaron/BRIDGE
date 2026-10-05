import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { verifyPaystackPayment } from "../services/paystack";
import { planFeatures } from "../services/plans";

const router = Router();
async function ownVendor(userId: string) { const result = await pool.query("select id, subscription_tier from vendors where user_id = $1", [userId]); return result.rows[0] || null; }

router.get("/plans", (_req, res) => res.json({ plans: [{ tier: "free", amountKobo: 0, currency: "NGN", label: "Free", listingLimit: null, promotionLimit: 0, customization: "Full access to core storefront and listing tools" }] }));

router.get("/mine", requireAuth, async (req, res) => {
  const vendor = await ownVendor(req.user!.userId); if (!vendor) return res.status(404).json({ error: "Create your store first" });
  const result = await pool.query("select tier, status, amount_kobo, currency, started_at, current_period_ends_at, created_at from vendor_subscriptions where vendor_id = $1 order by created_at desc limit 1", [vendor.id]);
  res.json({ tier: vendor.subscription_tier || "free", subscription: result.rows[0] || null });
});

router.post("/checkout", requireAuth, async (_req, res) => {
  res.status(410).json({ error: "Paid store plans are paused. All core listings are free for now." });
});

router.get("/verify/:reference", requireAuth, async (req, res) => {
  const subscriptionResult = await pool.query("select s.*, v.user_id from vendor_subscriptions s join vendors v on v.id = s.vendor_id where s.payment_reference = $1", [req.params.reference as string]);
  const subscription = subscriptionResult.rows[0];
  if (!subscription || subscription.user_id !== req.user!.userId) return res.status(404).json({ error: "Subscription payment not found" });
  try {
    const payment = await verifyPaystackPayment(req.params.reference as string);
    if (payment?.status !== "success") return res.status(409).json({ error: "Payment has not completed" });
    const updated = await pool.query("update vendor_subscriptions set status = 'active', started_at = now(), current_period_ends_at = now() + interval '1 month', updated_at = now() where id = $1 returning *", [subscription.id]);
    await pool.query("update vendors set subscription_tier = $1 where id = $2", [subscription.tier, subscription.vendor_id]);
    res.json({ subscription: updated.rows[0] });
  } catch (err) { res.status(409).json({ error: err instanceof Error ? err.message : "Could not verify subscription" }); }
});

export async function activateSubscriptionByReference(reference: string) {
  const result = await pool.query("update vendor_subscriptions set status = 'active', started_at = coalesce(started_at, now()), current_period_ends_at = now() + interval '1 month', updated_at = now() where payment_reference = $1 and status = 'pending' returning *", [reference]);
  if (result.rows[0]) await pool.query("update vendors set subscription_tier = $1 where id = $2", [result.rows[0].tier, result.rows[0].vendor_id]);
}

export default router;
