import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Plus, Search, Settings, LogOut } from "lucide-react";
import toast from "react-hot-toast";

import Avatar         from "../components/Avatar";
import ChatList       from "../components/ChatList";
import ChatWindow     from "../components/ChatWindow";
import NewChatModal   from "../components/NewChatModal";
import NewGroupModal  from "../components/NewGroupModal";
import ProfileModal   from "../components/ProfileModal";

import api            from "../services/api";
import { useAuth }    from "../context/AuthContext";
import { useSocket }  from "../context/SocketContext";

export default function Home() {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [active,        setActive]        = useState(null);
  const [q,             setQ]             = useState("");

  const [modalNew,      setModalNew]      = useState(false);
  const [modalGroup,    setModalGroup]    = useState(false);
  const [modalProfile,  setModalProfile]  = useState(false);

  const load = useCallback(() => {
    api.get("/conversations")
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => toast.error("Impossible de charger les discussions"));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Rafraîchir la liste quand un nouveau message arrive partout
  useEffect(() => {
    if (!socket) return;
    const onNew = () => load();
    socket.on("message:new", onNew);
    return () => socket.off("message:new", onNew);
  }, [socket, load]);

  async function openPrivate(target) {
    try {
      const { data } = await api.post("/conversations/private", { other_user_id: target.id });
      setModalNew(false);
      setActive(data.conversation);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Impossible d'ouvrir la discussion");
    }
  }

  function onGroupCreated(conv) {
    setModalGroup(false);
    setModalNew(false);
    setActive(conv);
    load();
  }

  const filtered = conversations.filter((c) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    const name = c.type === "group"
      ? c.name
      : (c.members || []).find((m) => m.id !== user.id)?.display_name || "";
    return name?.toLowerCase().includes(needle);
  });

  return (
    <div className="h-screen flex bg-ink-100">
      {/* Sidebar */}
      <aside className={`${active ? "hidden md:flex" : "flex"} flex-col w-full md:w-[360px] bg-white border-r border-ink-100`}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-ink-100">
          <button onClick={() => setModalProfile(true)} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar user={user} size={40} online />
            <div className="min-w-0 text-left">
              <div className="font-semibold text-ink-900 truncate">{user.display_name}</div>
              <div className="text-xs text-brand-600">en ligne</div>
            </div>
          </button>
          <button onClick={() => setModalNew(true)} className="btn-primary p-2.5">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              className="input pl-10"
              placeholder="Rechercher…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ChatList
            conversations={filtered}
            currentUser={user}
            activeId={active?.id}
            onSelect={(c) => setActive(c)}
            onlineUsers={onlineUsers}
          />
        </div>

        <div className="p-2 border-t border-ink-100 flex items-center gap-2">
          <button onClick={() => setModalProfile(true)} className="btn-ghost p-2">
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center font-display text-brand-700 font-bold">
            <MessageCircle className="w-4 h-4 inline -mt-1" /> Senegram
          </div>
          <button onClick={logout} className="btn-ghost p-2 text-senegal-red">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <main className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        <ChatWindow
          conversation={active}
          onBack={() => setActive(null)}
          onUpdated={load}
        />
      </main>

      {/* Modales */}
      {modalNew && (
        <NewChatModal
          onClose={() => setModalNew(false)}
          onOpenPrivate={openPrivate}
          onOpenNewGroup={() => { setModalNew(false); setModalGroup(true); }}
        />
      )}
      {modalGroup && (
        <NewGroupModal
          onClose={() => setModalGroup(false)}
          onCreated={onGroupCreated}
        />
      )}
      {modalProfile && (
        <ProfileModal onClose={() => setModalProfile(false)} />
      )}
    </div>
  );
}
