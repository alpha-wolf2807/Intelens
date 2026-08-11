import { Router } from "express";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 50;
  const [items, total] = await Promise.all([
    AuditLog.find({})
      .populate("adminId", "email")
      .populate("phraseId", "torturedPhrase actualPhrase")
      .sort({ timestamp: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLog.countDocuments({}),
  ]);
  res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export default router;
