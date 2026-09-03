import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

async function getOwnVendorId(userId: string) {
  const result = await pool.query("select id from vendors where user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

router.post("/conversations", requireAuth, async (req, res) => {
  const { vendorSlug } = req.body;
  const vendorResult = await pool.query("select id, user_id from vendors where slug = $1", [vendorSlug]);
  const vendor = vendorResult.rows[0];
  if (!vendor) return res.status(404).json({ error: "Vendor not found" });
  if (vendor.user_id === req.user!.userId) return res.status(400).json({ error: "You can't message your own store" });

  const existing = await pool.query(
    "select * from conversations where vendor_id = $1 and customer_id = $2",
    [vendor.id, req.user!.userId]
  );
  if (existing.rows[0]) return res.json({ conversation: existing.rows[0] });

  const result = await pool.query(
    "insert into conversations (vendor_id, customer_id) values ($1, $2) returning *",
    [vendor.id, req.user!.userId]
  );
  res.status(201).json({ conversation: result.rows[0] });
});

router.get("/conversations/mine", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendorId(req.user!.userId);

  const result = await pool.query(
    `select c.*, v.business_name as vendor_name, v.slug as vendor_slug, v.logo_url as vendor_logo,
            u.full_name as customer_name, u.email as customer_email,
            (select body from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message,
            (select created_at from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message_at
     from conversations c
     join vendors v on v.id = c.vendor_id
     join users u on u.id = c.customer_id
     where c.customer_id = $1 or c.vendor_id = $2
     order by last_message_at desc nulls last, c.created_at desc`,
    [req.user!.userId, vendorId]
  );
  res.json({ conversations: result.rows });
});

async function assertParticipant(conversationId: string, userId: string) {
  const vendorId = await getOwnVendorId(userId);
  const result = await pool.query(
    "select * from conversations where id = $1 and (customer_id = $2 or vendor_id = $3)",
    [conversationId, userId, vendorId]
  );
  return result.rows[0] || null;
}

router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  const conversation = await assertParticipant(req.params.id as string, req.user!.userId);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const vendorResult = await pool.query("select business_name, slug from vendors where id = $1", [conversation.vendor_id]);
  const result = await pool.query("select * from messages where conversation_id = $1 order by created_at asc", [req.params.id]);
  res.json({ conversation: { vendor_name: vendorResult.rows[0]?.business_name, vendor_slug: vendorResult.rows[0]?.slug }, messages: result.rows });
});

router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  const conversation = await assertParticipant(req.params.id as string, req.user!.userId);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "Message cannot be empty" });

  const result = await pool.query(
    "insert into messages (conversation_id, sender_id, body) values ($1, $2, $3) returning *",
    [req.params.id, req.user!.userId, body.trim()]
  );
  res.status(201).json({ message: result.rows[0] });
});

export default router;