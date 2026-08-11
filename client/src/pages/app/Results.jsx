import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client.js";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Results() {
  const { docId } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const d = await api.getDocument(docId);
      setDoc(d);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  async function handleFix(matchId) {
    try {
      const updated = await api.fixMatch(docId, matchId);
      setDoc(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDownloadReport() {
    const res = await api.downloadReport(docId);
    downloadBlob(await res.blob(), `${doc.originalFilename}-report.pdf`);
  }

  async function handleDownloadCorrected() {
    const res = await api.downloadCorrected(docId);
    downloadBlob(await res.blob(), `corrected-${doc.originalFilename}.docx`);
  }

  const segments = useMemo(() => {
    if (!doc) return [];
    const text = doc.extractedText || "";
    const sorted = [...doc.matches].sort((a, b) => a.charOffsetStart - b.charOffsetStart);
    const parts = [];
    let cursor = 0;
    for (const m of sorted) {
      if (m.charOffsetStart > cursor) parts.push({ type: "text", value: text.slice(cursor, m.charOffsetStart) });
      parts.push({ type: "match", match: m });
      cursor = m.charOffsetEnd;
    }
    if (cursor < text.length) parts.push({ type: "text", value: text.slice(cursor) });
    return parts;
  }, [doc]);

  if (error) return <div className="p-8 text-error">{error}</div>;
  if (!doc) return <div className="p-8 text-on-surface-variant">Loading…</div>;

  const totalMatches = doc.matches.length;
  const fixedCount = doc.matches.filter((m) => m.isFixed).length;
  const progressPct = totalMatches ? Math.round((fixedCount / totalMatches) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mt-8">
      {/* Document view */}
      <div className="md:col-span-8 flex flex-col h-full">
        <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[18px] p-8 flex flex-col h-full hover:border-white/20 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h1 className="font-data-mono text-data-mono text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">description</span>
              {doc.originalFilename}
            </h1>
          </div>

          <div className="flex-grow overflow-y-auto pr-4 font-body-lg text-body-lg text-on-surface/90 leading-[1.8] whitespace-pre-wrap">
            {segments.map((seg, i) =>
              seg.type === "text" ? (
                <span key={i}>{seg.value}</span>
              ) : (
                <span
                  key={seg.match._id}
                  title={seg.match.isFixed ? "Fixed" : "Click to fix"}
                  onClick={() => !seg.match.isFixed && handleFix(seg.match._id)}
                  className={seg.match.isFixed ? "highlight-fixed" : "highlight-tortured"}
                >
                  {seg.match.isFixed ? seg.match.actualPhrase : seg.match.matchedText}
                </span>
              )
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-on-surface-variant font-body-md text-[14px]">
            <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
            Click a highlighted phrase to replace it with the real term.
          </div>
        </div>
      </div>

      {/* Metrics & actions */}
      <div className="md:col-span-4 flex flex-col gap-6">
        <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[18px] p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              Tortured phrases found
            </span>
            <span className="material-symbols-outlined text-secondary opacity-50 group-hover:opacity-100 transition-opacity">
              warning
            </span>
          </div>
          <div className="font-display-lg text-display-lg text-secondary">{totalMatches}</div>
        </div>

        <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[18px] p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300">
          <div className="flex justify-between items-end mb-4">
            <div className="font-display-lg text-display-lg text-on-surface leading-none">
              {fixedCount}
              <span className="text-on-surface-variant text-[24px]">/{totalMatches}</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">
              fixed so far
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-tertiary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[18px] p-6 flex flex-col gap-4 mt-auto">
          <button
            onClick={handleDownloadReport}
            className="w-full bg-primary-container text-on-primary-container font-label-sm text-label-sm py-3.5 px-4 rounded-lg flex justify-center items-center gap-2 hover:bg-[#8ca8ff] transition-colors shadow-[0_0_15px_rgba(124,158,255,0.15)]"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download report
          </button>
          <button
            onClick={handleDownloadCorrected}
            className="w-full bg-transparent border border-white/20 text-on-surface font-label-sm text-label-sm py-3.5 px-4 rounded-lg flex justify-center items-center gap-2 hover:bg-white/5 hover:border-white/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
            Download corrected document
          </button>
        </div>
      </div>
    </div>
  );
}
