import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

async function getOwnVendorId(userId: string) {
  const result = await pool.query("select id from vendors where user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

router.get("/mine", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);
  if (!vendorId) return res.status(404).json({ error: "No store found" });

  const result = await pool.query("select * from listings where vendor_id = $1 order by created_at desc", [vendorId]);
  res.json({ listings: result.rows });
});

router.post("/", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);
  if (!vendorId) return res.status(404).json({ error: "Create your store before adding listings" });

  const { title, description, type, price, categoryId } = req.body;
  if (!title || !type) return res.status(400).json({ error: "Title and type are required" });

  try {
    const result = await pool.query(
      `insert into listings (vendor_id, category_id, title, description, type, price)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [vendorId, categoryId || null, title, description || null, type, price || null]
    );
    res.status(201).json({ listing: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);
  const { title, description, price, isActive } = req.body;

  const result = await pool.query(
    `update listings set
      title = coalesce($1, title),
      description = coalesce($2, description),
      price = coalesce($3, price),
      is_active = coalesce($4, is_active)
     where id = $5 and vendor_id = $6
     returning *`,
    [title, description, price, isActive, req.params.id, vendorId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Listing not found" });
  res.json({ listing: result.rows[0] });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);
  const result = await pool.query("delete from listings where id = $1 and vendor_id = $2 returning id", [req.params.id, vendorId]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Listing not found" });
  res.json({ success: true });
});

export default router;