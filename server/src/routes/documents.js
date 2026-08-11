import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import DocumentModel from "../models/Document.js";
import { requireAuth } from "../middleware/auth.js";
import { extractText, pageForOffset } from "../services/docParser.js";
import { scanText } from "../services/matcher.js";
import { applyFixes, buildCorrectedDocx, buildReportPdf } from "../services/docExport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const router = Router();
router.use(requireAuth);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

function fileTypeFromName(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "docx";
  if (ext === ".txt") return "txt";
  return null;
}

// POST /api/documents/upload  (multipart, field "file") -> extracts + scans immediately
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileType = fileTypeFromName(req.file.originalname);
  if (!fileType) {
    return res.status(400).json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." });
  }

  const doc = await DocumentModel.create({
    userId: req.user.id,
    originalFilename: req.file.originalname,
    fileType,
    storagePath: req.file.path,
    status: "scanning",
  });

  try {
    const { text, pageBreaks } = await extractText(req.file.path, fileType);
    const rawMatches = await scanText(text);
    const matches = rawMatches.map((m) => ({ ...m, pageNumber: pageForOffset(m.charOffsetStart, pageBreaks) }));

    doc.extractedText = text;
    doc.matches = matches;
    doc.status = "scanned";
    await doc.save();
  } catch (err) {
    doc.status = "error";
    await doc.save();
    return res.status(500).json({ error: "Failed to scan document: " + err.message });
  }

  res.status(201).json(doc);
});

// POST /api/documents/scan-text  (body: { text }) -> scans pasted text without storing a file
router.post("/scan-text", async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }

  const matches = await scanText(text);
  const doc = await DocumentModel.create({
    userId: req.user.id,
    originalFilename: "Pasted text",
    fileType: "txt",
    storagePath: "",
    extractedText: text,
    matches,
    status: "scanned",
  });

  res.status(201).json(doc);
});

router.get("/:id", async (req, res) => {
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId: req.user.id });
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

router.get("/", async (req, res) => {
  const docs = await DocumentModel.find({ userId: req.user.id }).sort({ uploadedAt: -1 }).lean();
  res.json(docs);
});

// PATCH /api/documents/:id/matches/:matchId  -> click-to-fix a single match
router.patch("/:id/matches/:matchId", async (req, res) => {
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId: req.user.id });
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const match = doc.matches.id(req.params.matchId);
  if (!match) return res.status(404).json({ error: "Match not found" });

  match.isFixed = true;
  match.fixedAt = new Date();
  await doc.save();

  res.json(doc);
});

// GET /api/documents/:id/report.pdf
router.get("/:id/report.pdf", async (req, res) => {
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const pdf = await buildReportPdf({ filename: doc.originalFilename, text: doc.extractedText, matches: doc.matches });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${doc.originalFilename}-report.pdf"`);
  res.send(pdf);
});

// GET /api/documents/:id/corrected.docx
router.get("/:id/corrected.docx", async (req, res) => {
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const correctedText = applyFixes(doc.extractedText, doc.matches);
  const buffer = await buildCorrectedDocx(correctedText);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="corrected-${doc.originalFilename}.docx"`);
  res.send(buffer);
});

export default router;
