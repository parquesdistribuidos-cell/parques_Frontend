const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Error de red");
  }
  return res.json();
}

export const apiClient = {
  register: (data: { username: string; email: string; password: string }) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { username: string; password: string }) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => apiFetch("/usuarios/me"),

  misPartidas: () => apiFetch("/usuarios/me/partidas"),

  ranking: () => apiFetch("/estadisticas/ranking"),

  probabilidad: (id: number) => apiFetch(`/estadisticas/probabilidad/${id}`),
};
