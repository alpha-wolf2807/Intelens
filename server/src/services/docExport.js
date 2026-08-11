import PDFDocument from "pdfkit";
import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType } from "docx";

/**
 * Applies all isFixed replacements at their stored offsets and returns the
 * corrected plain text. Offsets are applied back-to-front so earlier
 * replacements don't shift the offsets of ones still to come.
 */
export function applyFixes(originalText, matches) {
  const fixed = matches.filter((m) => m.isFixed).sort((a, b) => b.charOffsetStart - a.charOffsetStart);
  let text = originalText;
  for (const m of fixed) {
    text = text.slice(0, m.charOffsetStart) + m.actualPhrase + text.slice(m.charOffsetEnd);
  }
  return text;
}

/**
 * Splits extracted text into paragraphs. "\n\n" (or more) is a real
 * paragraph break (set by docParser.js for PDF/DOCX/TXT); a single "\n"
 * inside a paragraph is a soft line-wrap and gets joined back into one
 * line so Word doesn't render it as a separate broken line.
 */
function splitParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean).join(" ").trim())
    .filter((p) => p.length > 0);
}

/**
 * Same paragraph boundaries as splitParagraphs, but returned as exact
 * [start, end) character offsets into the ORIGINAL text — not re-derived by
 * searching for a cleaned copy inside the raw text, which is fragile
 * whenever a paragraph happens to contain a soft line-wrap in its first few
 * words (the cleaned/joined text won't be a literal substring of the raw
 * text at that point, so the search silently lands on the wrong offset).
 */
function paragraphSpans(text) {
  const spans = [];
  const regex = /\n{2,}/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    spans.push({ start: lastIndex, end: match.index });
    lastIndex = regex.lastIndex;
  }
  spans.push({ start: lastIndex, end: text.length });
  return spans.filter((s) => text.slice(s.start, s.end).trim().length > 0);
}

/**
 * Rebuilds a corrected .docx that mirrors the source document's paragraph
 * structure (one Word paragraph per detected paragraph, justified text,
 * standard spacing) instead of dumping everything into a single run of text.
 */
export async function buildCorrectedDocx(correctedText) {
  const paragraphs = splitParagraphs(correctedText).map(
    (p) =>
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 276 },
        children: [new TextRun({ text: p, size: 22 })], // 11pt
      })
  );

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
  }

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
  return Packer.toBuffer(doc);
}

/**
 * Builds a marked-up PDF report: the scanned document's own text, rendered
 * with each detected phrase highlighted — red background for phrases that
 * are still unfixed, green for ones already fixed — followed by a summary
 * table of every match. This mirrors what you see in the app's Results
 * screen, just as a downloadable PDF instead of an interactive page.
 */
export function buildReportPdf({ filename, text, matches }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const RED_BG = "#ffd6d6";
    const RED_TEXT = "#8a1c1c";
    const GREEN_BG = "#c9f2df";
    const GREEN_TEXT = "#0a5c3a";

    // --- Header ---
    doc.fontSize(18).fillColor("#111").text("Verbatim Scan Report", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#555").text(`Document: ${filename}`);
    doc.text(`Total matches: ${matches.length}   |   Fixed: ${matches.filter((m) => m.isFixed).length}`);
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(RED_TEXT).text("Red highlight = tortured phrase, not yet fixed.", { continued: true });
    doc.fillColor("#555").text("   ", { continued: true });
    doc.fillColor(GREEN_TEXT).text("Green highlight = fixed.");
    doc.moveDown(1);
    doc.fillColor("#000");

    // --- Highlighted document text ---
    doc.fontSize(11);
    const paraSpans = paragraphSpans(text);
    const sortedMatches = [...matches].sort((a, b) => a.charOffsetStart - b.charOffsetStart);

    // Soft line-wraps inside a paragraph are a single "\n" in the source
    // text. pdfkit's continued-text mode doesn't handle an embedded literal
    // newline gracefully (it breaks the line mid-flow and misplaces
    // whatever comes next), so every text chunk gets flattened to spaces
    // before being handed to doc.text() — pdfkit does its own wrapping.
    const flatten = (s) => s.replace(/\s*\n\s*/g, " ");

    for (const para of paraSpans) {
      const paraMatches = sortedMatches.filter(
        (m) => m.charOffsetStart >= para.start && m.charOffsetStart < para.end
      );

      const segments = [];
      let cursor = para.start;
      for (const m of paraMatches) {
        if (m.charOffsetStart > cursor) segments.push({ type: "text", value: text.slice(cursor, m.charOffsetStart) });
        segments.push({ type: "match", match: m });
        cursor = m.charOffsetEnd;
      }
      if (cursor < para.end) segments.push({ type: "text", value: text.slice(cursor, para.end) });

      // NOTE: highlights are rendered as colored + underlined + bold text,
      // not a background rectangle. pdfkit only reliably reports doc.x/doc.y
      // once a "continued: true" text chain ends — reading them mid-chain to
      // position a rect (as an earlier version of this function did) reads a
      // stale cursor and draws the box in the wrong place. Per-call text
      // properties like fillColor/underline/font don't have that problem,
      // since pdfkit applies them to each call directly rather than by
      // sampling the cursor.
      segments.forEach((seg, i) => {
        const isLast = i === segments.length - 1;
        if (seg.type === "text") {
          doc.font("Helvetica").fillColor("#000").text(flatten(seg.value), { continued: !isLast, underline: false });
        } else {
          const m = seg.match;
          const str = flatten(m.isFixed ? m.actualPhrase : m.matchedText);
          doc
            .font("Helvetica-Bold")
            .fillColor(m.isFixed ? GREEN_TEXT : RED_TEXT)
            .text(str, { continued: !isLast, underline: true });
        }
      });

      doc.fillColor("#000").moveDown(0.8);
    }

    // --- Summary table on a fresh page ---
    doc.addPage();
    doc.fontSize(14).fillColor("#111").text("Match summary", { underline: true });
    doc.moveDown(0.5);

    sortedMatches.forEach((m, i) => {
      doc.fontSize(11).fillColor("#000").text(`${i + 1}. `, { continued: true });
      doc.fillColor(m.isFixed ? GREEN_TEXT : RED_TEXT).text(flatten(m.isFixed ? m.actualPhrase : m.matchedText), { continued: true });
      // pdfkit's default (non-embedded) Helvetica font uses WinAnsi
      // encoding, which doesn't include "→" — it prints as garbage glyphs.
      // A plain ASCII arrow renders correctly without embedding a font.
      doc.fillColor("#000").text(`  ->  ${m.actualPhrase}`);
      doc
        .fontSize(9)
        .fillColor("#666")
        .text(`   page ${m.pageNumber}  |  status: ${m.isFixed ? "fixed" : "unfixed"}`);
      doc.fillColor("#000").moveDown(0.4);
    });

    doc.end();
  });
}
