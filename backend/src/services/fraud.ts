import { pool } from "../db";

type Severity = "low" | "medium" | "high" | "critical";

export async function createFraudAlert(orderId: string, code: string, severity: Severity, details: Record<string, unknown> = {}) {
  await pool.query(
    `insert into marketplace_fraud_alerts (order_id, code, severity, details)
     values ($1, $2, $3, $4)
     on conflict (order_id, code) where status = 'open' do nothing`,
    [orderId, code, severity, JSON.stringify(details)]
  );
}

export async function assessOrderRisk(order: { id: string; buyer_id: string; buyer_total_kobo?: number; amount_kobo: number }) {
  const amount = Number(order.buyer_total_kobo) || Number(order.amount_kobo);
  const highValueThreshold = Number(process.env.FRAUD_HIGH_VALUE_KOBO || 5_000_000);
  if (amount >= highValueThreshold) await createFraudAlert(order.id, "high_value_order", "high", { amount_kobo: amount, threshold_kobo: highValueThreshold });

  const velocityResult = await pool.query("select count(*)::int as count from marketplace_orders where buyer_id = $1 and created_at > now() - interval '24 hours'", [order.buyer_id]);
  const count = Number(velocityResult.rows[0]?.count || 0);
  const velocityLimit = Number(process.env.FRAUD_ORDERS_PER_24H_LIMIT || 5);
  if (count >= velocityLimit) await createFraudAlert(order.id, "high_order_velocity", "medium", { orders_last_24h: count, limit: velocityLimit });

  const accountResult = await pool.query("select created_at from users where id = $1", [order.buyer_id]);
  const createdAt = accountResult.rows[0]?.created_at ? new Date(accountResult.rows[0].created_at) : null;
  const newAccountHours = Number(process.env.FRAUD_NEW_ACCOUNT_HOURS || 24);
  if (createdAt && Date.now() - createdAt.getTime() < newAccountHours * 3_600_000 && amount >= highValueThreshold / 2) {
    await createFraudAlert(order.id, "new_account_high_value", "high", { account_age_hours: Math.floor((Date.now() - createdAt.getTime()) / 3_600_000), amount_kobo: amount });
  }
}

export async function hasPayoutBlockingAlert(orderId: string) {
  const result = await pool.query("select id from marketplace_fraud_alerts where order_id = $1 and status = 'open' and severity in ('high', 'critical') limit 1", [orderId]);
  return Boolean(result.rows[0]);
}

export async function hasPaymentBlockingAlert(orderId: string) {
  const result = await pool.query("select id from marketplace_fraud_alerts where order_id = $1 and status = 'open' and severity = 'critical' limit 1", [orderId]);
  return Boolean(result.rows[0]);
}
