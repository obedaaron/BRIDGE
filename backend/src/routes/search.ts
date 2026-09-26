import { Router } from "express";
import { pool } from "../db";
import { expireUnverifiedPublishedStores } from "../services/publishGrace";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/suggestions", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const city = typeof req.query.city === "string" ? req.query.city.trim().slice(0, 80) : "";
  if (query.length < 2) return res.json({ vendors: [] });

  const result = await pool.query(
    `select v.id, v.business_name, v.slug, v.city, v.state, v.logo_url
       from vendors v
      where v.is_published = true
        and v.business_name ilike '%' || $1 || '%'

      order by case when lower(v.business_name) = lower($1) then 0
                    when lower(v.business_name) like lower($1) || '%' then 1 else 2 end,
               case when $2::text <> '' and (v.city ilike '%' || $2 || '%' or v.state ilike '%' || $2 || '%') then 0 else 1 end,
               v.created_at desc
      limit 6`,
    [query, city]
  );
  res.json({ vendors: result.rows });
});
router.get("/", optionalAuth, async (req, res) => {
  await expireUnverifiedPublishedStores();
  const { category, city, q } = req.query;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const interest = typeof q === "string" ? q.trim().toLowerCase().slice(0, 120) : "";
  if (req.user && interest.length >= 2) await pool.query("insert into user_marketplace_interests (user_id, interest_key, weight, last_seen_at) values ($1, $2, 1, now()) on conflict (user_id, interest_key) do update set weight = least(user_marketplace_interests.weight + 1, 20), last_seen_at = now()", [req.user.userId, interest]);
  const result = await pool.query(
    `select distinct v.id, v.business_name, v.slug, v.description, v.city, v.state,
            v.verification_status, v.logo_url, v.created_at,
            r.avg_rating, r.review_count, coalesce(promoted.is_promoted, false) as is_promoted,
            case when $4::float8 is not null and $5::float8 is not null and v.location is not null
              then round((ST_Distance(v.location, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography) / 1000)::numeric, 1)
              else null end as distance_km
from vendors v
left join categories c on c.id = v.category_id
left join (
  select vendor_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
  from reviews
  group by vendor_id
) r on r.vendor_id = v.id
left join lateral (select true as is_promoted from vendor_promotions p where p.vendor_id = v.id and p.status = 'active' and p.ends_at > now() limit 1) promoted on true
where v.is_published = true
  and ($1::text is null or c.slug = $1 or ($1 = 'fashion' and c.slug = 'fashion-accessories') or ($1 in ('food', 'catering') and c.slug = 'food-beverages') or ($1 = 'tailoring' and c.slug = 'tailoring-alterations') or ($1 = 'mechanics' and c.slug in ('repairs-maintenance', 'auto-mobility')) or ($1 = 'electrical' and c.slug in ('electronics', 'repairs-maintenance')) or ($1 = 'photography' and c.slug = 'events-media'))
  and ($2::text is null or v.city ilike '%' || $2 || '%')
  and ($3::text is null or v.business_name ilike '%' || $3 || '%' or v.description ilike '%' || $3 || '%' or c.name ilike '%' || $3 || '%' or c.slug ilike '%' || $3 || '%' or (c.slug = 'food-beverages' and lower($3) ~ '(cater|restaurant|bakery|drink|beverage|snack)') or exists (select 1 from regexp_split_to_table(lower($3), '\s+') as term where length(term) >= 3 and (lower(c.name) like '%' || term || '%' or lower(c.slug) like '%' || term || '%')))
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




