import jwt from "jsonwebtoken";

/**
 * Verifies the JWT on every request. The role used for authorization comes
 * ONLY from the verified token payload (signed server-side at login) —
 * never from a header, query param, or request body. This is what makes the
 * separate /app and /admin frontend shells a UX choice rather than the
 * actual security boundary.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Re-checks role === "admin" server-side. Every admin route must use this —
 * a guessed URL or a user-role token must never reach admin logic, regardless
 * of what the frontend shell shows.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}
