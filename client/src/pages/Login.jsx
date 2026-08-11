import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      // Frontend routes based on the verified role returned from the server —
      // it never decides the role itself.
      navigate(user.role === "admin" ? "/admin" : "/app", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container opacity-[0.03] blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-primary-container opacity-[0.02] blur-[80px] pointer-events-none mix-blend-screen" />

      <main className="w-full max-w-[380px] glass-panel rounded-[18px] p-gutter relative z-10 shadow-2xl">
        <div className="mb-stack-lg text-center">
          <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface mb-stack-sm tracking-tight">
            Intelens
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant opacity-80">
            Catch the tortured phrases. Restore the real words.
          </p>
        </div>

        <form className="space-y-stack-md" onSubmit={handleSubmit}>
          <div>
            <label className="sr-only" htmlFor="email">Email</label>
            <input
              className="w-full input-glass px-stack-md py-stack-md rounded-t-DEFAULT font-data-mono text-data-mono text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 border-t-0 border-x-0 bg-black/20"
              id="email"
              name="email"
              placeholder="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="password">Password</label>
            <input
              className="w-full input-glass px-stack-md py-stack-md rounded-t-DEFAULT font-data-mono text-data-mono text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 border-t-0 border-x-0 bg-black/20"
              id="password"
              name="password"
              placeholder="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-error font-body-md text-sm">{error}</p>}

          <div className="pt-stack-sm">
            <button
              className="w-full bg-primary-container text-black font-headline-md text-headline-md py-stack-sm px-gutter rounded-DEFAULT hover:scale-[1.02] transition-transform duration-300 drop-shadow-xl disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-stack-lg pt-stack-md border-t border-white/10">
          <p className="font-label-sm text-label-sm text-on-surface-variant/60 text-center leading-relaxed">
            One sign-in for everyone. Your account decides where you land. Accounts are created by your admin —
            there's no public sign-up.
          </p>
        </div>
      </main>
    </div>
  );
}
