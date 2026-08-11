# Verbatim

Detects AI-tortured phrases in research papers ("brain organization" instead of
"neural network"), lets a reviewer fix them with one click, and exports a clean
document plus a report. Admin-gated accounts, admin-managed phrase database,
CSV bulk import.

This repo contains everything through **Phase 8** of the development plan:
landing page, unified login with server-side role routing, admin phrase
database (CRUD + search + pagination), CSV bulk import/export + audit log,
document upload/parsing (PDF/DOCX/TXT), the Aho–Corasick detection engine,
the Scan/Results click-to-fix UI, report + corrected-document downloads, and
admin user management. Phase 9 (fuzzy matching) is a documented stretch goal,
not yet built.

## Structure

```
verbatim/
├── server/     Node.js + Express API, MongoDB via Mongoose
└── client/     React (Vite) + Tailwind CSS
```

## Prerequisites

- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier works fine)

## 1. Server setup

```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGODB_URI, JWT_SECRET, and the SEED_* values
npm run seed     # creates the first admin account + a sample user + sample phrases
npm run dev      # starts the API on http://localhost:4000
```

There is intentionally **no signup route** anywhere in the API. The seed
script is the only way an account exists outside of an admin creating one
from the User Management screen.

## 2. Client setup

In a second terminal:

```bash
cd client
npm install
npm run dev      # starts the app on http://localhost:5173
```

Vite is already configured to proxy `/api` requests to `http://localhost:4000`
(see `client/vite.config.js`), so no extra CORS setup is needed in dev.

## 3. Log in

Open http://localhost:5173, sign in with the admin or user credentials you
set in `server/.env` (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` or
`SEED_USER_EMAIL`/`SEED_USER_PASSWORD`). The same login form routes admins to
`/admin` and reviewers to `/app` based on the role embedded in their JWT by
the server — the frontend never decides this itself.

## Notes on the matching engine

`server/src/services/matcher.js` builds one Aho–Corasick automaton in memory
from the whole `phrases` collection. It's rebuilt only when a phrase is
added/edited/deleted/imported (see `invalidateMatcher()` calls in
`routes/phrases.js`) — a scan never loops over the phrase list one entry at a
time, and never rebuilds the automaton per request.

## What's not wired up yet

- **Phase 9 (fuzzy matching)** — flagged in the dev plan as an optional
  stretch goal, layered on top of the exact Aho–Corasick pass.
- File storage is local disk (`server/uploads/`) as specified for dev; swap in
  S3 or GridFS for production per the tech-stack table in
  `verbatim-development-plan.md`.
- PDF page-splitting in `docParser.js` uses `pdf-parse`'s `pagerender` hook,
  which is good for typical academic PDFs but isn't a full layout engine —
  very unusual PDF structures may need a more robust parser later.

## Design system

Colors, spacing, type scale, and the amber/mint chip interaction all come
directly from the four Stitch mockups (Login, Scan, Results, Bulk Upload) —
see `client/tailwind.config.js` and `client/src/index.css`.
