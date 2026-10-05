const PLATFORM_FEE_BPS = 700;

function wholeNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;
}

/**
 * BRIDGE commission is added to the vendor's full item + delivery amount.
 * Paystack's processing fee is internal and comes out of BRIDGE's commission;
 * it is never added as a separate buyer-visible line.
 */
export function calculateCheckoutAmounts(sellerAmountKobo: number) {
  const platformFeeKobo = Math.round(sellerAmountKobo * PLATFORM_FEE_BPS / 10_000);
  const percentBps = Math.min(9_999, wholeNumberEnv("PAYSTACK_PROCESSING_FEE_BPS", 150));
  const fixedKobo = wholeNumberEnv("PAYSTACK_PROCESSING_FEE_FIXED_KOBO", 10_000);
  const capKobo = wholeNumberEnv("PAYSTACK_PROCESSING_FEE_CAP_KOBO", 0);
  const buyerTotalKobo = sellerAmountKobo + platformFeeKobo;
  const uncappedFee = Math.ceil(buyerTotalKobo * percentBps / 10_000) + fixedKobo;
  const processingFeeKobo = capKobo > 0 ? Math.min(uncappedFee, capKobo) : uncappedFee;
  return {
    sellerAmountKobo,
    platformFeeKobo,
    processingFeeKobo,
    buyerTotalKobo,
    bridgeNetKobo: Math.max(0, platformFeeKobo - processingFeeKobo),
  };
}

export function checkoutPricingPolicy() {
  return {
    platformFeeBps: PLATFORM_FEE_BPS,
    processingFeeBps: Math.min(9_999, wholeNumberEnv("PAYSTACK_PROCESSING_FEE_BPS", 150)),
    processingFeeFixedKobo: wholeNumberEnv("PAYSTACK_PROCESSING_FEE_FIXED_KOBO", 10_000),
    processingFeeCapKobo: wholeNumberEnv("PAYSTACK_PROCESSING_FEE_CAP_KOBO", 0),
  };
}
