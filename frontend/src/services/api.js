import axios from "axios";

/**
 * Détermine l'URL du backend.
 *
 *  - Si VITE_API_URL est défini (prod ou config explicite), on l'utilise.
 *  - Sinon on prend dynamiquement l'hôte courant du navigateur, ce qui
 *    permet d'accéder à l'app depuis n'importe quelle machine du LAN
 *    (http://192.168.x.y:5173 → API http://192.168.x.y:5000) sans rebuild.
 */
function resolveApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location) {
    const proto = window.location.protocol;     // "http:" | "https:"
    const host  = window.location.hostname;     // "localhost" | "192.168.1.42" | …
    const port  = import.meta.env.VITE_API_PORT || "5000";
    // Note : si la page est chargée en https://, le backend DOIT aussi
    // ecouter en https:// (même port, même cert auto-signé).
    return `${proto}//${host}:${port}`;
  }
  return "http://localhost:5000";
}

export const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("senegram_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && location.pathname !== "/login") {
      localStorage.removeItem("senegram_token");
      localStorage.removeItem("senegram_user");
      location.href = "/login";
    }
    return Promise.reject(err);
  },
);

/** Transforme un `/uploads/...` relatif en URL absolue. */
export function fileUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default api;
