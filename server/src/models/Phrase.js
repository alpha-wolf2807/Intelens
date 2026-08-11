import mongoose from "mongoose";

const phraseSchema = new mongoose.Schema(
  {
    torturedPhrase: { type: String, required: true, unique: true, trim: true },
    actualPhrase: { type: String, required: true, trim: true },
    category: { type: String, default: null },
    notes: { type: String, default: null },
    updatedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Text index for the admin search box (phrase text + category search).
phraseSchema.index({ torturedPhrase: "text", actualPhrase: "text" });

export default mongoose.model("Phrase", phraseSchema);
