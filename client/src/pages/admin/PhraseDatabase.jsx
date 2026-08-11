import { useEffect, useState } from "react";
import { api } from "../../api/client.js";

const emptyForm = { torturedPhrase: "", actualPhrase: "", category: "", notes: "" };

export default function PhraseDatabase() {
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // phrase being edited, or "new"
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await api.listPhrases(page, search);
      setData(res);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  function openNew() {
    setForm(emptyForm);
    setEditing("new");
  }
  function openEdit(p) {
    setForm({ torturedPhrase: p.torturedPhrase, actualPhrase: p.actualPhrase, category: p.category || "", notes: p.notes || "" });
    setEditing(p._id);
  }

  async function save() {
    try {
      if (editing === "new") await api.createPhrase(form);
      else await api.updatePhrase(editing, form);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this phrase?")) return;
    try {
      await api.deletePhrase(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Phrase Database</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{data.total} phrases tracked</p>
        </div>
        <button
          onClick={openNew}
          className="bg-primary-container text-[#0B1120] font-body-md text-body-md font-medium py-3 px-6 rounded-lg hover:bg-primary transition-colors"
        >
          + Add phrase
        </button>
      </div>

      {error && <p className="text-error mb-stack-md">{error}</p>}

      <input
        className="input-glass w-full max-w-md mb-stack-md px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0"
        placeholder="Search by phrase or category…"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />

      <div className="glass-panel rounded-[18px] overflow-hidden">
        <table className="w-full text-left font-body-md text-body-md">
          <thead className="bg-white/5 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <tr>
              <th className="p-4">Tortured phrase</th>
              <th className="p-4">Actual phrase</th>
              <th className="p-4">Category</th>
              <th className="p-4 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p._id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4 text-secondary">{p.torturedPhrase}</td>
                <td className="p-4 text-tertiary">{p.actualPhrase}</td>
                <td className="p-4 text-on-surface-variant">{p.category || "—"}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-primary hover:underline text-sm">
                    Edit
                  </button>
                  <button onClick={() => remove(p._id)} className="text-error hover:underline text-sm">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                  No phrases found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-stack-md font-label-sm text-label-sm text-on-surface-variant">
        <span>
          Page {data.page} of {data.totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded border border-white/10 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded border border-white/10 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-[18px] p-8 w-full max-w-md">
            <h3 className="font-headline-md text-headline-md mb-stack-md">
              {editing === "new" ? "Add phrase" : "Edit phrase"}
            </h3>
            <div className="space-y-3">
              <input
                className="input-glass w-full px-4 py-3 rounded-lg font-body-md focus:ring-0"
                placeholder="Tortured phrase"
                value={form.torturedPhrase}
                onChange={(e) => setForm({ ...form, torturedPhrase: e.target.value })}
              />
              <input
                className="input-glass w-full px-4 py-3 rounded-lg font-body-md focus:ring-0"
                placeholder="Actual phrase"
                value={form.actualPhrase}
                onChange={(e) => setForm({ ...form, actualPhrase: e.target.value })}
              />
              <input
                className="input-glass w-full px-4 py-3 rounded-lg font-body-md focus:ring-0"
                placeholder="Category (optional)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <textarea
                className="input-glass w-full px-4 py-3 rounded-lg font-body-md focus:ring-0"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-stack-md">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded text-on-surface-variant hover:bg-white/5">
                Cancel
              </button>
              <button onClick={save} className="px-4 py-2 rounded bg-primary-container text-[#0B1120] font-medium hover:bg-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
