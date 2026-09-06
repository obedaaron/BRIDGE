import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/:slug", async (req, res) => {
  const vendorResult = await pool.query(
    `select id, user_id, business_name, slug, description, logo_url, cover_image_url, phone, whatsapp,
            email, address, city, state, verification_status, subscription_tier
     from vendors where slug = $1 and is_published = true`,
    [req.params.slug]
  );
  const vendor = vendorResult.rows[0];
  if (!vendor) return res.status(404).json({ error: "Store not found" });

  const listingsResult = await pool.query(
    "select id, title, description, type, price, currency, image_url, stock_quantity from listings where vendor_id = $1 and is_active = true order by created_at desc",
    [vendor.id]
  );

  const reviewsResult = await pool.query(
    `select r.id, r.rating, r.body, r.created_at, u.full_name as customer_name
     from reviews r
     join users u on u.id = r.customer_id
     where r.vendor_id = $1
     order by r.created_at desc`,
    [vendor.id]
  );

  const ratingStats = await pool.query(
    "select round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count from reviews where vendor_id = $1",
    [vendor.id]
  );

  const trustResult = await pool.query(
    `with completed as (
       select buyer_id from marketplace_orders where vendor_id = $1 and status = 'completed'
     ), totals as (
       select count(*)::int as transactions, count(distinct buyer_id)::int as customers from completed
     ), repeats as (
       select count(*)::int as repeat_customers from (select buyer_id from completed group by buyer_id having count(*) >= 2) r
     )
     select totals.transactions, totals.customers, repeats.repeat_customers from totals cross join repeats`,
    [vendor.id]
  );
  const trust = trustResult.rows[0] || { transactions: 0, customers: 0, repeat_customers: 0 };
  const transactions = Number(trust.transactions);
  const reviews = Number(ratingStats.rows[0].review_count);
  // The curve is intentionally slow: early completed orders help, while a high score takes sustained history.
  const reliabilityScore = Math.min(96, Math.round(96 * (1 - Math.exp(-(transactions + reviews * 1.5) / 116))));
  const goldTick = transactions >= 50 && reviews >= 20 && reliabilityScore >= 55;

  res.json({
    vendor: {
      ...vendor,
      avg_rating: ratingStats.rows[0].avg_rating ? Number(ratingStats.rows[0].avg_rating) : null,
      review_count: Number(ratingStats.rows[0].review_count),
      completed_transactions: transactions,
      repeat_customers: Number(trust.repeat_customers),
      reliability_score: reliabilityScore,
      gold_tick: goldTick,
    },
    listings: listingsResult.rows,
    reviews: reviewsResult.rows,
  });
});

export default router;
