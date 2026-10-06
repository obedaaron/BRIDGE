import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.get("/mine", requireAuth, async (req, res) => {
  const result = await pool.query("select id, order_id, kind, title, body, href, read_at, created_at from app_notifications where user_id = $1 order by created_at desc limit 50", [req.user!.userId]);
  res.json({ notifications: result.rows });
});
router.patch("/:id/read", requireAuth, async (req, res) => {
  const result = await pool.query("update app_notifications set read_at = coalesce(read_at, now()) where id = $1 and user_id = $2 returning id, read_at", [req.params.id, req.user!.userId]);
  if (!result.rows[0]) return res.status(404).json({ error: "Notification not found" });
  res.json({ notification: result.rows[0] });
});
router.patch("/read-all", requireAuth, async (req, res) => {
  await pool.query("update app_notifications set read_at = now() where user_id = $1 and read_at is null", [req.user!.userId]);
  res.json({ ok: true });
});
export default router;
