import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Gates a route tree by role. This is a UX convenience only — the real
 * security boundary is server-side (see server/src/middleware/auth.js).
 * A user-role account is bounced out of /admin/* here, but even if this
 * check were somehow bypassed, the API would still reject their token.
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-on-surface-variant">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  }
  return children;
}
