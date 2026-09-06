import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

async function ownVendor(userId: string) {
  const result = await pool.query("select id from vendors where user_id = $1", [userId]);
  return result.rows[0]?.id as string | undefined;
}

router.get("/mine", requireAuth, async (req, res) => {
  const vendorId = await ownVendor(req.user!.userId);
  if (!vendorId) return res.status(404).json({ error: "Create a store to access a wallet" });
  const [walletResult, entriesResult, withdrawalsResult] = await Promise.all([
    pool.query("select available_kobo, pending_withdrawal_kobo, updated_at from vendor_wallets where vendor_id = $1", [vendorId]),
    pool.query("select entry_type, amount_kobo, created_at, order_id, withdrawal_id from vendor_wallet_transactions where vendor_id = $1 order by created_at desc limit 30", [vendorId]),
    pool.query("select id, amount_kobo, status, requested_at, processed_at, failure_reason from vendor_wallet_withdrawals where vendor_id = $1 order by requested_at desc limit 20", [vendorId]),
  ]);
  res.json({ wallet: walletResult.rows[0] || { available_kobo: 0, pending_withdrawal_kobo: 0 }, transactions: entriesResult.rows, withdrawals: withdrawalsResult.rows });
});

router.post("/withdrawals", requireAuth, async (req, res) => {
  const vendorId = await ownVendor(req.user!.userId);
  const amountKobo = Number(req.body.amountKobo);
  if (!vendorId) return res.status(404).json({ error: "Create a store to access a wallet" });
  if (!Number.isSafeInteger(amountKobo) || amountKobo < 10000) return res.status(400).json({ error: "Minimum withdrawal is ₦100" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const account = await client.query("select id from vendor_payout_accounts where vendor_id = $1 and is_active = true for update", [vendorId]);
    if (!account.rows[0]) throw new Error("Add a verified payout account before requesting a withdrawal");
    await client.query("insert into vendor_wallets (vendor_id) values ($1) on conflict (vendor_id) do nothing", [vendorId]);
    const reserved = await client.query("update vendor_wallets set available_kobo = available_kobo - $1, pending_withdrawal_kobo = pending_withdrawal_kobo + $1, updated_at = now() where vendor_id = $2 and available_kobo >= $1 returning *", [amountKobo, vendorId]);
    if (!reserved.rows[0]) throw new Error("Your available balance is too low for this withdrawal");
    const withdrawal = await client.query("insert into vendor_wallet_withdrawals (vendor_id, payout_account_id, amount_kobo) values ($1, $2, $3) returning *", [vendorId, account.rows[0].id, amountKobo]);
    await client.query("insert into vendor_wallet_transactions (vendor_id, withdrawal_id, entry_type, amount_kobo) values ($1, $2, 'withdrawal_reserve', $3)", [vendorId, withdrawal.rows[0].id, -amountKobo]);
    await client.query("commit");
    res.status(201).json({ withdrawal: withdrawal.rows[0], wallet: reserved.rows[0] });
  } catch (err) { await client.query("rollback"); res.status(400).json({ error: err instanceof Error ? err.message : "Could not request withdrawal" }); } finally { client.release(); }
});

export default router;
