import { Router } from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Every route here is admin-only. This file is the ONLY place (besides the
// seed script) where a User document can be created — there is no
// unauthenticated signup route anywhere in this API.
router.use(requireAuth, requireAdmin);

router.get("/", async (req, res) => {
  const users = await User.find({}).select("-passwordHash").sort({ createdAt: -1 }).lean();
  res.json(users);
});

router.post("/", async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (role && !["admin", "user"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role: role || "user",
      status: "active",
      createdByAdminId: req.user.id,
    });
    const { passwordHash: _omit, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That email already has an account" });
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/:id/status", async (req, res) => {
  const { status } = req.body || {};
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.delete("/:id", async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ message: "User deleted successfully" });
});

export default router;
