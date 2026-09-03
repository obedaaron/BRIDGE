import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  const result = await pool.query("select * from categories order by name");
  res.json({ categories: result.rows });
});

export default router;