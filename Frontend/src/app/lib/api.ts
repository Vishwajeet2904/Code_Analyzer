/**
 * Central API utility
 * - Automatically attaches Authorization header
 * - Auto-refreshes access token on 401 TOKEN_EXPIRED
 * - Redirects to /login on auth failure
 */

// In production: VITE_API_URL env var set on Vercel
// In development: falls back to localhost:5000
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function getToken(): string | null {
  return localStorage.getItem("codeguardian_token");
}

function setToken(token: string) {
  localStorage.setItem("codeguardian_token", token);
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // send httpOnly cookie
    });
    if (!res.ok) return null;
    const data = await res.json();
    setToken(data.token);
    return data.token;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Handle token expiry — try refresh once
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));

    if (body.code === "TOKEN_EXPIRED") {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          refreshQueue.push(async (newToken: string) => {
            headers["Authorization"] = `Bearer ${newToken}`;
            resolve(fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" }));
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        // Flush queue
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];

        // Retry original request
        headers["Authorization"] = `Bearer ${newToken}`;
        return fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
      } else {
        // Refresh failed — logout
        refreshQueue = [];
        localStorage.removeItem("codeguardian_token");
        localStorage.removeItem("codeguardian_user");
        window.location.href = "/login";
        return res;
      }
    }
  }

  return res;
}

// Convenience helpers
export const api = {
  get: (path: string) => apiFetch(path, { method: "GET" }),
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
};
