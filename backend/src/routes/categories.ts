import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  const result = await pool.query("select * from categories order by name");
  res.json({ categories: result.rows });
});

export default router;
