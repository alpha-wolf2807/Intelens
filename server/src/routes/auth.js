import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// There is exactly ONE login endpoint for both roles. Do not add a
// "/auth/register" or "/auth/admin-login" route — accounts are only ever
// created by an admin (see routes/users.js) or the one-time seed script.
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (user.status !== "active") {
    return res.status(403).json({ error: "This account has been suspended" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // role is embedded here, server-side, from the DB record — the frontend
  // never decides it. It routes based on what comes back in this token.
  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  res.json({
    token,
    user: { id: user._id, email: user.email, role: user.role },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
});

export default router;
