import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/vendor", requireAuth, async (req, res) => {
  const result = await pool.query("select id from vendors where user_id = $1", [req.user!.userId]);
  const vendor = result.rows[0];
  if (!vendor) return res.status(404).json({ error: "No store found" });
  const [summary, trend] = await Promise.all([
    pool.query(`select (select coalesce(sum(store_views), 0)::int from vendor_storefront_daily_metrics where vendor_id = $1 and metric_date >= current_date - 29) as views,
      (select count(*)::int from marketplace_orders where vendor_id = $1 and created_at >= now() - interval '30 days' and status not in ('declined', 'cancelled')) as orders,
      (select coalesce(sum(seller_amount_kobo), 0)::bigint from marketplace_orders where vendor_id = $1 and completed_at >= now() - interval '30 days' and status = 'completed') as revenue_kobo,
      (select count(*)::int from reviews where vendor_id = $1 and created_at >= now() - interval '30 days') as new_reviews`, [vendor.id]),
    pool.query(`select to_char(days.day, 'Mon DD') as label, coalesce(m.store_views, 0)::int as views from generate_series(current_date - 6, current_date, interval '1 day') as days(day)
      left join vendor_storefront_daily_metrics m on m.vendor_id = $1 and m.metric_date = days.day::date order by days.day`, [vendor.id]),
  ]);
  const data = summary.rows[0]; const views = Number(data.views); const orders = Number(data.orders);
  res.json({ summary: { views, orders, revenueKobo: Number(data.revenue_kobo), newReviews: Number(data.new_reviews), conversionRate: views ? Number(((orders / views) * 100).toFixed(1)) : 0 }, trend: trend.rows });
});

export default router;
