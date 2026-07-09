import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { usePush } from "./PushContext";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("senegram_user")); } catch { return null; }
  });
  const [token,   setToken]   = useState(() => localStorage.getItem("senegram_token"));
  const [loading, setLoading] = useState(true);
  const { subscribe } = usePush();

  useEffect(() => {
    (async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("senegram_user", JSON.stringify(data.user));
      } catch {
        localStorage.removeItem("senegram_token");
        localStorage.removeItem("senegram_user");
        setUser(null); setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function login(identifier, password) {
    const { data } = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("senegram_token", data.token);
    localStorage.setItem("senegram_user",  JSON.stringify(data.user));
    setToken(data.token); setUser(data.user);
    subscribe(); // Request push subscription after login
    return data;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("senegram_token", data.token);
    localStorage.setItem("senegram_user",  JSON.stringify(data.user));
    setToken(data.token); setUser(data.user);
    subscribe(); // Request push subscription after register
    return data;
  }

  async function updateProfile(patch) {
    const { data } = await api.patch("/users/me", patch);
    setUser(data.user);
    localStorage.setItem("senegram_user", JSON.stringify(data.user));
    return data.user;
  }

  async function logout() {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("senegram_token");
    localStorage.removeItem("senegram_user");
    setUser(null); setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
