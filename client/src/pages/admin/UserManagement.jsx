import { useEffect, useState } from "react";
import { api } from "../../api/client.js";

const emptyForm = { email: "", password: "", role: "user" };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function load() {
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createUser(form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(u) {
    try {
      await api.setUserStatus(u._id, u.status === "active" ? "suspended" : "active");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteUser() {
    if (!deleteConfirm) return;
    try {
      await api.deleteUser(deleteConfirm._id);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">User Management</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Accounts are only ever created here — there is no public sign-up.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-container text-[#0B1120] font-body-md text-body-md font-medium py-3 px-6 rounded-lg hover:bg-primary transition-colors"
        >
          + New account
        </button>
      </div>

      {error && <p className="text-error mb-stack-md">{error}</p>}

      <div className="glass-panel rounded-[18px] overflow-hidden">
        <table className="w-full text-left font-body-md text-body-md">
          <thead className="bg-white/5 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span
                    className={
                      u.role === "admin"
                        ? "text-admin-rose bg-admin-rose/10 px-2 py-0.5 rounded-full text-xs font-medium"
                        : "text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium"
                    }
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={u.status === "active" ? "text-tertiary" : "text-error"}>{u.status}</span>
                </td>
                <td className="p-4 space-x-2 flex">
                  <button
                    onClick={() => toggleStatus(u)}
                    className={
                      u.status === "active"
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        : "bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                    }
                  >
                    {u.status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(u)}
                    className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={createUser} className="glass-panel rounded-[18px] p-8 w-full max-w-md">
            <h3 className="font-headline-md text-headline-md mb-stack-md">Create account</h3>
            <div className="space-y-3">
              <input
                className="input-glass w-full px-4 py-3 rounded-lg font-body-md focus:ring-0"
                placeholder="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="input-glass w-full px-4 py-3 rounded-lg font-body-md focus:ring-0"
                placeholder="Temporary password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <select
                className="input-glass w-full px-4 py-3 rounded-lg font-body-md focus:ring-0 bg-transparent"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user" className="bg-surface">Reviewer (user)</option>
                <option value="admin" className="bg-surface">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-stack-md">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded text-on-surface-variant hover:bg-white/5">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-primary-container text-[#0B1120] font-medium hover:bg-primary">
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-[18px] p-8 w-full max-w-md">
            <h3 className="font-headline-md text-headline-md mb-2">Delete user?</h3>
            <p className="text-on-surface-variant mb-stack-md">Are you sure you want to delete <strong>{deleteConfirm.email}</strong>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded text-on-surface-variant hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteUser}
                className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
