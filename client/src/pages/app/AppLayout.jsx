import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  const tabClass = ({ isActive }) =>
    `${
      isActive
        ? "text-primary border-b-2 border-primary font-bold"
        : "text-on-surface-variant opacity-70"
    } hover:bg-white/10 hover:text-primary transition-all duration-300 active:scale-95 duration-150 py-1`;

  return (
    <div className="min-h-screen flex flex-col font-body-md text-body-md">
      <header className="sticky top-0 z-50 pt-4 px-4 pb-4">
        <nav className="bg-white/5 backdrop-blur-[40px] rounded-full mx-auto w-fit border border-white/10 flex items-center justify-between px-8 py-3 gap-12">
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/app/scan" className={tabClass}>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Scan</span>
            </NavLink>
            <NavLink to="/app/results" className={tabClass}>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Results</span>
            </NavLink>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="hover:bg-white/10 transition-all duration-300 active:scale-95 duration-150 px-4 py-2 rounded-full font-label-sm text-label-sm uppercase tracking-wider"
              style={{ color: "rgb(242, 107, 107)" }}
            >
              Sign Out
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg mt-stack-md flex flex-col">
        <Outlet />
      </main>

      <footer className="w-full bg-transparent mt-auto border-t border-white/5">
        <div className="max-w-container-max mx-auto px-margin-desktop py-stack-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-headline-md text-headline-md text-on-surface-variant opacity-80">Intelens</div>
          <div className="flex items-center gap-6 font-body-md text-body-md">
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
