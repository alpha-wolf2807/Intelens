import mongoose from "mongoose";

// A single match of a tortured phrase within a scanned document.
// Embedded (not its own collection) because matches are always read/written
// together with the parent document and stay bounded in size (dozens per
// paper, not millions) — a good fit for Mongo's embed-what-you-read-together
// pattern. Break this out into its own collection only if you later need to
// query matches independently across all documents (e.g. an admin dashboard
// of "most-flagged phrases site-wide").
const matchSchema = new mongoose.Schema(
  {
    torturedPhraseId: { type: mongoose.Schema.Types.ObjectId, ref: "Phrase" },
    matchedText: { type: String, required: true },
    actualPhrase: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    charOffsetStart: { type: Number, required: true },
    charOffsetEnd: { type: Number, required: true },
    isFixed: { type: Boolean, default: false },
    fixedAt: { type: Date, default: null },
  },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalFilename: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "docx", "txt"], required: true },
    storagePath: { type: String, required: true },
    extractedText: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["scanning", "scanned", "error"], default: "scanning" },
    matches: { type: [matchSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
