import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";

export default function Scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleScanDocument() {
    if (!file) {
      fileInputRef.current?.click();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const doc = await api.uploadDocument(file);
      navigate(`/app/results/${doc._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleScanText() {
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const doc = await api.scanText(text);
      navigate(`/app/results/${doc._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <>
      <div className="mb-stack-lg">
        <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Scan New Content</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Initialize a new scan to detect linguistic anomalies and potential tortured phrases within your academic
          text.
        </p>
      </div>

      {error && <p className="text-error mb-stack-md font-body-md">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-stretch">
        {/* Upload document */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="mb-stack-md flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container">upload_file</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Upload a document</h2>
          </div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="dashed-dropzone rounded-lg p-12 flex flex-col items-center justify-center text-center flex-grow mb-stack-md cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary-container/10 transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl group-hover:text-primary-container transition-colors">
                cloud_upload
              </span>
            </div>
            <h3 className="font-body-lg text-body-lg text-on-surface mb-2">
              {file ? file.name : "Drop a file here or click to browse"}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">PDF, DOCX, or TXT</p>
          </div>
          <button
            onClick={handleScanDocument}
            disabled={busy}
            className="w-full bg-primary-container text-[#0B1120] font-label-sm text-label-sm uppercase tracking-wider font-bold py-4 px-6 rounded-lg hover:bg-primary transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">document_scanner</span>
            {busy ? "Scanning…" : "Scan document"}
          </button>
        </div>

        {/* Paste text */}
        <div className="glass-panel p-8 flex flex-col h-[500px] lg:h-auto">
          <div className="mb-stack-md flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container">text_fields</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Paste text</h2>
          </div>
          <div className="flex-grow flex flex-col mb-stack-md relative group">
            <textarea
              className="input-glass w-full h-full rounded-t-lg p-4 font-body-md text-body-md text-on-surface resize-none placeholder-on-surface-variant/50 focus:ring-0 flex-grow"
              placeholder="Paste your abstract, paragraph, or plain text here for immediate analysis..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={60000}
            />
            <div className="absolute bottom-4 right-4 text-on-surface-variant/40 font-data-mono text-label-sm">
              {wordCount} / 10,000 words
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
            For an abstract, a paragraph, or text you haven't saved as a file yet.
          </p>
          <button
            onClick={handleScanText}
            disabled={busy}
            className="w-full bg-primary-container text-[#0B1120] font-label-sm text-label-sm uppercase tracking-wider font-bold py-4 px-6 rounded-lg hover:bg-primary transition-colors flex justify-center items-center gap-2 mt-auto disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            {busy ? "Scanning…" : "Scan text"}
          </button>
        </div>
      </div>
    </>
  );
}
