import { useEffect, useState } from "react";
import { api } from "../../api/client.js";

export default function AuditLog() {
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listAudit(page).then(setData).catch((err) => setError(err.message));
  }, [page]);

  return (
    <div>
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-lg">Audit Log</h2>
      {error && <p className="text-error mb-stack-md">{error}</p>}

      <div className="glass-panel rounded-[18px] overflow-hidden">
        <table className="w-full text-left font-body-md text-body-md">
          <thead className="bg-white/5 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <tr>
              <th className="p-4">When</th>
              <th className="p-4">Admin</th>
              <th className="p-4">Action</th>
              <th className="p-4">Detail</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((log) => (
              <tr key={log._id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4 font-data-mono text-data-mono text-on-surface-variant">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-4">{log.adminId?.email || "—"}</td>
                <td className="p-4 capitalize text-primary">{log.action.replace("_", " ")}</td>
                <td className="p-4 text-on-surface-variant">{log.detail}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-stack-md font-label-sm text-label-sm text-on-surface-variant">
        <span>Page {data.page} of {data.totalPages || 1}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded border border-white/10 disabled:opacity-40">
            Prev
          </button>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded border border-white/10 disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
