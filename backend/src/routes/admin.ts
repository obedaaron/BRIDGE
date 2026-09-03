import { Router } from "express";
import { pool } from "../db";
import { requireAdmin } from "../middleware/admin";

const router = Router();

router.get("/verifications", requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  const result = await pool.query(
    `select vv.*, v.business_name, v.slug
     from vendor_verifications vv
     join vendors v on v.id = vv.vendor_id
     where ($1::text is null or vv.status = $1)
     order by vv.created_at asc`,
    [status || null]
  );
  res.json({ verifications: result.rows });
});

router.patch("/verifications/:id", requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });

  const result = await pool.query(
    `update vendor_verifications set status = $1, reviewed_by = $2, reviewed_at = now()
     where id = $3 returning *`,
    [status, req.user!.userId, req.params.id]
  );
  const verification = result.rows[0];
  if (!verification) return res.status(404).json({ error: "Not found" });

  if (status === "approved") {
    const badgeMap: Record<string, string> = {
      identity: "identity_verified",
      business: "business_verified",
      location: "location_verified",
      skill: "skill_verified",
      bridge: "bridge_verified",
    };
    await pool.query("update vendors set verification_status = $1 where id = $2", [
      badgeMap[verification.type], verification.vendor_id,
    ]);
  }

  res.json({ verification });
});

router.get("/vendors", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `select id, business_name, slug, city, state, verification_status, subscription_tier, is_published, logo_url, created_at
     from vendors order by created_at desc`
  );
  res.json({ vendors: result.rows });
});

router.patch("/vendors/:id/publish", requireAdmin, async (req, res) => {
  const result = await pool.query(
    "update vendors set is_published = not is_published where id = $1 returning *",
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Vendor not found" });
  res.json({ vendor: result.rows[0] });
});

export default router;