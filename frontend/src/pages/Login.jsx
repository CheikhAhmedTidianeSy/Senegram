import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, Lock, User, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      toast.success("Bienvenue sur Senegram 🇸🇳");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de connexion");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Visuel gauche */}
      <div className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden
                      bg-gradient-to-br from-brand-700 via-brand-600 to-senegal-green">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-senegal-yellow/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-senegal-red/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-white">
          <div className="flex items-center gap-3 font-display text-3xl font-extrabold">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            Senegram
          </div>
          <p className="mt-3 text-white/80">La messagerie 100% sénégalaise 🇸🇳</p>
        </div>

        <div className="relative z-10 text-white max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Reste connecté avec ta famille, tes amis, ton équipe.
          </h2>
          <p className="mt-4 text-white/80">
            Chat instantané, appels audio &amp; vidéo HD, groupes, partage de photos et
            de documents — tout au même endroit, en sécurité.
          </p>
          <div className="mt-8 flex items-center gap-6 text-white/70 text-sm">
            <div>Chiffrement en transit</div>
            <div>Temps réel</div>
            <div>WebRTC HD</div>
          </div>
        </div>

        <div className="relative z-10 text-white/50 text-xs">
          Made with ❤️ in by @realtidiane - 2026
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center p-8 bg-ink-50">
        <div className="w-full max-w-md card p-8">
          <div className="md:hidden flex items-center gap-3 font-display text-2xl font-extrabold text-brand-700 mb-6">
            <MessageCircle className="w-7 h-7" /> Senegram
          </div>

          <h1 className="font-display text-3xl font-bold text-ink-900">Bon retour </h1>
          <p className="text-ink-500 mt-1">Connecte-toi pour continuer tes discussions.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Identifiant</span>
              <div className="relative mt-1">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  className="input pl-10"
                  placeholder="username ou email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink-700">Mot de passe</span>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </label>

            <button className="btn-primary w-full" type="submit" disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Se connecter
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-brand-700 font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
