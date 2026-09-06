import { Router } from "express";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth";
import { pool } from "../db";
import { readPrivateDocument, storePrivateDocument } from "../services/storage";

// Multer is intentionally loaded through require: the installed runtime has no bundled TS declaration.
// The file shape below is the only part of its request augmentation this route needs.
const multer: any = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const router = Router();
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

router.post("/verification-document", requireAuth, upload.single("file"), async (req, res) => {
  const file = (req as typeof req & { file?: { buffer: Buffer; mimetype: string } }).file;
  if (!file || !allowedTypes.has(file.mimetype)) return res.status(400).json({ error: "Upload a JPEG, PNG, WebP, or PDF document under 5MB" });
  const key = `private/verifications/${req.user!.userId}/${randomUUID()}.${extensions[file.mimetype]}`;
  try {
    await storePrivateDocument(key, file.buffer, file.mimetype);
    res.status(201).json({ documentKey: key });
  } catch (err) {
    res.status(503).json({ error: err instanceof Error ? err.message : "Could not store document" });
  }
});

router.post("/verification-selfie", requireAuth, upload.single("file"), async (req, res) => {
  const file = (req as typeof req & { file?: { buffer: Buffer; mimetype: string } }).file;
  const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!file || !imageTypes.has(file.mimetype)) return res.status(400).json({ error: "Upload a JPEG, PNG, or WebP face photo under 5MB" });
  const key = `private/verifications/${req.user!.userId}/selfie-${randomUUID()}.${extensions[file.mimetype]}`;
  try {
    await storePrivateDocument(key, file.buffer, file.mimetype);
    res.status(201).json({ documentKey: key });
  } catch (err) {
    res.status(503).json({ error: err instanceof Error ? err.message : "Could not store face photo" });
  }
});

router.get("/verification-document", requireAuth, async (req, res) => {
  const key = typeof req.query.key === "string" ? req.query.key : "";
  if (!key.startsWith("private/verifications/")) return res.status(400).json({ error: "Invalid document key" });
  const access = await pool.query(
    `select vv.id from vendor_verifications vv join vendors v on v.id = vv.vendor_id
     where ($1 = vv.document_url or $1 = vv.metadata ->> 'selfie_key') and (v.user_id = $2 or $3 = 'admin') limit 1`,
    [key, req.user!.userId, req.user!.role]
  );
  if (!access.rows[0]) return res.status(404).json({ error: "Document not found" });
  try {
    const document = await readPrivateDocument(key);
    const bytes = await document.Body?.transformToByteArray();
    if (!bytes) return res.status(404).json({ error: "Document not found" });
    res.setHeader("Content-Type", document.ContentType || "application/octet-stream");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "private, no-store");
    res.send(Buffer.from(bytes));
  } catch { res.status(404).json({ error: "Document not found" }); }
});

export default router;
