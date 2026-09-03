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
    "select id, title, description, type, price, currency from listings where vendor_id = $1 and is_active = true order by created_at desc",
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

  res.json({
    vendor: {
      ...vendor,
      avg_rating: ratingStats.rows[0].avg_rating ? Number(ratingStats.rows[0].avg_rating) : null,
      review_count: Number(ratingStats.rows[0].review_count),
    },
    listings: listingsResult.rows,
    reviews: reviewsResult.rows,
  });
});

export default router;