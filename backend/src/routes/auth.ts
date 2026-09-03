import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

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
    "select id, email, full_name, role, created_at from users where id = $1",
    [req.user!.userId]
  );
  res.json({ user: result.rows[0] });
});

export default router;