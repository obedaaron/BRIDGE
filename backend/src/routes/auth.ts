import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";
import crypto from "crypto";
import { KycProviderNotConfiguredError, sendDojahOtp } from "../services/dojah";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password, fullName, acceptedTerms } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (acceptedTerms !== true) return res.status(400).json({ error: "You must accept the BRIDGE Terms and Privacy Policy" });

  try {
    const existing = await pool.query("select id from users where email = $1", [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `insert into users (email, password_hash, full_name) values ($1, $2, $3)
       returning id, email, full_name, role, created_at`,
      [email, passwordHash, fullName || null]
    );

    const user = result.rows[0];
    await pool.query("insert into user_terms_acceptances (user_id, terms_type, version) values ($1, 'customer_terms', '2026-09-06'), ($1, 'privacy_policy', '2026-09-06')", [user.id]);
    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const result = await pool.query("select * from users where email = $1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken({ userId: user.id, role: user.role });
    res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const result = await pool.query(
    "select id, email, full_name, role, phone, email_verified_at, phone_verified_at, created_at from users where id = $1",
    [req.user!.userId]
  );
  res.json({ user: result.rows[0] });
});

function normaliseNigerianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^0\d{10}$/.test(digits)) return `234${digits.slice(1)}`;
  if (/^234\d{10}$/.test(digits)) return digits;
  return null;
}

router.post("/contact-verification/send", requireAuth, async (req, res) => {
  const type = req.body.type === "phone" ? "phone" : req.body.type === "email" ? "email" : null;
  if (!type) return res.status(400).json({ error: "Choose email or phone verification" });
  const userResult = await pool.query("select email, phone from users where id = $1", [req.user!.userId]);
  const user = userResult.rows[0];
  const destination = type === "email" ? user.email : normaliseNigerianPhone(typeof req.body.phone === "string" ? req.body.phone : user.phone || "");
  if (!destination) return res.status(400).json({ error: "Enter a valid Nigerian phone number" });
  const recent = await pool.query("select id from contact_verification_challenges where user_id = $1 and type = $2 and created_at > now() - interval '60 seconds' order by created_at desc limit 1", [req.user!.userId, type]);
  if (recent.rows[0]) return res.status(429).json({ error: "Wait one minute before requesting another code" });
  const code = crypto.randomInt(100000, 1000000).toString();
  try {
    const providerReference = await sendDojahOtp({ destination, channel: type === "phone" ? "sms" : "email", code });
    await pool.query("insert into contact_verification_challenges (user_id, type, destination, code_hash, provider_reference, expires_at) values ($1, $2, $3, $4, $5, now() + interval '10 minutes')", [req.user!.userId, type, destination, crypto.createHash("sha256").update(code).digest("hex"), providerReference]);
    if (type === "phone") await pool.query("update users set phone = $1 where id = $2", [destination, req.user!.userId]);
    res.json({ message: "Verification code sent" });
  } catch (err) { res.status(err instanceof KycProviderNotConfiguredError ? 503 : 502).json({ error: err instanceof Error ? err.message : "Could not send verification code" }); }
});

router.post("/contact-verification/confirm", requireAuth, async (req, res) => {
  const type = req.body.type === "phone" ? "phone" : req.body.type === "email" ? "email" : null;
  const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
  if (!type || !/^\d{6}$/.test(code)) return res.status(400).json({ error: "Enter the six-digit verification code" });
  const result = await pool.query("select * from contact_verification_challenges where user_id = $1 and type = $2 and verified_at is null and expires_at > now() order by created_at desc limit 1", [req.user!.userId, type]);
  const challenge = result.rows[0];
  if (!challenge) return res.status(410).json({ error: "This code has expired. Request a new one." });
  if (challenge.attempts >= 5) return res.status(429).json({ error: "Too many attempts. Request a new code." });
  if (crypto.createHash("sha256").update(code).digest("hex") !== challenge.code_hash) { await pool.query("update contact_verification_challenges set attempts = attempts + 1 where id = $1", [challenge.id]); return res.status(400).json({ error: "That code is incorrect" }); }
  const client = await pool.connect();
  try { await client.query("begin"); await client.query("update contact_verification_challenges set verified_at = now() where id = $1", [challenge.id]); await client.query(`update users set ${type}_verified_at = now() where id = $1`, [req.user!.userId]); await client.query("commit"); res.json({ message: `${type === "phone" ? "Phone" : "Email"} verified` }); }
  catch (err) { await client.query("rollback"); throw err; }
  finally { client.release(); }
});

export default router;
