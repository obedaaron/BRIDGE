import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
const router = Router();
router.get("/", requireAuth, async (req, res) => {
  const result = await pool.query(`select distinct v.id, v.business_name, v.slug, v.description, v.city, v.state, v.verification_status, v.logo_url, v.cover_image_url, coalesce(v.storefront_cover_url, v.cover_image_url, store_image.image_url) as storefront_cover_url,
    coalesce(i.score, 0) as interest_score, coalesce(r.avg_rating, 0) as avg_rating, coalesce(r.review_count, 0)::int as review_count
    from vendors v left join categories c on c.id = v.category_id
    left join lateral (
      select coalesce(
        (select image_url from vendor_storefront_gallery_images where vendor_id = v.id order by position asc limit 1),
        (select image_url from listings where vendor_id = v.id and is_active = true and image_url is not null order by created_at desc limit 1)
      ) as image_url
    ) store_image on true
    left join lateral (select sum(weight)::int as score from user_marketplace_interests ui where ui.user_id = $1 and (v.business_name || ' ' || coalesce(v.description,'') || ' ' || coalesce(c.name,'')) ilike '%' || ui.interest_key || '%') i on true
    left join lateral (select round(avg(rating)::numeric,1) as avg_rating, count(*) as review_count from reviews where vendor_id = v.id) r on true
    where v.is_published = true order by coalesce(i.score,0) desc, coalesce(r.avg_rating,0) desc, v.created_at desc limit 6`, [req.user!.userId]);
  res.json({ vendors: result.rows.map((v) => ({ ...v, interest_score: Number(v.interest_score), avg_rating: Number(v.avg_rating), review_count: Number(v.review_count) })) });
});
export default router;