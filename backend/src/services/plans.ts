import { pool } from "../db";

export const planFeatures = {
  free: { tier: "free", amountKobo: 0, currency: "NGN", label: "Free", listingLimit: null, promotionLimit: 0, customization: "Full access to core storefront and listing tools" },
  standard: { tier: "standard", amountKobo: Number(process.env.STANDARD_PLAN_AMOUNT_KOBO || 450000), currency: "NGN", label: "Standard", listingLimit: 20, promotionLimit: 2, customization: "Custom cover, colour and layout" },
  premium: { tier: "premium", amountKobo: Number(process.env.PREMIUM_PLAN_AMOUNT_KOBO || 800000), currency: "NGN", label: "Premium", listingLimit: null, promotionLimit: null, customization: "Full storefront customization" },
} as const;

export type PlanTier = keyof typeof planFeatures;

export async function getVendorPlan(_vendorId: string) {
  return planFeatures.free;
}

