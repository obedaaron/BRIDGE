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

router.get("/publish-readiness", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);
  if (!vendorId) return res.status(404).json({ error: "Create your store first" });
  const result = await pool.query(
    "select type, status from vendor_verifications where vendor_id = $1 and type in ('kyc', 'location') order by created_at desc",
    [vendorId]
  );
  const latest = new Map<string, string>();
  result.rows.forEach((row) => { if (!latest.has(row.type)) latest.set(row.type, row.status); });
  const contactResult = await pool.query("select email_verified_at, phone_verified_at from users where id = $1", [req.user!.userId]);
  const missing = ["kyc", "location"].filter((type) => latest.get(type) !== "approved");
  if (!contactResult.rows[0]?.email_verified_at) missing.push("email");
  if (!contactResult.rows[0]?.phone_verified_at) missing.push("phone");
  res.json({ canPublish: missing.length === 0, missing, checks: Object.fromEntries(latest) });
});

router.post("/kyc/nin", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);
  if (!vendorId) return res.status(404).json({ error: "Create your store before starting KYC" });
  const nin = typeof req.body.nin === "string" ? req.body.nin.trim() : "";
  const documentKey = typeof req.body.documentKey === "string" ? req.body.documentKey : "";
  const selfieKey = typeof req.body.selfieKey === "string" ? req.body.selfieKey : "";
  const consent = req.body.consent === true;
  if (!/^\d{11}$/.test(nin)) return res.status(400).json({ error: "Enter your 11-digit NIN" });
  if (!documentKey.startsWith(`private/verifications/${req.user!.userId}/`)) return res.status(400).json({ error: "Upload your NIN slip or card before submitting KYC" });
  if (!selfieKey.startsWith(`private/verifications/${req.user!.userId}/`)) return res.status(400).json({ error: "Upload a clear photo of your face before submitting KYC" });
  if (!consent) return res.status(400).json({ error: "You must consent to BRIDGE processing this information for identity review" });

  const existing = await pool.query(
    "select id, status from vendor_verifications where vendor_id = $1 and type = 'kyc' order by created_at desc limit 1",
    [vendorId]
  );
  if (existing.rows[0] && ["pending", "approved"].includes(existing.rows[0].status)) {
    return res.status(409).json({ error: `Your KYC is already ${existing.rows[0].status}` });
  }

  // Never persist a full NIN or biometric template. The reviewer sees the submitted
  // evidence in private storage and records a manual decision.
  const result = await pool.query(
    `insert into vendor_verifications (vendor_id, type, document_url, status, provider, provider_status, metadata)
     values ($1, 'kyc', $2, 'pending', 'bridge_manual_review', 'submitted', $3) returning *`,
    [vendorId, documentKey, JSON.stringify({ nin_last4: nin.slice(-4), selfie_key: selfieKey, consented_at: new Date().toISOString() })]
  );
  res.status(201).json({ verification: result.rows[0] });
});

router.post("/", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);
  if (!vendorId) return res.status(404).json({ error: "Create your store before requesting verification" });

  const { type, documentUrl } = req.body;
  const validTypes = ["identity", "business", "location", "skill", "bridge"];
  if (!validTypes.includes(type)) return res.status(400).json({ error: "Invalid verification type" });
  if (type === "location" && (typeof documentUrl !== "string" || !documentUrl.startsWith(`private/verifications/${req.user!.userId}/`))) {
    return res.status(400).json({ error: "Upload address evidence before submitting location verification" });
  }

  const existing = await pool.query(
    "select id, status from vendor_verifications where vendor_id = $1 and type = $2 order by created_at desc limit 1",
    [vendorId, type]
  );
  if (existing.rows[0] && ["pending", "approved"].includes(existing.rows[0].status)) {
    return res.status(409).json({ error: `You already have a ${existing.rows[0].status} request for this type` });
  }

  const result = await pool.query(
    `insert into vendor_verifications (vendor_id, type, document_url, status, provider, provider_status, metadata)
     values ($1, $2, $3, 'pending', 'manual_review', 'submitted', $4) returning *`,
    [vendorId, type, documentUrl || null, JSON.stringify({})]
  );
  res.status(201).json({ verification: result.rows[0] });
});

export default router;
