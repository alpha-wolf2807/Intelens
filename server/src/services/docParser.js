import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Groups a PDF page's raw text items into lines (by y-coordinate), then
 * inserts a paragraph break ("\n\n") wherever the vertical gap between two
 * lines is noticeably larger than the page's typical line spacing, and a
 * plain line break ("\n") otherwise. Without this, pdf.js text items come
 * back as one flat stream with no paragraph structure at all, which is why
 * a naively-rebuilt corrected document used to come out as one giant blob
 * of text instead of properly separated paragraphs.
 */
function linesToParagraphedText(items) {
  const lines = [];
  const Y_TOLERANCE = 2;

  for (const item of items) {
    const y = item.transform[5];
    const last = lines[lines.length - 1];
    if (last && Math.abs(y - last.y) <= Y_TOLERANCE) {
      const needsSpace = !last.text.endsWith(" ") && !item.str.startsWith(" ") && item.str !== "";
      last.text += (needsSpace ? " " : "") + item.str;
    } else {
      lines.push({ y, text: item.str });
    }
  }

  const gaps = [];
  for (let i = 1; i < lines.length; i++) gaps.push(Math.abs(lines[i - 1].y - lines[i].y));
  const typicalGap = median(gaps) || 1;

  let pageText = "";
  for (let i = 0; i < lines.length; i++) {
    pageText += lines[i].text.trim();
    if (i < lines.length - 1) {
      const gap = Math.abs(lines[i].y - lines[i + 1].y);
      pageText += gap > typicalGap * 1.4 ? "\n\n" : "\n";
    }
  }
  return pageText.trim();
}

/**
 * Converts mammoth's HTML output into plain text with real paragraph breaks
 * ("\n\n" between paragraphs/headings/list items), instead of using
 * extractRawText, which does not reliably line up with Word's actual
 * paragraph boundaries. Inline formatting (bold/italic/etc.) is discarded —
 * we only need clean text with correct paragraph structure here.
 */
function htmlToParagraphedText(html) {
  let text = html
    .replace(/<\/(p|h1|h2|h3|h4|h5|h6|li)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts text from a document, preserving paragraph breaks ("\n\n")
 * wherever the source format gives us a real signal for them (PDF line
 * spacing, DOCX paragraph/heading tags). For PDFs we also return page
 * boundaries so a character offset can be mapped back to a page number.
 *
 * Returns: { text, pageBreaks: number[] } where pageBreaks[i] is the char
 * offset where page i+2 begins (i.e. page boundaries within `text`).
 */
export async function extractText(filePath, fileType) {
  if (fileType === "pdf") {
    const buffer = await fs.readFile(filePath);
    const pageTexts = [];
    await pdfParse(buffer, {
      pagerender: async (pageData) => {
        const content = await pageData.getTextContent();
        const pageText = linesToParagraphedText(content.items);
        pageTexts.push(pageText);
        return pageText;
      },
    });

    let text = "";
    const pageBreaks = [];
    for (const pageText of pageTexts) {
      if (text.length > 0) {
        pageBreaks.push(text.length);
        text += "\n\n";
      }
      text += pageText;
    }
    return { text, pageBreaks };
  }

  if (fileType === "docx") {
    const { value: html } = await mammoth.convertToHtml({ path: filePath });
    return { text: htmlToParagraphedText(html), pageBreaks: [] };
  }

  // txt — blank lines are treated as the paragraph boundary; a single
  // newline within a block of non-blank lines is treated as a soft wrap.
  const raw = await fs.readFile(filePath, "utf-8");
  const text = raw
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text, pageBreaks: [] };
}

/** Given a character offset and the pageBreaks array, returns the 1-indexed page number. */
export function pageForOffset(offset, pageBreaks) {
  let page = 1;
  for (const breakpoint of pageBreaks) {
    if (offset >= breakpoint) page += 1;
    else break;
  }
  return page;
}
