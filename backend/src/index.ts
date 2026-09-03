import "dotenv/config";
import express from "express";
import cors from "cors";
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

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`BRIDGE server running on http://localhost:${PORT}`));