const BASE = "https://intelens-backend.onrender.com/api";

function getToken() {
  return localStorage.getItem("verbatim_token");
}

async function request(path, { method = "GET", body, isForm = false, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (raw) return res;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.blob();
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),

  scanText: (text) => request("/documents/scan-text", { method: "POST", body: { text } }),
  uploadDocument: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/documents/upload", { method: "POST", body: form, isForm: true });
  },
  getDocument: (id) => request(`/documents/${id}`),
  fixMatch: (docId, matchId) => request(`/documents/${docId}/matches/${matchId}`, { method: "PATCH" }),
  downloadReport: (docId) => request(`/documents/${docId}/report.pdf`, { raw: true }),
  downloadCorrected: (docId) => request(`/documents/${docId}/corrected.docx`, { raw: true }),

  listPhrases: (page = 1, search = "") => request(`/phrases?page=${page}&search=${encodeURIComponent(search)}`),
  createPhrase: (data) => request("/phrases", { method: "POST", body: data }),
  updatePhrase: (id, data) => request(`/phrases/${id}`, { method: "PUT", body: data }),
  deletePhrase: (id) => request(`/phrases/${id}`, { method: "DELETE" }),
  bulkImport: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/phrases/bulk-import", { method: "POST", body: form, isForm: true });
  },
  exportPhrasesUrl: () => `${BASE}/phrases/export.csv`,

  listUsers: () => request("/users"),
  createUser: (data) => request("/users", { method: "POST", body: data }),
  setUserStatus: (id, status) => request(`/users/${id}/status`, { method: "PUT", body: { status } }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

  listAudit: (page = 1) => request(`/audit?page=${page}`),
};

export function saveToken(token) {
  localStorage.setItem("verbatim_token", token);
}
export function clearToken() {
  localStorage.removeItem("verbatim_token");
}
export function hasToken() {
  return !!getToken();
}
