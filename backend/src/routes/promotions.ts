import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { getVendorPlan } from "../services/plans";

const router = Router();
async function ownVendor(userId: string) { const result = await pool.query("select id from vendors where user_id = $1", [userId]); return result.rows[0]?.id as string | undefined; }

router.get("/mine", requireAuth, async (req, res) => {
  const vendorId = await ownVendor(req.user!.userId); if (!vendorId) return res.status(404).json({ error: "Create a store first" });
  const [plan, promotions] = await Promise.all([getVendorPlan(vendorId), pool.query("select p.*, l.title, l.image_url from vendor_promotions p join listings l on l.id = p.listing_id where p.vendor_id = $1 and p.status = 'active' and p.ends_at > now() order by p.created_at desc", [vendorId])]);
  res.json({ plan, promotions: promotions.rows });
});

router.post("/", requireAuth, async (req, res) => {
  const vendorId = await ownVendor(req.user!.userId); const listingId = typeof req.body.listingId === "string" ? req.body.listingId : "";
  if (!vendorId) return res.status(404).json({ error: "Create a store first" });
  const plan = await getVendorPlan(vendorId);
  if (plan.promotionLimit === 0) return res.status(403).json({ error: "Promotions are available on Standard and Premium plans." });
  const listing = await pool.query("select id from listings where id = $1 and vendor_id = $2 and is_active = true", [listingId, vendorId]);
  if (!listing.rows[0]) return res.status(404).json({ error: "Choose an active listing from your store" });
  const active = await pool.query("select count(*)::int as count from vendor_promotions where vendor_id = $1 and status = 'active' and ends_at > now()", [vendorId]);
  if (plan.promotionLimit !== null && Number(active.rows[0].count) >= plan.promotionLimit) return res.status(403).json({ error: `${plan.label} allows ${plan.promotionLimit} active promotions. End one before promoting another.` });
  const result = await pool.query("insert into vendor_promotions (vendor_id, listing_id, ends_at) values ($1, $2, now() + interval '30 days') on conflict (listing_id) do update set status = 'active', started_at = now(), ends_at = now() + interval '30 days' returning *", [vendorId, listingId]);
  res.status(201).json({ promotion: result.rows[0] });
});

router.delete("/:id", requireAuth, async (req, res) => { const vendorId = await ownVendor(req.user!.userId); const result = await pool.query("update vendor_promotions set status = 'ended', ends_at = now() where id = $1 and vendor_id = $2 and status = 'active' returning id", [req.params.id, vendorId]); if (!result.rows[0]) return res.status(404).json({ error: "Active promotion not found" }); res.json({ success: true }); });
export default router;
