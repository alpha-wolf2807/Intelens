import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      isActive
        ? "text-admin-rose font-bold border-r-2 border-admin-rose bg-admin-rose/10"
        : "text-on-surface-variant hover:bg-white/5 hover:text-primary font-normal"
    }`;

  return (
    <div className="text-on-surface antialiased flex min-h-screen">
      <nav className="h-full w-72 fixed left-0 top-0 bg-white/5 backdrop-blur-[40px] border-r border-white/10 flex-col py-stack-lg px-gutter hidden md:flex z-50">
        <div className="mb-12">
          <h1 className="font-headline-md text-headline-md font-bold text-primary mb-2">Intelens</h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-admin-rose/15 text-admin-rose font-label-sm text-label-sm px-2 py-0.5 rounded-full border border-admin-rose/30">
              Admin
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <NavLink to="/admin/phrases" className={linkClass}>
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">database</span>
            <span className="font-body-md text-body-md">Phrase Database</span>
          </NavLink>
          <NavLink to="/admin/bulk-upload" className={linkClass}>
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">cloud_upload</span>
            <span className="font-body-md text-body-md">Bulk Upload</span>
          </NavLink>
          <NavLink to="/admin/users" className={linkClass}>
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">group</span>
            <span className="font-body-md text-body-md">User Management</span>
          </NavLink>
          <NavLink to="/admin/audit-log" className={linkClass}>
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">history</span>
            <span className="font-body-md text-body-md">Audit Log</span>
          </NavLink>
        </div>

        <div className="mt-auto pt-stack-md border-t border-white/10">
          <div
            onClick={handleSignOut}
            className="flex items-center justify-between glass-panel p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">Admin User</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant text-[10px]">{user?.email}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors" title="Sign out">
              logout
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-1 ml-0 md:ml-72 min-h-screen p-margin-mobile md:p-margin-desktop">
        <Outlet />
      </main>
    </div>
  );
}
