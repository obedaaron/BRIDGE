import "dotenv/config";
import express from "express";
import cors from "cors";
import type { ErrorRequestHandler } from "express";
import authRoutes from "./routes/auth";
import vendorRoutes from "./routes/vendors";
import categoryRoutes from "./routes/categories";
import listingRoutes from "./routes/listings";
import storeRoutes from "./routes/store";
import searchRoutes from "./routes/search";
import verificationRoutes from "./routes/verifications";
import adminRoutes from "./routes/admin";
import messageRoutes from "./routes/messages";
import reviewRoutes from "./routes/reviews";
import orderRoutes from "./routes/orders";
import paymentRoutes, { paystackWebhookHandler } from "./routes/payments";
import subscriptionRoutes from "./routes/subscriptions";
import uploadRoutes from "./routes/uploads";
import walletRoutes from "./routes/wallet";
import promotionRoutes from "./routes/promotions";

const app = express();
app.use(cors());
app.post("/payments/paystack/webhook", express.raw({ type: "application/json" }), paystackWebhookHandler);
// Store logos are sent as data URLs during storefront creation. A 1 MB image
// expands when base64 encoded, so the default 100 KB JSON limit rejects valid
// logo submissions before the vendor route can run.
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.json({ status: "BRIDGE API is running" }));
app.use("/auth", authRoutes);
app.use("/vendors", vendorRoutes);
app.use("/categories", categoryRoutes);
app.use("/listings", listingRoutes);
app.use("/store", storeRoutes);
app.use("/search", searchRoutes);
app.use("/verifications", verificationRoutes);
app.use("/admin", adminRoutes);
app.use("/messages", messageRoutes);
app.use("/reviews", reviewRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/uploads", uploadRoutes);
app.use("/wallet", walletRoutes);
app.use("/promotions", promotionRoutes);

app.use((_req, res) => res.status(404).json({ error: "API route not found" }));

const apiErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("Unhandled API error", error);
  if (res.headersSent) return;
  if (error && typeof error === "object" && "status" in error && error.status === 413) {
    return res.status(413).json({ error: "That submission is too large. Store logos must be smaller than 1 MB." });
  }
  res.status(500).json({ error: "An unexpected server error occurred. Please try again." });
};
app.use(apiErrorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`BRIDGE server running on http://localhost:${PORT}`));
