import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { slugify } from "../utils/slugify";
import { createPaystackTransferRecipient, listPaystackBanks } from "../services/paystack";
import { getVendorPlan } from "../services/plans";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const result = await pool.query("select * from vendors where user_id = $1", [req.user!.userId]);
  res.json({ vendor: result.rows[0] || null });
});

router.post("/", requireAuth, async (req, res) => {
  const { businessName, description, phone, whatsapp, city, state, address, categoryId, logoUrl, lat, lng, acceptedVendorTerms } = req.body;
  if (!businessName) return res.status(400).json({ error: "Business name is required" });
  if (acceptedVendorTerms !== true) return res.status(400).json({ error: "You must accept the Seller Terms and Buyer Protection Policy" });

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
    await pool.query("insert into user_terms_acceptances (user_id, terms_type, version) values ($1, 'seller_terms', '2026-09-06'), ($1, 'buyer_protection_policy', '2026-09-06')", [req.user!.userId]);
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
  const vendorResult = await pool.query("select id, is_published, publish_grace_expires_at, publish_grace_used_at from vendors where user_id = $1", [req.user!.userId]);
  const vendor = vendorResult.rows[0];
  if (!vendor) return res.status(404).json({ error: "No store found" });

  if (vendor.is_published) {
    const result = await pool.query("update vendors set is_published = false where id = $1 returning *", [vendor.id]);
    return res.json({ vendor: result.rows[0] });
  }

  const requiredChecks = await pool.query(
    `select type from vendor_verifications
     where vendor_id = (select id from vendors where user_id = $1)
       and type in ('kyc', 'location') and status = 'approved'`,
    [req.user!.userId]
  );
  const approvedTypes = new Set(requiredChecks.rows.map((row) => row.type));
  const missing = ["kyc", "location"].filter((type) => !approvedTypes.has(type));
  const contact = await pool.query("select email_verified_at, phone_verified_at from users where id = $1", [req.user!.userId]);
  if (!contact.rows[0]?.email_verified_at) missing.push("email verification");
  if (!contact.rows[0]?.phone_verified_at) missing.push("phone verification");
  const graceStillActive = vendor.publish_grace_expires_at && new Date(vendor.publish_grace_expires_at).getTime() > Date.now();
  if (missing.length > 0 && vendor.publish_grace_used_at && !graceStillActive) {
    return res.status(403).json({
      error: `Your 7-day publishing grace period has ended. Complete ${missing.map((type) => type.toUpperCase()).join(" and ")} before republishing.`,
      missing,
    });
  }

  const result = await pool.query(
    `update vendors set
      is_published = true,
      publish_grace_used_at = case when $2::boolean then coalesce(publish_grace_used_at, now()) else publish_grace_used_at end,
      publish_grace_expires_at = case
        when $2::boolean then coalesce(publish_grace_expires_at, now() + interval '7 days')
        else null
      end
     where id = $1 returning *`,
    [vendor.id, missing.length > 0]
  );
  res.json({ vendor: result.rows[0] });
});

router.get("/payout-banks", requireAuth, async (_req, res) => {
  try { res.json({ banks: await listPaystackBanks() }); }
  catch (err) { res.status(503).json({ error: err instanceof Error ? err.message : "Bank list is unavailable" }); }
});

router.get("/me/payout-account", requireAuth, async (req, res) => {
  const result = await pool.query("select bank_code, bank_name, account_name, account_last4, is_active from vendor_payout_accounts where vendor_id = (select id from vendors where user_id = $1)", [req.user!.userId]);
  res.json({ account: result.rows[0] || null });
});

router.put("/me/payout-account", requireAuth, async (req, res) => {
  const vendorResult = await pool.query("select id, business_name from vendors where user_id = $1", [req.user!.userId]);
  const vendor = vendorResult.rows[0];
  if (!vendor) return res.status(404).json({ error: "Create your store before adding a payout account" });
  const accountNumber = typeof req.body.accountNumber === "string" ? req.body.accountNumber.replace(/\s/g, "") : "";
  const bankCode = typeof req.body.bankCode === "string" ? req.body.bankCode.trim() : "";
  if (!/^\d{10}$/.test(accountNumber) || !bankCode) return res.status(400).json({ error: "Enter a valid Nigerian account number and bank" });
  try {
    const recipient = await createPaystackTransferRecipient({ name: vendor.business_name, accountNumber, bankCode });
    const result = await pool.query(
      `insert into vendor_payout_accounts (vendor_id, recipient_code, bank_code, bank_name, account_name, account_last4)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (vendor_id) do update set recipient_code = excluded.recipient_code, bank_code = excluded.bank_code, bank_name = excluded.bank_name, account_name = excluded.account_name, account_last4 = excluded.account_last4, is_active = true, updated_at = now()
       returning bank_code, bank_name, account_name, account_last4, is_active`,
      [vendor.id, recipient.recipientCode, bankCode, recipient.bankName, recipient.accountName, accountNumber.slice(-4)]
    );
    res.json({ account: result.rows[0] });
  } catch (err) { res.status(502).json({ error: err instanceof Error ? err.message : "Could not verify payout account" }); }
});

router.patch("/me/delivery", requireAuth, async (req, res) => {
  const feeNaira = Number(req.body.outOfCityDeliveryFeeNaira);
  if (!Number.isFinite(feeNaira) || feeNaira < 0 || feeNaira > 1000000) return res.status(400).json({ error: "Enter a valid out-of-city delivery fee" });
  const result = await pool.query("update vendors set out_of_city_delivery_fee_kobo = $1 where user_id = $2 returning out_of_city_delivery_fee_kobo", [Math.round(feeNaira * 100), req.user!.userId]);
  if (!result.rows[0]) return res.status(404).json({ error: "No store found" });
  res.json({ delivery: result.rows[0] });
});

router.patch("/me/storefront", requireAuth, async (req, res) => {
  const vendorResult = await pool.query("select id from vendors where user_id = $1", [req.user!.userId]);
  const vendor = vendorResult.rows[0];
  if (!vendor) return res.status(404).json({ error: "No store found" });
  const plan = await getVendorPlan(vendor.id);
  if (plan.tier === "free") return res.status(403).json({ error: "Storefront cover, colours, and layouts are available on Standard and Premium." });
  const coverUrl = typeof req.body.coverUrl === "string" ? req.body.coverUrl.trim() : null;
  const accentColor = typeof req.body.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(req.body.accentColor) ? req.body.accentColor : null;
  const layout = ["classic", "modern", "minimal"].includes(req.body.layout) ? req.body.layout : "classic";
  const result = await pool.query("update vendors set storefront_cover_url = $1, storefront_accent_color = $2, storefront_layout = $3 where id = $4 returning storefront_cover_url, storefront_accent_color, storefront_layout", [coverUrl || null, accentColor, layout, vendor.id]);
  res.json({ storefront: result.rows[0] });
});
export default router;
