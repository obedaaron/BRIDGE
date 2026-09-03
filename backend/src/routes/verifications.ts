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
  if (!vendorId) return res.status(404).json({ error: "Create your store first" });

  const result = await pool.query(
    "select * from vendor_verifications where vendor_id = $1 order by created_at desc",
    [vendorId]
  );
  res.json({ verifications: result.rows });
});

router.post("/", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);
  if (!vendorId) return res.status(404).json({ error: "Create your store before requesting verification" });

  const { type, documentUrl } = req.body;
  const validTypes = ["identity", "business", "location", "skill", "bridge"];
  if (!validTypes.includes(type)) return res.status(400).json({ error: "Invalid verification type" });

  const existing = await pool.query(
    "select id, status from vendor_verifications where vendor_id = $1 and type = $2 order by created_at desc limit 1",
    [vendorId, type]
  );
  if (existing.rows[0] && ["pending", "approved"].includes(existing.rows[0].status)) {
    return res.status(409).json({ error: `You already have a ${existing.rows[0].status} request for this type` });
  }

  const result = await pool.query(
    `insert into vendor_verifications (vendor_id, type, document_url, status)
     values ($1, $2, $3, 'pending') returning *`,
    [vendorId, type, documentUrl || null]
  );
  res.status(201).json({ verification: result.rows[0] });
});

export default router;