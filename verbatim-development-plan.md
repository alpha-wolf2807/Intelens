# Verbatim — Development Plan

**Verbatim**: detects AI-tortured phrases in research papers, lets a reviewer fix them
with one click, and outputs a clean document plus a report. Admin-gated accounts,
admin-managed phrase database (~8,000 entries), CSV bulk import.

---

## 1. Tech stack (with reasoning)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS | Matches the glassmorphism mockup; component reuse between Scan/Results/Admin |
| Landing page (additional) | Framer Motion, GSAP + ScrollTrigger, React Three Fiber + drei, Lenis | Marketing page needs richer motion/3D than the working app — kept as a separate concern so the app itself stays fast and quiet |
| Backend | Node.js + Express | JS end-to-end with the frontend — one language, shared types if you add TypeScript later |
| Database | MongoDB Atlas | Document model fits well here: a scanned document's matches naturally nest inside the document record rather than needing a join |
| Matching engine | `ahocorasick` (npm) | Builds one automaton from all 8,000+ phrases, finds every match in one pass over the text — O(n) regardless of dictionary size. Don't build a loop that checks the text against each phrase one by one — that's the thing most likely to make this too slow to use |
| Fuzzy layer (optional, phase 2) | `fuzzball` or `string-similarity` (npm) | Catches near-variants of a tortured phrase not in the exact list |
| Doc parsing | `pdf-parse` (PDF), `mammoth` (DOCX → text/HTML), plain read (TXT) | Extract text; `mammoth` in particular preserves enough structure to map matches back to paragraphs |
| Doc export | `docx` (npm, for rebuilding .docx), `pdf-lib` or `pdfkit` (for PDF report + reconstructed PDF) | Rebuild a corrected file after phrases are fixed |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` | Admin-issued accounts only — there is no public signup route, not even a hidden one. One login form for everyone; the server decides where to send them |
| File storage | Local disk (dev) → S3-compatible bucket or MongoDB GridFS (prod) | Uploaded docs, generated reports. GridFS is convenient since you're already on Atlas, but a bucket is usually cheaper at scale |

### Unified login & role routing

There is **one login form**, not a separate admin login page. The flow:

1. User submits email + password to a single `POST /auth/login` endpoint.
2. Server verifies credentials, checks `status === "active"`, and reads `role` off
   the matched `users` document.
3. Server returns a JWT with `role` embedded in its payload — the frontend never
   decides the role itself, since a client-side-only decision would be trivial to
   spoof.
4. Frontend reads `role` from the verified token and routes to one of two
   **structurally separate** shells:
   - `role: "user"` → the user panel (top tab bar: Scan / Results)
   - `role: "admin"` → the admin panel (sidebar nav: Phrase Database / Bulk Upload
     / User Management / Audit Log)
5. Every admin API route re-checks `role === "admin"` server-side on every request —
   the separate frontend shell is a UX choice, not the security boundary. A user
   token must never be accepted on an admin route even if someone guesses the URL.

The two panels should not just be different tabs inside one shared shell — build
them as genuinely separate frontend route trees (e.g. `/app/*` vs `/admin/*`) so
there's no risk of admin-only UI leaking into a user session by accident.

---

## 2. Data model (MongoDB collections)

MongoDB is schema-flexible, but keep these shapes consistent — Mongoose schemas are
the easiest way to enforce that.

```js
// users
{
  _id, email, passwordHash, role: "admin" | "user",
  status: "active" | "suspended",
  createdByAdminId, createdAt
}

// phrases
{
  _id, torturedPhrase, actualPhrase,
  category: null | string, notes: null | string,
  createdAt, updatedAt, updatedByAdminId
}
// unique index on torturedPhrase (prevents silent duplicates)
// text index on torturedPhrase + actualPhrase (admin search)

// documents
{
  _id, userId, originalFilename, fileType, storagePath,
  uploadedAt, status: "scanning" | "scanned" | "error",
  matches: [   // embedded, not a separate collection — matches are always
               // read together with their document, so embedding avoids a join
    {
      torturedPhraseId, matchedText, pageNumber,
      charOffsetStart, charOffsetEnd,
      isFixed: bool, fixedAt
    }
  ]
}

// auditLog   -- phrase DB changes, for institutional trust
{
  _id, adminId, action: "add" | "edit" | "delete" | "bulk_import",
  phraseId, timestamp, detail
}
```

`matches` is embedded inside `documents` because it's always fetched and updated
alongside its parent document and won't grow unbounded (a paper has dozens of
matches, not millions) — a good fit for MongoDB's embed-what-you-read-together
pattern. If you later want matches queryable independently (e.g. an admin dashboard
of "most-flagged phrases across all documents"), that's the point to break it out
into its own collection instead.

---

## 3. CSV format for bulk phrase upload

Required header row, UTF-8, comma-delimited. Wrap any field containing a comma in
double quotes.

```csv
tortured_phrase,actual_phrase,category,notes
brain organization,neural network,Computer Science,
profound learning,deep learning,Computer Science,
random woodland,random forest,Computer Science,
```

- `tortured_phrase`, `actual_phrase` — required
- `category`, `notes` — optional, leave blank if unused
- Duplicate `tortured_phrase` values on import: last row wins (use a MongoDB
  `bulkWrite` with `upsert: true` keyed on `torturedPhrase`), and the import summary
  reports how many rows were duplicates so the admin can catch pasting errors.

---

## 4. Core algorithm: detection + click-to-fix

1. Extract document text **with position metadata** (page number + character offset),
   not just raw text — this is what makes highlighting and corrected-document
   regeneration possible later.
2. Build one Aho–Corasick automaton (via `ahocorasick`) from all `phrases` documents,
   held in memory on the Node server. Rebuild/cache it whenever the admin edits the
   phrase collection — don't rebuild it per-scan.
3. Run the automaton once over the extracted text → every match, with its position.
4. Frontend renders the text with matches wrapped in clickable highlight spans.
5. On click: swap the span's text to `actualPhrase`, mark that match's `isFixed = true`
   (update the embedded array element on the `documents` doc, e.g. via
   `arrayFilters` in `updateOne`).
6. "Download corrected document": take the original document, apply all `isFixed`
   replacements at their stored offsets, and re-render into the original file format.
7. "Download report": list every match (tortured phrase, real phrase, page, fixed
   status) as a PDF.

---

## 5. Feature breakdown

### User panel (reached automatically when a user-role account signs in)
- Single unified login — no separate admin login page, no self-registration
- Upload document (PDF / DOCX / TXT) **or** paste raw text
- Scan → highlighted results view
- Click a highlight → replace in place
- Download plagiarism-style report (PDF)
- Download corrected document (original format)

### Admin panel (reached automatically when an admin-role account signs in — a
### structurally separate interface, not a tab inside the user panel)
- Create user accounts (email + password), set active/suspended — this is the
  monetization gate: an account only exists because the admin made it
- Phrase database table, paginated **30 rows/page** (~270 pages at 8,077 rows;
  use `.skip().limit()` at this scale, or a cursor/range-based approach if the
  collection grows much larger)
- Search/filter phrases (Mongo text index, or `$regex` for simple prefix search)
- Add / edit / delete a single phrase
- Bulk upload via CSV (spec above), with an import summary (added / updated / duplicate rows)
- Export current phrase collection back to CSV (backup, and lets the admin edit offline in bulk)
- Audit log of who changed what phrase and when

### Suggested additions (worth building — flagged, not required)
- **Fuzzy-match layer**: tortured phrases have variants (e.g. "brain-based organization").
  Exact match alone will miss these; a fuzzy scoring pass on top of the exact pass
  catches near-misses at adjustable confidence.
- **Category tagging + per-category stats**: since phrases already have a category
  field, surface "most-flagged category" in the results view — useful context for a
  reviewer deciding how much to trust a paper.
- **Duplicate-guard on add/import**: warn instead of silently overwriting.
- **Institutional batch mode**: scan a folder/zip of many papers in one job, one
  summary report across all of them — useful if a customer is an integrity office
  processing submissions in bulk rather than a single researcher.

---

## 6. Landing page

A public marketing page, separate from the app, sharing the same brand and color
system but with noticeably more motion — the app itself stays quiet and fast on
purpose; the landing page is where the product gets to perform.

- **Hero**: headline + CTAs, with a lightweight 3D floating glass shape (React
  Three Fiber + drei) that tilts toward the cursor — low-poly, not a heavy imported
  model, so it doesn't hurt load time.
- **Live-demo teaser**: a small looping/hover animation that reuses the app's own
  signature interaction — an amber tortured-phrase chip flipping to its mint
  corrected state. Don't invent a new metaphor here; reuse the one the product
  already teaches people in the Results screen.
- **How it works**: a 3-step scroll-triggered sequence (GSAP + ScrollTrigger).
- **Feature cards**: glass cards with a cursor-based hover tilt and glow.
- **Stats**: numbers that count up on scroll into view (e.g. phrase-count).
- **Pricing/CTA**: closing panel with a magnetic-hover primary button.
- **Custom cursor**: a small glass dot with a trailing glow on desktop, morphing
  into a pill on hover over interactive elements; falls back to the native cursor
  on touch devices; disabled along with all scroll/parallax effects when
  `prefers-reduced-motion` is set.

Keep the heaviest animation and 3D work confined to the landing page — none of it
belongs in the working app screens, which need to stay fast for someone actively
reviewing a paper.

---

## 7. Build phases

| Phase | Deliverable |
|---|---|
| 0 | Public landing page — hero with 3D element, live-demo teaser reusing the click-to-fix interaction, scroll-triggered how-it-works, feature cards with hover tilt, custom cursor. Doesn't depend on the backend, build it first |
| 1 | Repo scaffold, MongoDB Atlas connection + Mongoose schemas, unified login with server-side role routing (JWT, admin-seeded first account), separate user/admin route trees |
| 2 | Admin Center: phrase CRUD + pagination + search |
| 3 | CSV bulk import/export + audit log |
| 4 | Document upload + text extraction w/ position metadata (PDF, DOCX, TXT) |
| 5 | Aho–Corasick detection engine, cached in memory and rebuilt on phrase-collection change |
| 6 | Scan UI: highlighted viewer, click-to-fix, paste-text mode |
| 7 | Report PDF generation + corrected-document regeneration/download |
| 8 | User management (admin creates/suspends accounts) |
| 9 | Fuzzy-match layer (optional stretch) |
| 10 | QA pass, deploy |

Build in this order — each phase is independently testable and the AI development
prompt (companion file) is structured to match it, so you can hand phases to a coding
agent one at a time instead of the whole system at once.
