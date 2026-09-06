import type { PoolClient } from "pg";
import { pool } from "../db";

export async function creditVendorWalletForOrder(client: PoolClient, order: { id: string; vendor_id: string; seller_amount_kobo: number; amount_kobo: number }) {
  const amount = Number(order.seller_amount_kobo) || Number(order.amount_kobo);
  await client.query("insert into vendor_wallets (vendor_id) values ($1) on conflict (vendor_id) do nothing", [order.vendor_id]);
  const entry = await client.query(
    `insert into vendor_wallet_transactions (vendor_id, order_id, entry_type, amount_kobo)
     values ($1, $2, 'order_credit', $3) on conflict (order_id, entry_type) do nothing returning id`,
    [order.vendor_id, order.id, amount]
  );
  if (entry.rows[0]) {
    await client.query("update vendor_wallets set available_kobo = available_kobo + $1, updated_at = now() where vendor_id = $2", [amount, order.vendor_id]);
  }
}

export async function settleWalletWithdrawal(reference: string, succeeded: boolean) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query(
      "update vendor_wallet_withdrawals set status = $1, processed_at = now() where provider_reference = $2 and status = 'processing' returning *",
      [succeeded ? "paid" : "failed", reference]
    );
    const withdrawal = result.rows[0];
    if (!withdrawal) { await client.query("commit"); return; }
    await client.query("update vendor_wallets set pending_withdrawal_kobo = pending_withdrawal_kobo - $1, available_kobo = available_kobo + $2, updated_at = now() where vendor_id = $3", [withdrawal.amount_kobo, succeeded ? 0 : withdrawal.amount_kobo, withdrawal.vendor_id]);
    if (!succeeded) {
      await client.query("insert into vendor_wallet_transactions (vendor_id, withdrawal_id, entry_type, amount_kobo) values ($1, $2, 'withdrawal_reversal', $3)", [withdrawal.vendor_id, withdrawal.id, withdrawal.amount_kobo]);
    }
    await client.query("commit");
  } catch (err) { await client.query("rollback"); throw err; } finally { client.release(); }
}
