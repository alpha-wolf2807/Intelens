import { useRef, useState } from "react";
import { api } from "../../api/client.js";

export default function BulkUpload() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!file) {
      fileInputRef.current?.click();
      return;
    }
    setBusy(true);
    setError("");
    setSummary(null);
    try {
      const res = await api.bulkImport(file);
      setSummary(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-[560px] mb-8">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Bulk Upload</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Add or update many phrases at once from a CSV file.
        </p>
      </div>

      <div className="glass-panel w-full max-w-[560px] rounded-[18px] p-8">
        <h3 className="font-body-md text-body-md font-medium text-on-surface mb-2">Expected format</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-2 text-sm">
          Your CSV must include the following header row and at least the first two columns.
        </p>
        <pre className="bg-black/30 rounded-lg p-4 mb-6 text-xs font-data-mono text-tertiary overflow-x-auto">
{`tortured_phrase,actual_phrase,category,notes
brain organization,neural network,Computer Science,
profound learning,deep learning,Computer Science,`}
        </pre>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center mb-8 hover:border-primary-container hover:bg-white/5 transition-all cursor-pointer group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <span className="material-symbols-outlined text-4xl text-black mb-4 group-hover:text-primary-container transition-colors">
            upload_file
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">
            {file ? file.name : "Drop your CSV here or click to browse"}
          </p>
        </div>

        {error && <p className="text-error mb-4">{error}</p>}
        {summary && (
          <div className="mb-4 text-sm font-body-md text-on-surface-variant bg-white/5 rounded-lg p-4">
            <p className="text-tertiary">Added: {summary.added}</p>
            <p className="text-primary">Updated: {summary.updated}</p>
            <p className="text-secondary">Duplicate rows: {summary.duplicates}</p>
            <p>Total rows processed: {summary.totalRows}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={busy}
            className="bg-primary-container text-[#0B1120] font-body-md text-body-md font-medium py-3 px-6 rounded-lg hover:bg-primary transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-sm">cloud_sync</span>
            {busy ? "Importing…" : "Upload & import"}
          </button>
        </div>
      </div>
    </main>
  );
}
