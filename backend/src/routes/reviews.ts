import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

async function getVendorBySlug(slug: string) {
  const result = await pool.query("select id, user_id from vendors where slug = $1", [slug]);
  return result.rows[0] || null;
}

// Anti-fake-review gate: a customer can only review a vendor they've
// actually messaged. Cheap to check since conversations already exist.
async function hasConversationWith(customerId: string, vendorId: string) {
  const result = await pool.query(
    "select id from conversations where customer_id = $1 and vendor_id = $2",
    [customerId, vendorId]
  );
  return result.rows.length > 0;
}

router.get("/:slug", async (req, res) => {
  const vendor = await getVendorBySlug(req.params.slug as string);
  if (!vendor) return res.status(404).json({ error: "Store not found" });

  const result = await pool.query(
    `select r.id, r.rating, r.body, r.created_at, r.updated_at,
            u.full_name as customer_name
     from reviews r
     join users u on u.id = r.customer_id
     where r.vendor_id = $1
     order by r.created_at desc`,
    [vendor.id]
  );
  res.json({ reviews: result.rows });
});

router.post("/:slug", requireAuth, async (req, res) => {
  const vendor = await getVendorBySlug(req.params.slug as string);
  if (!vendor) return res.status(404).json({ error: "Store not found" });
  if (vendor.user_id === req.user!.userId) {
    return res.status(400).json({ error: "You can't review your own store" });
  }

  const { rating, body } = req.body;
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "Rating must be a whole number from 1 to 5" });
  }

  const canReview = await hasConversationWith(req.user!.userId, vendor.id);
  if (!canReview) {
    return res.status(403).json({ error: "You can only review vendors you've messaged" });
  }

  try {
    const result = await pool.query(
      `insert into reviews (vendor_id, customer_id, rating, body)
       values ($1, $2, $3, $4)
       on conflict (vendor_id, customer_id)
       do update set rating = excluded.rating, body = excluded.body, updated_at = now()
       returning *`,
      [vendor.id, req.user!.userId, ratingNum, body || null]
    );
    res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

router.delete("/:slug", requireAuth, async (req, res) => {
  const vendor = await getVendorBySlug(req.params.slug as string);
  if (!vendor) return res.status(404).json({ error: "Store not found" });

  const result = await pool.query(
    "delete from reviews where vendor_id = $1 and customer_id = $2 returning id",
    [vendor.id, req.user!.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Review not found" });
  res.json({ success: true });
});

export default router;