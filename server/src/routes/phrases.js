import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import Phrase from "../models/Phrase.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { invalidateMatcher } from "../services/matcher.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All phrase-management routes are admin-only, re-checked here server-side.
router.use(requireAuth, requireAdmin);

const PAGE_SIZE = 30;

// GET /api/phrases?page=1&search=foo
router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const search = (req.query.search || "").trim();

  const filter = search
    ? { $or: [{ torturedPhrase: new RegExp(search, "i") }, { actualPhrase: new RegExp(search, "i") }, { category: new RegExp(search, "i") }] }
    : {};

  const [items, total] = await Promise.all([
    Phrase.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Phrase.countDocuments(filter),
  ]);

  res.json({ items, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) });
});

router.post("/", async (req, res) => {
  const { torturedPhrase, actualPhrase, category, notes } = req.body || {};
  if (!torturedPhrase || !actualPhrase) {
    return res.status(400).json({ error: "torturedPhrase and actualPhrase are required" });
  }
  try {
    const phrase = await Phrase.create({
      torturedPhrase: torturedPhrase.trim(),
      actualPhrase: actualPhrase.trim(),
      category: category || null,
      notes: notes || null,
      updatedByAdminId: req.user.id,
    });
    await AuditLog.create({ adminId: req.user.id, action: "add", phraseId: phrase._id, detail: torturedPhrase });
    invalidateMatcher();
    res.status(201).json(phrase);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That tortured phrase already exists" });
    res.status(500).json({ error: "Failed to create phrase" });
  }
});

router.put("/:id", async (req, res) => {
  const { torturedPhrase, actualPhrase, category, notes } = req.body || {};
  const phrase = await Phrase.findByIdAndUpdate(
    req.params.id,
    {
      ...(torturedPhrase && { torturedPhrase: torturedPhrase.trim() }),
      ...(actualPhrase && { actualPhrase: actualPhrase.trim() }),
      category: category ?? null,
      notes: notes ?? null,
      updatedByAdminId: req.user.id,
    },
    { new: true }
  );
  if (!phrase) return res.status(404).json({ error: "Phrase not found" });
  await AuditLog.create({ adminId: req.user.id, action: "edit", phraseId: phrase._id, detail: phrase.torturedPhrase });
  invalidateMatcher();
  res.json(phrase);
});

router.delete("/:id", async (req, res) => {
  const phrase = await Phrase.findByIdAndDelete(req.params.id);
  if (!phrase) return res.status(404).json({ error: "Phrase not found" });
  await AuditLog.create({ adminId: req.user.id, action: "delete", phraseId: phrase._id, detail: phrase.torturedPhrase });
  invalidateMatcher();
  res.json({ ok: true });
});

// POST /api/phrases/bulk-import  (multipart form, field name "file")
router.post("/bulk-import", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });

  let records;
  try {
    records = parse(req.file.buffer.toString("utf-8"), { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    return res.status(400).json({ error: "Could not parse CSV: " + err.message });
  }

  let added = 0;
  let updated = 0;
  let duplicates = 0;
  const seen = new Set();
  const ops = [];

  for (const row of records) {
    const tortured = (row.tortured_phrase || "").trim();
    const actual = (row.actual_phrase || "").trim();
    if (!tortured || !actual) continue;

    if (seen.has(tortured.toLowerCase())) duplicates += 1;
    seen.add(tortured.toLowerCase());

    ops.push({
      updateOne: {
        filter: { torturedPhrase: tortured },
        update: {
          $set: {
            torturedPhrase: tortured,
            actualPhrase: actual,
            category: row.category || null,
            notes: row.notes || null,
            updatedByAdminId: req.user.id,
          },
        },
        upsert: true,
      },
    });
  }

  if (ops.length === 0) {
    return res.status(400).json({ error: "No valid rows found in CSV" });
  }

  const result = await Phrase.bulkWrite(ops, { ordered: false });
  added = result.upsertedCount || 0;
  updated = (result.modifiedCount || 0);

  await AuditLog.create({
    adminId: req.user.id,
    action: "bulk_import",
    detail: `${req.file.originalname}: added ${added}, updated ${updated}, duplicate rows ${duplicates}`,
  });
  invalidateMatcher();

  res.json({ added, updated, duplicates, totalRows: records.length });
});

// GET /api/phrases/export.csv
router.get("/export.csv", async (req, res) => {
  const all = await Phrase.find({}).sort({ torturedPhrase: 1 }).lean();
  const csv = stringify(
    all.map((p) => ({
      tortured_phrase: p.torturedPhrase,
      actual_phrase: p.actualPhrase,
      category: p.category || "",
      notes: p.notes || "",
    })),
    { header: true, columns: ["tortured_phrase", "actual_phrase", "category", "notes"] }
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="verbatim-phrases.csv"');
  res.send(csv);
});

export default router;
