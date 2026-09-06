const PLATFORM_FEE_BPS = 500;

function wholeNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;
}

/**
 * Returns the buyer-facing charge and the amounts BRIDGE must account for.
 *
 * The processor fee is configurable because payment-provider pricing and caps
 * can change. It is grossed up so the provider's percentage is also covered,
 * leaving the seller's listed/agreed amount untouched.
 */
export function calculateCheckoutAmounts(sellerAmountKobo: number) {
  const platformFeeKobo = Math.round(sellerAmountKobo * PLATFORM_FEE_BPS / 10_000);
  const percentBps = Math.min(9_999, wholeNumberEnv("PAYSTACK_PROCESSING_FEE_BPS", 150));
  const fixedKobo = wholeNumberEnv("PAYSTACK_PROCESSING_FEE_FIXED_KOBO", 0);
  const capKobo = wholeNumberEnv("PAYSTACK_PROCESSING_FEE_CAP_KOBO", 0);
  const protectedAmountKobo = sellerAmountKobo + platformFeeKobo;
  const uncappedFee = Math.ceil((protectedAmountKobo + fixedKobo) * percentBps / (10_000 - percentBps)) + fixedKobo;
  const processingFeeKobo = capKobo > 0 ? Math.min(uncappedFee, capKobo) : uncappedFee;
  return {
    sellerAmountKobo,
    platformFeeKobo,
    processingFeeKobo,
    buyerTotalKobo: protectedAmountKobo + processingFeeKobo,
  };
}

export function checkoutPricingPolicy() {
  return {
    platformFeeBps: PLATFORM_FEE_BPS,
    processingFeeBps: Math.min(9_999, wholeNumberEnv("PAYSTACK_PROCESSING_FEE_BPS", 150)),
    processingFeeFixedKobo: wholeNumberEnv("PAYSTACK_PROCESSING_FEE_FIXED_KOBO", 0),
    processingFeeCapKobo: wholeNumberEnv("PAYSTACK_PROCESSING_FEE_CAP_KOBO", 0),
  };
}
