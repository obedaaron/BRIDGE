import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { initializePaystackSubscription, verifyPaystackPayment } from "../services/paystack";
import { planFeatures } from "../services/plans";

const router = Router();
const plans = {
  free: planFeatures.free,
  standard: { ...planFeatures.standard, planCode: process.env.PAYSTACK_STANDARD_PLAN_CODE },
  premium: { ...planFeatures.premium, planCode: process.env.PAYSTACK_PREMIUM_PLAN_CODE },
} as const;

async function ownVendor(userId: string) { const result = await pool.query("select id, subscription_tier from vendors where user_id = $1", [userId]); return result.rows[0] || null; }

router.get("/plans", (_req, res) => res.json({ plans: Object.values(plans).map((plan) => ({ tier: plan.tier, amountKobo: plan.amountKobo, label: plan.label, listingLimit: plan.listingLimit, promotionLimit: plan.promotionLimit, customization: plan.customization })) }));

router.get("/mine", requireAuth, async (req, res) => {
  const vendor = await ownVendor(req.user!.userId); if (!vendor) return res.status(404).json({ error: "Create your store first" });
  const result = await pool.query("select tier, status, amount_kobo, currency, started_at, current_period_ends_at, created_at from vendor_subscriptions where vendor_id = $1 order by created_at desc limit 1", [vendor.id]);
  res.json({ tier: vendor.subscription_tier || "free", subscription: result.rows[0] || null });
});

router.post("/checkout", requireAuth, async (req, res) => {
  const tier = req.body.tier as "standard" | "premium";
  const plan = plans[tier];
  if (!plan || !plan.planCode) return res.status(503).json({ error: "This plan is not configured yet" });
  const vendor = await ownVendor(req.user!.userId); if (!vendor) return res.status(404).json({ error: "Create your store first" });
  const userResult = await pool.query("select email from users where id = $1", [req.user!.userId]);
  try {
    const payment = await initializePaystackSubscription({ email: userResult.rows[0].email, amountKobo: plan.amountKobo, planCode: plan.planCode, vendorId: vendor.id });
    await pool.query("insert into vendor_subscriptions (vendor_id, tier, amount_kobo, payment_reference, provider_plan_code) values ($1, $2, $3, $4, $5)", [vendor.id, tier, plan.amountKobo, payment.reference, plan.planCode]);
    res.json(payment);
  } catch (err) { res.status(502).json({ error: err instanceof Error ? err.message : "Could not start subscription checkout" }); }
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
