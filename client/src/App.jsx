import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import AppLayout from "./pages/app/AppLayout.jsx";
import Scan from "./pages/app/Scan.jsx";
import Results from "./pages/app/Results.jsx";

import AdminLayout from "./pages/admin/AdminLayout.jsx";
import PhraseDatabase from "./pages/admin/PhraseDatabase.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import AuditLog from "./pages/admin/AuditLog.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* /app/* — user panel: structurally separate route tree, not a tab
          inside a shared shell with /admin/*. */}
      <Route
        path="/app"
        element={
          <ProtectedRoute role="user">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="scan" replace />} />
        <Route path="scan" element={<Scan />} />
        <Route path="results/:docId" element={<Results />} />
      </Route>

      {/* /admin/* — admin panel, separate shell (sidebar nav). */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="phrases" replace />} />
        <Route path="phrases" element={<PhraseDatabase />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="audit-log" element={<AuditLog />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
