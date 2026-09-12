import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";
import crypto from "crypto";
import { ContactDeliveryNotConfiguredError, sendPasswordResetEmail, sendVerificationEmail, sendVerificationSms } from "../services/contactDelivery";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password, fullName, acceptedTerms } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (acceptedTerms !== true) return res.status(400).json({ error: "You must accept the BRIDGE Terms and Privacy Policy" });

  try {
    const existing = await pool.query("select id from users where email = $1", [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const role = email.trim().toLowerCase() === "udosensensunny@gmail.com" ? "admin" : "user";
    const result = await pool.query(
      `insert into users (email, password_hash, full_name, role) values ($1, $2, $3, $4)
       returning id, email, full_name, role, created_at`,
      [email, passwordHash, fullName || null, role]
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

router.patch("/me/password", requireAuth, async (req, res) => {
  const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new passwords are required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "Use a password with at least 8 characters" });
  if (currentPassword === newPassword) return res.status(400).json({ error: "Choose a different password" });
  try {
    const result = await pool.query("select password_hash from users where id = $1", [req.user!.userId]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) return res.status(401).json({ error: "Your current password is incorrect" });
    await pool.query("update users set password_hash = $1 where id = $2", [await bcrypt.hash(newPassword, 12), req.user!.userId]);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change failed", err);
    res.status(500).json({ error: "Could not update your password" });
  }
});
router.post("/password-reset/request", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  const successMessage = "If an account exists for that email, a reset link is on its way.";
  try {
    const userResult = await pool.query("select id, email from users where lower(email) = $1", [email]);
    const user = userResult.rows[0];
    if (!user) return res.json({ message: successMessage });
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await pool.query("update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null", [user.id]);
    await pool.query("insert into password_reset_tokens (user_id, token_hash, expires_at) values ($1, $2, now() + interval '30 minutes')", [user.id, tokenHash]);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    await sendPasswordResetEmail({ destination: user.email, resetUrl: `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${token}` });
    res.json({ message: successMessage });
  } catch (err) {
    if (err instanceof ContactDeliveryNotConfiguredError) return res.status(503).json({ error: err.message });
    console.error("Password reset request failed", err);
    res.status(500).json({ error: "Could not start password reset. Please try again." });
  }
});

router.post("/password-reset/confirm", async (req, res) => {
  const token = typeof req.body.token === "string" ? req.body.token : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!/^[a-f0-9]{64}$/i.test(token)) return res.status(400).json({ error: "This reset link is invalid or expired" });
  if (password.length < 8) return res.status(400).json({ error: "Use a password with at least 8 characters" });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const client = await pool.connect();
  try {
    await client.query("begin");
    const tokenResult = await client.query("select id, user_id from password_reset_tokens where token_hash = $1 and used_at is null and expires_at > now() for update", [tokenHash]);
    const resetToken = tokenResult.rows[0];
    if (!resetToken) { await client.query("rollback"); return res.status(400).json({ error: "This reset link is invalid or expired" }); }
    await client.query("update users set password_hash = $1 where id = $2", [await bcrypt.hash(password, 10), resetToken.user_id]);
    await client.query("update password_reset_tokens set used_at = now() where id = $1", [resetToken.id]);
    await client.query("commit");
    res.json({ message: "Your password has been reset. You can now log in." });
  } catch (err) {
    await client.query("rollback");
    console.error("Password reset failed", err);
    res.status(500).json({ error: "Could not reset password. Please try again." });
  } finally { client.release(); }
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
    const providerReference = type === "phone"
      ? await sendVerificationSms({ destination, code })
      : await sendVerificationEmail({ destination, code });
    await pool.query("insert into contact_verification_challenges (user_id, type, destination, code_hash, provider_reference, expires_at) values ($1, $2, $3, $4, $5, now() + interval '10 minutes')", [req.user!.userId, type, destination, crypto.createHash("sha256").update(code).digest("hex"), providerReference]);
    if (type === "phone") await pool.query("update users set phone = $1 where id = $2", [destination, req.user!.userId]);
    res.json({ message: "Verification code sent" });
  } catch (err) { res.status(err instanceof ContactDeliveryNotConfiguredError ? 503 : 502).json({ error: err instanceof Error ? err.message : "Could not send verification code" }); }
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
