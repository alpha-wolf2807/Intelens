import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import { initMatcher } from "./services/matcher.js";

import authRoutes from "./routes/auth.js";
import phraseRoutes from "./routes/phrases.js";
import documentRoutes from "./routes/documents.js";
import userRoutes from "./routes/users.js";
import auditRoutes from "./routes/audit.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// NOTE: there is no "/api/auth/register" route anywhere in this file or in
// routes/auth.js. Accounts are created only via routes/users.js (admin-only)
// or the seed script. Do not add a signup route.
app.use("/api/auth", authRoutes);
app.use("/api/phrases", phraseRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  await initMatcher();
  app.listen(PORT, () => console.log(`[server] Verbatim API listening on :${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
