import { Link } from "react-router-dom";

const highlights = [
  "AI-tortured phrase detection",
  "Reviewer-friendly corrections",
  "Admin-maintained phrase database",
];

const features = [
  {
    title: "Spot the signal",
    text: "Surface suspicious phrasing with a fast, focused review flow that keeps your attention on what matters.",
  },
  {
    title: "Correct in one click",
    text: "Replace weak or inflated wording with precise alternatives and keep the document moving.",
  },
  {
    title: "Stay in control",
    text: "Admins manage the phrase library and keep the review workflow aligned with your standards.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f5f5f7] to-[#e8e8ed] text-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 right-[-8%] h-96 w-96 rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute -bottom-12 left-[-6%] h-80 w-80 rounded-full bg-surface-variant/15 blur-[120px]" />
      </div>

      <header className="relative z-20 border-b border-black/10 bg-white/50 px-6 py-4 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link to="/" className="font-headline-md text-headline-md font-semibold tracking-tight text-black">
            Intelens
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-black/15 bg-white/60 px-5 py-2.5 font-label-sm text-label-sm uppercase tracking-[0.24em] text-black shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 hover:bg-black hover:text-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-10 lg:pt-16">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center rounded-full border border-admin-rose/30 bg-admin-rose/10 px-4 py-2 text-sm font-medium text-admin-rose">
              Research review, reimagined
            </div>
            <h1 className="font-display-lg text-4xl leading-tight text-black sm:text-5xl lg:text-6xl">
              Catch the tortured phrases before they slip through.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-black/75 sm:text-xl">
              Intelens helps reviewers identify AI-tortured phrasing, restore precise wording, and keep every review file clear, credible, and ready to share.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-black px-8 py-4 text-base font-bold text-white shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)] hover:scale-[1.03] active:scale-95"
              >
                Sign in to continue
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border-2 border-black bg-transparent px-8 py-4 text-base font-bold text-black backdrop-blur-xl transition-all duration-300 hover:bg-black hover:text-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
              >
                Explore the workflow
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <div key={item} className="rounded-full border-2 border-black/30 bg-black/5 px-4 py-2 text-sm font-medium text-black backdrop-blur-xl">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="hero-card-float relative overflow-hidden rounded-3xl border-2 border-black/20 bg-white/80 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.08),_transparent_45%)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-black">Live review view</p>
                    <h2 className="mt-2 font-headline-lg text-headline-lg text-black">Precision at a glance</h2>
                  </div>
                  <div className="rounded-full border border-black/20 bg-black/10 px-3 py-1 text-sm font-medium text-black">
                    8k+ phrases
                  </div>
                </div>

                <div className="mt-6 space-y-3 rounded-2xl border-2 border-black/20 bg-white/90 p-4">
                  <div className="flex items-center justify-between text-sm text-black font-medium">
                    <span>Document review</span>
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs font-bold text-white">Ready</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="rounded-lg border-2 border-black/15 bg-black/5 p-3">
                      <p className="text-sm font-bold text-black">"brain organization"</p>
                      <p className="mt-1 text-sm text-black/70">Suggested: "neural network"</p>
                    </div>
                    <div className="rounded-lg border-2 border-black/15 bg-black/5 p-3">
                      <p className="text-sm font-bold text-black">"the data demonstrates"</p>
                      <p className="mt-1 text-sm text-black/70">Flagged as potentially inflated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-20 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="relative overflow-hidden rounded-2xl border-2 border-black/15 bg-white/70 p-6 shadow-[0_10px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] hover:border-black/30">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-black">{feature.title}</h3>
              <p className="mt-3 text-base leading-7 text-black/70">{feature.text}</p>
            </article>
          ))}
        </section>

        <section id="about" className="mt-20 rounded-3xl border-2 border-black/15 bg-white/70 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-black">Why Intelens</p>
              <h2 className="mt-3 font-headline-lg text-headline-lg text-black">A refined review experience for modern research teams.</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-black/70">
                Intelens combines clarity, speed, and governance so your reviewers can focus on the text that matters instead of hunting for awkward phrasing one line at a time.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-black/15 bg-white/80 p-6">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-[0.3em] text-black">Workflow</span>
                <span className="rounded-full bg-black px-3 py-1 text-sm font-bold text-white">Secure</span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-lg border-2 border-black/20 bg-black/5 p-4">
                  <p className="font-bold text-black">1. Review the flagged phrase</p>
                </div>
                <div className="rounded-lg border-2 border-black/20 bg-black/5 p-4">
                  <p className="font-bold text-black">2. Apply the correction</p>
                </div>
                <div className="rounded-lg border-2 border-black/20 bg-black/5 p-4">
                  <p className="font-bold text-black">3. Export a polished report</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-black/10 bg-white/30 px-6 py-8 text-center text-sm text-black/70 backdrop-blur-xl sm:px-8 lg:px-10">
        © 2026 Intelens. All rights reserved.
      </footer>
    </div>
  );
}

