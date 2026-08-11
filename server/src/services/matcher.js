import AhoCorasick from "ahocorasick";
import Phrase from "../models/Phrase.js";

// One automaton, built once from the whole phrases collection, held in
// memory. Rebuilt only when the phrase collection changes (see
// invalidate() below) — NEVER rebuilt per-scan, and a scan NEVER loops over
// the phrase list one entry at a time. That loop is the single mistake that
// would make this too slow to use at ~8,000+ phrases.
let automaton = null;
let phraseByTortured = new Map(); // lowercased tortured phrase -> phrase doc
let building = null;

async function build() {
  const phrases = await Phrase.find({}).lean();
  const map = new Map();
  const keywords = [];
  for (const p of phrases) {
    const key = p.torturedPhrase.toLowerCase();
    map.set(key, p);
    keywords.push(key);
  }
  automaton = new AhoCorasick(keywords);
  phraseByTortured = map;
  console.log(`[matcher] automaton built from ${keywords.length} phrases`);
}

/** Call once at server startup. */
export async function initMatcher() {
  building = build();
  await building;
}

/** Call after any write to the phrases collection (add/edit/delete/bulk import). */
export function invalidateMatcher() {
  building = build();
}

async function ensureReady() {
  if (!automaton) {
    if (!building) building = build();
    await building;
  }
}

/**
 * Scans `text` for every tortured phrase, returning matches with character
 * offsets. Runs the automaton once over the text — O(text length), regardless
 * of how many thousands of phrases are loaded.
 */
export async function scanText(text) {
  await ensureReady();
  const lower = text.toLowerCase();
  const rawMatches = automaton.search(lower); // [ [endIndex, [matchedKeywords]], ... ]

  const matches = [];
  for (const [endIndex, keywords] of rawMatches) {
    for (const kw of keywords) {
      const start = endIndex - kw.length + 1;
      const phrase = phraseByTortured.get(kw);
      if (!phrase) continue;
      matches.push({
        torturedPhraseId: phrase._id,
        matchedText: text.slice(start, endIndex + 1),
        actualPhrase: phrase.actualPhrase,
        charOffsetStart: start,
        charOffsetEnd: endIndex + 1,
        isFixed: false,
        fixedAt: null,
      });
    }
  }

  matches.sort((a, b) => a.charOffsetStart - b.charOffsetStart);
  return matches;
}
