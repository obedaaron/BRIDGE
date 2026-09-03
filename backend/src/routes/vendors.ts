import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { slugify } from "../utils/slugify";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const result = await pool.query("select * from vendors where user_id = $1", [req.user!.userId]);
  res.json({ vendor: result.rows[0] || null });
});

router.post("/", requireAuth, async (req, res) => {
  const { businessName, description, phone, whatsapp, city, state, address, categoryId, logoUrl, lat, lng } = req.body;
  if (!businessName) return res.status(400).json({ error: "Business name is required" });

  try {
    const existing = await pool.query("select id from vendors where user_id = $1", [req.user!.userId]);
    if (existing.rows.length > 0) return res.status(409).json({ error: "You already have a store" });

    let slug = slugify(businessName);
    const slugTaken = await pool.query("select id from vendors where slug = $1", [slug]);
    if (slugTaken.rows.length > 0) slug = `${slug}-${Math.floor(Math.random() * 10000)}`;

    const result = await pool.query(
      `insert into vendors (
        user_id, business_name, slug, description, phone, whatsapp,
        city, state, address, category_id, logo_url, location
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        case when $12::float8 is not null and $13::float8 is not null
          then ST_SetSRID(ST_MakePoint($12, $13), 4326)::geography
          else null end
      ) returning *`,
      [req.user!.userId, businessName, slug, description || null, phone || null, whatsapp || null,
       city || null, state || null, address || null, categoryId || null, logoUrl || null,
       lng ?? null, lat ?? null]
    );

    await pool.query("update users set role = 'vendor' where id = $1", [req.user!.userId]);
    res.status(201).json({ vendor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create store" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  const { businessName, description, phone, whatsapp, city, state, address, categoryId, logoUrl, lat, lng } = req.body;
  try {
    const result = await pool.query(
      `update vendors set
        business_name = coalesce($1, business_name),
        description = coalesce($2, description),
        phone = coalesce($3, phone),
        whatsapp = coalesce($4, whatsapp),
        city = coalesce($5, city),
        state = coalesce($6, state),
        address = coalesce($7, address),
        category_id = coalesce($8, category_id),
        logo_url = coalesce($9, logo_url),
        location = case when $10::float8 is not null and $11::float8 is not null
          then ST_SetSRID(ST_MakePoint($10, $11), 4326)::geography
          else location end
       where user_id = $12
       returning *`,
      [businessName, description, phone, whatsapp, city, state, address, categoryId, logoUrl, lng ?? null, lat ?? null, req.user!.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No store found" });
    res.json({ vendor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update store" });
  }
});

router.patch("/me/publish", requireAuth, async (req, res) => {
  const result = await pool.query(
    `update vendors set is_published = not is_published where user_id = $1 returning *`,
    [req.user!.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "No store found" });
  res.json({ vendor: result.rows[0] });
});

export default router;