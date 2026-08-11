import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["add", "edit", "delete", "bulk_import"], required: true },
  phraseId: { type: mongoose.Schema.Types.ObjectId, ref: "Phrase", default: null },
  timestamp: { type: Date, default: Date.now },
  detail: { type: String, default: "" },
});

export default mongoose.model("AuditLog", auditLogSchema);
