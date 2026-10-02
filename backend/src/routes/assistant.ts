import { Router } from "express";
import { optionalAuth } from "../middleware/auth";

const router = Router();
const requestTimes = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;

type ChatMessage = { role: "user" | "assistant"; content: string };

function fallbackReply(message: string, role?: string) {
  const text = message.toLowerCase().trim();
  const vendor = role === "vendor";
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how are you)[!.? ]*$/.test(text)) {
    return vendor
      ? "Hey! 👋 Good to see you. What are you working on today—your listings, orders, store profile, or sales?"
      : "Hey! 👋 What brings you to BRIDGE today? I can help you find a local business, browse by category, or get around your orders and cart.";
  }
  if (/\b(thanks|thank you|appreciate)\b/.test(text)) return "You’re welcome! What else can I help you with?";
  if (/\b(find|search|looking for|recommend|shop|business|store|vendor|category)\b/.test(text)) {
    return "Tell me the kind of business you need and the city—something like “a caterer in Uyo”—and I’ll help you search. You can also open Explore to browse stores by category and location.";
  }
  if (/\b(order|delivery|track|payment|checkout)\b/.test(text)) {
    return vendor
      ? "I can point you to your orders and messages. What would you like to check?"
      : "I can help you find your order status. Open Orders to see its latest updates, or tell me what part of checkout or delivery is confusing.";
  }
  if (/\b(listing|product|storefront|publish|analytics|sales|wallet|payout)\b/.test(text) && vendor) {
    return "I can walk you through your store tools. Are you working on a listing, store details, orders, analytics, or a payout?";
  }
  return vendor
    ? "I’m here to help with your BRIDGE store. What are you trying to do right now—add a listing, update your store, check an order, or understand your sales?"
    : "I’m here to help you use BRIDGE. Are you looking for a particular business, trying to place an order, or looking for something else?";
}

function allowRequest(key: string) {
  const now = Date.now();
  const recent = (requestTimes.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestTimes.set(key, recent);
    return false;
  }
  recent.push(now);
  requestTimes.set(key, recent);
  return true;
}

const instructions = (role: string, page: string) => [
  "You are BRIDGE's friendly marketplace guide for Nigerian local businesses and vendors.",
  "Speak naturally, warmly and briefly. Reply to greetings like a person, answer follow-up questions using the conversation, and ask one clear follow-up when you need details. Never repeat a generic capability list as the answer to a greeting.",
  "BRIDGE helps people discover storefronts, browse products and services, message businesses, check orders and shop safely. Vendors can manage storefront details, listings, verification, orders, plans, promotions, wallet and analytics.",
  "The user's role is " + role + ". Their current page is " + (page || "unknown") + ".",
  "You do not have access to live inventory, a user's account, orders, payments, private messages or vendor metrics. Do not invent businesses, prices, availability, order status or account details. For live store discovery, help the user formulate a search by category and city and direct them to Explore. If asked to perform an account change, explain the relevant BRIDGE page and ask them to confirm using the visible action button; do not claim you changed anything.",
  "Stay within BRIDGE support and marketplace tasks. If unsure, say so plainly and give the next useful step. Avoid asking for sensitive personal, payment or verification information.",
].join(" ");

router.post("/chat", optionalAuth, async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 1200) : "";
  if (!message) return res.status(400).json({ error: "Type a message first." });

  const key = req.user?.userId || req.ip || "anonymous";
  if (!allowRequest(key)) return res.status(429).json({ error: "You’ve sent a lot of messages. Wait a minute and try again." });

  const role = req.user?.role === "vendor" ? "vendor" : req.user?.role === "admin" ? "admin" : "customer or guest";
  const page = typeof req.body?.page === "string" ? req.body.page.slice(0, 120) : "";
  const suppliedHistory = Array.isArray(req.body?.history) ? req.body.history : [];
  const history: ChatMessage[] = suppliedHistory
    .filter((item: unknown): item is { role: string; content: string } =>
      Boolean(item && typeof item === "object" &&
        "role" in item && "content" in item &&
        typeof item.role === "string" && typeof item.content === "string"))
    .filter((item: { role: string }) => item.role === "user" || item.role === "assistant")
    .slice(-10)
    .map((item: { role: "user" | "assistant"; content: string }) => ({
      role: item.role,
      content: item.content.slice(0, 1200),
    }));

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return res.json({ reply: fallbackReply(message, req.user?.role), mode: "guided" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions: instructions(role, page),
        input: [...history, { role: "user", content: message }],
        store: false,
        max_output_tokens: 280,
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      console.error("BRIDGE assistant provider returned", response.status);
      return res.json({ reply: fallbackReply(message, req.user?.role), mode: "guided" });
    }

    const data = await response.json() as {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const reply = data.output
      ?.flatMap((item) => item.content || [])
      .find((part) => part.type === "output_text")
      ?.text
      ?.trim();

    return res.json({
      reply: reply || fallbackReply(message, req.user?.role),
      mode: reply ? "conversational" : "guided",
    });
  } catch (error) {
    console.error("BRIDGE assistant request failed", error instanceof Error ? error.name : "unknown error");
    return res.json({ reply: fallbackReply(message, req.user?.role), mode: "guided" });
  }
});

export default router;
