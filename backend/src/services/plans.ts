import { pool } from "../db";

export const planFeatures = {
  free: { tier: "free", amountKobo: 0, currency: "USD", label: "Free", listingLimit: 10, promotionLimit: 0, customization: "Basic storefront" },
  // The database column keeps its legacy name, but this value is always the
  // provider's minor unit (cents for USD, kobo for NGN).
  standard: { tier: "standard", amountKobo: Number(process.env.STANDARD_PLAN_AMOUNT_MINOR || 4500), currency: process.env.SUBSCRIPTION_CURRENCY || "USD", label: "Standard", listingLimit: 50, promotionLimit: 2, customization: "Expanded storefront" },
  premium: { tier: "premium", amountKobo: Number(process.env.PREMIUM_PLAN_AMOUNT_MINOR || 8000), currency: process.env.SUBSCRIPTION_CURRENCY || "USD", label: "Premium", listingLimit: null, promotionLimit: null, customization: "Full storefront" },
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
