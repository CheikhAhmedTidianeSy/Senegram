import { useEffect, useState } from "react";
import { X, Search, Users, MessageSquarePlus } from "lucide-react";
import Avatar from "./Avatar";
import api from "../services/api";

export default function NewChatModal({ onClose, onOpenPrivate, onOpenNewGroup }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api.get(`/users/search?q=${encodeURIComponent(q)}`)
        .then(({ data }) => setUsers(data.users))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-ink-100">
          <h3 className="font-semibold text-ink-900">Nouvelle discussion</h3>
          <button onClick={onClose} className="btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-900"
            onClick={onOpenNewGroup}
          >
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Créer un groupe</div>
              <div className="text-xs text-ink-500">Invite plusieurs amis</div>
            </div>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              autoFocus
              className="input pl-10"
              placeholder="Rechercher par nom ou username…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto pb-2">
          {loading && <div className="p-4 text-center text-ink-500 text-sm">Recherche…</div>}
          {!loading && users.length === 0 && (
            <div className="p-4 text-center text-ink-500 text-sm">Aucun résultat</div>
          )}
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => onOpenPrivate(u)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-100/60 text-left"
            >
              <Avatar user={u} size={42} />
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold text-ink-900">{u.display_name}</div>
                <div className="truncate text-xs text-ink-500">@{u.username}</div>
              </div>
              <MessageSquarePlus className="w-5 h-5 text-brand-700" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
