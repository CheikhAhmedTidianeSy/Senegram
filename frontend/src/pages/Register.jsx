import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, Loader2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success("Compte créé avec succès 🎉");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'inscription");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ink-50">
      <div className="hidden md:flex flex-col justify-center p-12
                      bg-gradient-to-br from-senegal-green via-brand-600 to-brand-700 text-white relative">
        <div className="absolute top-10 right-10 w-52 h-52 bg-senegal-yellow/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-senegal-red/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 font-display text-3xl font-extrabold mb-8">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            Senegram
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Rejoins la plus grande communauté sénégalaise en ligne.
          </h2>
          <p className="mt-4 text-white/80 max-w-md">
            Crée ton compte en quelques secondes et commence à discuter, partager et
            appeler gratuitement.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md card p-8">
          <h1 className="font-display text-3xl font-bold text-ink-900">Inscription</h1>
          <p className="text-ink-500 mt-1">C'est rapide et gratuit.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <input
              className="input"
              placeholder="Nom affiché (ex: Aminata Diop)"
              value={form.display_name}
              onChange={(e) => update("display_name", e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Nom d'utilisateur (@username)"
              value={form.username}
              onChange={(e) => update("username", e.target.value.toLowerCase())}
              pattern="[a-zA-Z0-9_]{3,30}"
              title="3 à 30 caractères : lettres, chiffres, _"
              required
            />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Téléphone (+221…)"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Mot de passe (min 6 caractères)"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={6}
            />

            <button className="btn-primary w-full" type="submit" disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Créer mon compte
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-brand-700 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
