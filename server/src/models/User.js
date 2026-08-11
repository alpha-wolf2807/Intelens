import mongoose from "mongoose";

// No public signup path creates this model — accounts are only ever inserted
// by the seed script (first admin) or by an authenticated admin via
// POST /api/users. There is intentionally no "role" field accepted from
// any client-facing request body other than the admin-only user-creation route.
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], required: true, default: "user" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("User", userSchema);
