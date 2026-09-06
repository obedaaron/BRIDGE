import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { calculateCheckoutAmounts, checkoutPricingPolicy } from "../utils/pricing";
import { createFraudAlert } from "../services/fraud";
import { creditVendorWalletForOrder } from "../services/wallet";

const router = Router();

async function getOwnVendor(userId: string) {
  const result = await pool.query("select id from vendors where user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

async function getConversationForUser(conversationId: string, userId: string) {
  const vendorId = await getOwnVendor(userId);
  const result = await pool.query(
    "select * from conversations where id = $1 and (customer_id = $2 or vendor_id = $3)",
    [conversationId, userId, vendorId]
  );
  return { conversation: result.rows[0] || null, vendorId };
}

function orderSelect(where: string) {
  return `select o.*, v.business_name as vendor_name, u.full_name as buyer_name
    from marketplace_orders o
    join vendors v on v.id = o.vendor_id
    join users u on u.id = o.buyer_id
    where ${where}`;
}

router.get("/conversations/:conversationId", requireAuth, async (req, res) => {
  const { conversation } = await getConversationForUser(req.params.conversationId as string, req.user!.userId);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const result = await pool.query(
    `${orderSelect("o.conversation_id = $1")} order by o.created_at desc`,
    [conversation.id]
  );
  res.json({ orders: result.rows });
});

router.get("/mine", requireAuth, async (req, res) => {
  const vendorId = await getOwnVendor(req.user!.userId);
  const result = await pool.query(
    `${orderSelect("o.buyer_id = $1 or o.vendor_id = $2")} order by o.created_at desc`,
    [req.user!.userId, vendorId]
  );
  res.json({ orders: result.rows });
});

router.get("/pricing-policy", (_req, res) => {
  res.json(checkoutPricingPolicy());
});

router.post("/catalog-checkout", requireAuth, async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length || items.length > 30) return res.status(400).json({ error: "Your cart must contain between 1 and 30 items" });
  const normalized: { listingId: string; quantity: number }[] = items.map((item: unknown) => {
    const value = item as { listingId?: unknown; quantity?: unknown };
    return { listingId: typeof value.listingId === "string" ? value.listingId : "", quantity: Number(value.quantity) };
  });
  if (normalized.some((item) => !item.listingId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) return res.status(400).json({ error: "Cart quantities must be whole numbers between 1 and 100" });

  const client = await pool.connect();
  try {
    await client.query("begin");
    const listingIds = normalized.map((item) => item.listingId);
    const listingsResult = await client.query("select id, vendor_id, title, price, currency, stock_quantity from listings where id = any($1::uuid[]) and is_active = true for update", [listingIds]);
    if (listingsResult.rows.length !== normalized.length) throw new Error("One or more items are no longer available");
    const listings = new Map(listingsResult.rows.map((listing) => [listing.id, listing]));
    const vendorIds = new Set(listingsResult.rows.map((listing) => listing.vendor_id));
    if (vendorIds.size !== 1) throw new Error("A checkout can only contain items from one store");
    const vendorId = listingsResult.rows[0].vendor_id as string;
    const vendorOwner = await client.query("select user_id from vendors where id = $1", [vendorId]);
    if (vendorOwner.rows[0]?.user_id === req.user!.userId) throw new Error("You cannot check out from your own store");
    let amountKobo = 0;
    for (const item of normalized) {
      const listing = listings.get(item.listingId)!;
      if (listing.price === null) throw new Error(`${listing.title} does not have a fixed price`);
      if (listing.stock_quantity !== null && listing.stock_quantity < item.quantity) throw new Error(`${listing.title} does not have enough stock`);
      amountKobo += Math.round(Number(listing.price) * 100) * item.quantity;
    }
    const conversationResult = await client.query("select * from conversations where vendor_id = $1 and customer_id = $2", [vendorId, req.user!.userId]);
    const conversation = conversationResult.rows[0] || (await client.query("insert into conversations (vendor_id, customer_id) values ($1, $2) returning *", [vendorId, req.user!.userId])).rows[0];
    const quote = calculateCheckoutAmounts(amountKobo);
    const orderResult = await client.query(
      `insert into marketplace_orders (conversation_id, vendor_id, buyer_id, seller_id, title, amount_kobo, currency, status, accepted_at, platform_fee_kobo, processing_fee_kobo, seller_amount_kobo, buyer_total_kobo)
       values ($1, $2, $3, (select user_id from vendors where id = $2), $4, $5, 'NGN', 'accepted', now(), $6, $7, $8, $9) returning *`,
      [conversation.id, vendorId, req.user!.userId, `${normalized.length} item${normalized.length === 1 ? "" : "s"} from catalog`, amountKobo, quote.platformFeeKobo, quote.processingFeeKobo, quote.sellerAmountKobo, quote.buyerTotalKobo]
    );
    const order = orderResult.rows[0];
    for (const item of normalized) {
      const listing = listings.get(item.listingId)!;
      await client.query("insert into marketplace_order_items (order_id, listing_id, title, quantity, unit_amount_kobo) values ($1, $2, $3, $4, $5)", [order.id, listing.id, listing.title, item.quantity, Math.round(Number(listing.price) * 100)]);
    }
    await client.query("insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'accepted', 'Buyer created a catalog checkout')", [order.id, req.user!.userId]);
    await client.query("commit");
    res.status(201).json({ order });
  } catch (err) {
    await client.query("rollback");
    res.status(400).json({ error: err instanceof Error ? err.message : "Could not create catalog checkout" });
  } finally { client.release(); }
});

router.post("/conversations/:conversationId/proposals", requireAuth, async (req, res) => {
  const { conversation, vendorId } = await getConversationForUser(req.params.conversationId as string, req.user!.userId);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  if (!vendorId || conversation.vendor_id !== vendorId) {
    return res.status(403).json({ error: "Only the store owner can create a deal proposal" });
  }

  const { title, description, amountNaira, deliveryTerms, expiresAt } = req.body;
  const amount = Number(amountNaira);
  if (typeof title !== "string" || !title.trim() || title.trim().length > 160) {
    return res.status(400).json({ error: "Enter a deal title of up to 160 characters" });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    return res.status(400).json({ error: "Enter a valid agreed amount" });
  }
  if (description && (typeof description !== "string" || description.length > 2000)) {
    return res.status(400).json({ error: "Description is too long" });
  }
  if (deliveryTerms && (typeof deliveryTerms !== "string" || deliveryTerms.length > 1000)) {
    return res.status(400).json({ error: "Delivery terms are too long" });
  }

  const expires = expiresAt ? new Date(expiresAt) : null;
  if (expires && (Number.isNaN(expires.getTime()) || expires <= new Date())) {
    return res.status(400).json({ error: "Expiry must be in the future" });
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query(
      `insert into marketplace_orders
        (conversation_id, vendor_id, buyer_id, seller_id, title, description, amount_kobo, delivery_terms, expires_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
      [conversation.id, conversation.vendor_id, conversation.customer_id, req.user!.userId,
       title.trim(), description?.trim() || null, Math.round(amount * 100), deliveryTerms?.trim() || null, expires]
    );
    await client.query(
      "insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'proposed', 'Structured deal created in BRIDGE chat')",
      [result.rows[0].id, req.user!.userId]
    );
    await client.query("commit");
    res.status(201).json({ order: result.rows[0] });
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
});

router.patch("/:id/respond", requireAuth, async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'reject'].includes(action)) return res.status(400).json({ error: "Invalid response" });

  const result = await pool.query(
    `${orderSelect("o.id = $1 and o.buyer_id = $2")} for update`,
    [req.params.id, req.user!.userId]
  );
  const order = result.rows[0];
  if (!order) return res.status(404).json({ error: "Deal not found" });
  if (order.status !== "proposed") return res.status(409).json({ error: "This deal has already been responded to" });
  if (order.expires_at && new Date(order.expires_at) <= new Date()) return res.status(410).json({ error: "This deal has expired" });

  const status = action === "accept" ? "accepted" : "rejected";
  const quote = action === "accept" ? calculateCheckoutAmounts(Number(order.amount_kobo)) : null;
  const updated = await pool.query(
    `update marketplace_orders set status = $1, accepted_at = case when $1 = 'accepted' then now() else null end,
       platform_fee_kobo = coalesce($2, platform_fee_kobo), processing_fee_kobo = coalesce($3, processing_fee_kobo),
       seller_amount_kobo = coalesce($4, seller_amount_kobo), buyer_total_kobo = coalesce($5, buyer_total_kobo), updated_at = now()
     where id = $6 returning *`,
    [status, quote?.platformFeeKobo ?? null, quote?.processingFeeKobo ?? null, quote?.sellerAmountKobo ?? null, quote?.buyerTotalKobo ?? null, order.id]
  );
  await pool.query(
    "insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, $3, $4)",
    [order.id, req.user!.userId, status, action === "accept" ? `Buyer accepted the agreed amount; total due is ₦${(quote!.buyerTotalKobo / 100).toLocaleString()}` : "Buyer declined the proposal"]
  );
  res.json({ order: updated.rows[0] });
});

async function getOrderForParticipant(orderId: string, userId: string) {
  const vendorId = await getOwnVendor(userId);
  const result = await pool.query(`${orderSelect("o.id = $1 and (o.buyer_id = $2 or o.vendor_id = $3)")}`, [orderId, userId, vendorId]);
  return { order: result.rows[0] || null, vendorId };
}

async function transitionOrder(orderId: string, status: string, actorId: string, eventType: string, note: string, fields = "") {
  const result = await pool.query(
    `update marketplace_orders set status = $1, updated_at = now() ${fields} where id = $2 returning *`,
    [status, orderId]
  );
  await pool.query("insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, $3, $4)", [orderId, actorId, eventType, note]);
  return result.rows[0];
}

router.patch("/:id/start", requireAuth, async (req, res) => {
  const { order, vendorId } = await getOrderForParticipant(req.params.id as string, req.user!.userId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.vendor_id !== vendorId) return res.status(403).json({ error: "Only the seller can start fulfilment" });
  if (order.status !== "paid") return res.status(409).json({ error: "Only a paid order can be started" });
  res.json({ order: await transitionOrder(order.id, "in_progress", req.user!.userId, "in_progress", "Seller started fulfilment") });
});

router.patch("/:id/deliver", requireAuth, async (req, res) => {
  const { order, vendorId } = await getOrderForParticipant(req.params.id as string, req.user!.userId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.vendor_id !== vendorId) return res.status(403).json({ error: "Only the seller can mark delivery" });
  if (!["paid", "in_progress"].includes(order.status)) return res.status(409).json({ error: "This order cannot be marked delivered" });
  const proof = typeof req.body.deliveryProofUrl === "string" ? req.body.deliveryProofUrl.trim() : "";
  const result = await pool.query(
    "update marketplace_orders set status = 'delivered', delivered_at = now(), delivery_proof_url = $1, updated_at = now() where id = $2 returning *",
    [proof || null, order.id]
  );
  await pool.query("insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'delivered', 'Seller marked the order delivered')", [order.id, req.user!.userId]);
  res.json({ order: result.rows[0] });
});

router.patch("/:id/complete", requireAuth, async (req, res) => {
  const { order } = await getOrderForParticipant(req.params.id as string, req.user!.userId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.buyer_id !== req.user!.userId) return res.status(403).json({ error: "Only the buyer can confirm completion" });
  if (order.status !== "delivered") return res.status(409).json({ error: "Only a delivered order can be completed" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query(
      "update marketplace_orders set status = 'completed', completed_at = now(), payout_status = 'wallet_available', updated_at = now() where id = $1 and status = 'delivered' returning *",
      [order.id]
    );
    if (!result.rows[0]) throw new Error("This order has already been completed or changed status");
    await creditVendorWalletForOrder(client, result.rows[0]);
    await client.query("insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'completed', 'Buyer confirmed delivery; seller earnings credited to BRIDGE wallet')", [order.id, req.user!.userId]);
    await client.query("commit");
    res.json({ order: result.rows[0] });
  } catch (err) { await client.query("rollback"); res.status(409).json({ error: err instanceof Error ? err.message : "Could not complete order" }); } finally { client.release(); }
});

router.post("/:id/disputes", requireAuth, async (req, res) => {
  const { order } = await getOrderForParticipant(req.params.id as string, req.user!.userId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (!["paid", "in_progress", "delivered"].includes(order.status)) return res.status(409).json({ error: "This order cannot be disputed" });
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
  if (reason.length < 10 || reason.length > 2000) return res.status(400).json({ error: "Provide a dispute reason between 10 and 2,000 characters" });
  const result = await pool.query("update marketplace_orders set status = 'disputed', disputed_at = now(), payout_status = 'on_hold', updated_at = now() where id = $1 returning *", [order.id]);
  await createFraudAlert(order.id, "buyer_dispute", "high", { reason });
  await pool.query("insert into marketplace_order_events (order_id, actor_id, event_type, note) values ($1, $2, 'disputed', $3)", [order.id, req.user!.userId, reason]);
  res.status(201).json({ order: result.rows[0] });
});

export default router;
