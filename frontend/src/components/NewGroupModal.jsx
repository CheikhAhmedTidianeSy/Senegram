import { useEffect, useState } from "react";
import { X, Check, Users } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "./Avatar";
import api from "../services/api";

export default function NewGroupModal({ onClose, onCreated }) {
  const [name, setName]     = useState("");
  const [desc, setDesc]     = useState("");
  const [q, setQ]           = useState("");
  const [users, setUsers]   = useState([]);
  const [picked, setPicked] = useState({});     // id -> user
  const [busy, setBusy]     = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(q)}`)
        .then(({ data }) => setUsers(data.users));
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  function toggle(u) {
    setPicked((p) => {
      const n = { ...p };
      if (n[u.id]) delete n[u.id];
      else n[u.id] = u;
      return n;
    });
  }

  async function submit() {
    if (!name.trim()) return toast.error("Donne un nom au groupe");
    const ids = Object.keys(picked).map(Number);
    if (!ids.length) return toast.error("Ajoute au moins un membre");
    setBusy(true);
    try {
      const { data } = await api.post("/groups", {
        name: name.trim(),
        description: desc.trim() || null,
        member_ids: ids,
      });
      toast.success("Groupe créé 🎉");
      onCreated?.(data.conversation);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de création");
    } finally {
      setBusy(false);
    }
  }

  const pickedArr = Object.values(picked);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-ink-100">
          <h3 className="font-semibold text-ink-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-700" />
            Nouveau groupe
          </h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-3">
          <input className="input" placeholder="Nom du groupe"
                 value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Description (optionnelle)"
                 value={desc} onChange={(e) => setDesc(e.target.value)} />

          {pickedArr.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {pickedArr.map((u) => (
                <div key={u.id}
                     className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-brand-50 text-brand-900 text-xs">
                  <Avatar user={u} size={20} />
                  {u.display_name}
                  <button onClick={() => toggle(u)}><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          <input className="input" placeholder="Rechercher des membres…"
                 value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {users.map((u) => {
            const sel = !!picked[u.id];
            return (
              <button key={u.id} onClick={() => toggle(u)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-ink-100/60 text-left">
                <Avatar user={u} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-ink-900">{u.display_name}</div>
                  <div className="truncate text-xs text-ink-500">@{u.username}</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${sel ? "border-brand-600 bg-brand-600" : "border-ink-300"}`}>
                  {sel && <Check className="w-4 h-4 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 p-4 border-t border-ink-100">
          <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button onClick={submit} className="btn-primary flex-1" disabled={busy}>
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
