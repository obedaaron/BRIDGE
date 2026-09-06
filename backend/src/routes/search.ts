import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  const { category, city, q } = req.query;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const result = await pool.query(
    `select distinct v.id, v.business_name, v.slug, v.description, v.city, v.state,
            v.verification_status, v.logo_url, v.created_at,
            r.avg_rating, r.review_count, coalesce(promoted.is_promoted, false) as is_promoted,
            case when $4::float8 is not null and $5::float8 is not null and v.location is not null
              then round((ST_Distance(v.location, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography) / 1000)::numeric, 1)
              else null end as distance_km
from vendors v
left join listings l on l.vendor_id = v.id
left join categories c on c.id = l.category_id
left join (
  select vendor_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
  from reviews
  group by vendor_id
) r on r.vendor_id = v.id
left join lateral (select true as is_promoted from vendor_promotions p where p.vendor_id = v.id and p.status = 'active' and p.ends_at > now() limit 1) promoted on true
where v.is_published = true
  and ($1::text is null or c.slug = $1)
  and ($2::text is null or v.city ilike '%' || $2 || '%')
  and ($3::text is null or v.business_name ilike '%' || $3 || '%' or v.description ilike '%' || $3 || '%')
order by
  distance_km asc nulls last,
  coalesce(promoted.is_promoted, false) desc, v.created_at desc`,
    [category || null, city || null, q || null, hasLocation ? lat : null, hasLocation ? lng : null]
  );

  const vendors = result.rows.map((v) => ({
    ...v,
    avg_rating: v.avg_rating ? Number(v.avg_rating) : null,
    review_count: Number(v.review_count || 0),
    distance_km: v.distance_km === null ? null : Number(v.distance_km),
  }));

  res.json({ vendors });
});

export default router;
