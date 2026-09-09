import { pool } from "../db";

export const planFeatures = {
  free: { tier: "free", amountKobo: 0, currency: "NGN", label: "Free", listingLimit: 5, promotionLimit: 0, customization: "Basic logo and store details" },
  standard: { tier: "standard", amountKobo: Number(process.env.STANDARD_PLAN_AMOUNT_KOBO || 450000), currency: "NGN", label: "Standard", listingLimit: 20, promotionLimit: 2, customization: "Custom cover, colour and layout" },
  premium: { tier: "premium", amountKobo: Number(process.env.PREMIUM_PLAN_AMOUNT_KOBO || 800000), currency: "NGN", label: "Premium", listingLimit: null, promotionLimit: null, customization: "Full storefront customization" },
} as const;

export type PlanTier = keyof typeof planFeatures;

export async function getVendorPlan(vendorId: string) {
  const result = await pool.query(
    `select tier from vendor_subscriptions where vendor_id = $1 and status = 'active'
     and (current_period_ends_at is null or current_period_ends_at > now()) order by created_at desc limit 1`,
    [vendorId]
  );
  const tier = result.rows[0]?.tier as PlanTier | undefined;
  return planFeatures[tier || "free"];
}
