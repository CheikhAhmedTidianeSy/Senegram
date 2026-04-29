import { useEffect, useMemo, useRef, useState } from "react";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import Avatar       from "./Avatar";
import MessageBubble from "./MessageBubble";
import MessageInput  from "./MessageInput";

import api        from "../services/api";
import { useAuth }    from "../context/AuthContext";
import { useSocket }  from "../context/SocketContext";
import { useCall }    from "../context/CallContext";
import { convDisplay } from "../utils/conversation";

export default function ChatWindow({ conversation, onBack, onUpdated }) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { startCall } = useCall();

  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [typing,   setTyping]   = useState(null);

  const scrollerRef = useRef(null);
  const typingTimer = useRef(null);

  const d = useMemo(() => convDisplay(conversation, user), [conversation, user]);
  const isGroup = conversation?.type === "group";
  const isOnline =
    !isGroup && d.peer &&
    (onlineUsers[d.peer.id] === "online" || d.peer.status === "online");

  // Load messages
  useEffect(() => {
    if (!conversation) return;
    let live = true;
    setLoading(true);
    api.get(`/messages/conversation/${conversation.id}`)
      .then(({ data }) => { if (live) setMessages(data.messages); })
      .finally(() => { if (live) setLoading(false); });

    api.post(`/conversations/${conversation.id}/read`).catch(() => {});
    return () => { live = false; };
  }, [conversation?.id]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !conversation) return;
    socket.emit("conversation:join", { conversation_id: conversation.id });

    const onNew = (m) => {
      if (m.conversation_id !== conversation.id) {
        // Notification discrète sinon
        return;
      }
      setMessages((prev) => [...prev, m]);
      if (m.sender_id !== user.id) {
        socket.emit("message:read", {
          conversation_id: conversation.id,
          message_id: m.id,
        });
      }
    };
    const onEdited = (m) => {
      if (m.conversation_id !== conversation.id) return;
      setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    };
    const onDeleted = ({ id, conversation_id }) => {
      if (conversation_id !== conversation.id) return;
      setMessages((prev) => prev.map((x) => (x.id === id ? { ...x, is_deleted: 1, content: null } : x)));
    };
    const onTyping = ({ conversation_id, user_id, username, is_typing }) => {
      if (conversation_id !== conversation.id || user_id === user.id) return;
      setTyping(is_typing ? username : null);
    };

    socket.on("message:new",     onNew);
    socket.on("message:edited",  onEdited);
    socket.on("message:deleted", onDeleted);
    socket.on("typing",          onTyping);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:edited", onEdited);
      socket.off("message:deleted", onDeleted);
      socket.off("typing", onTyping);
    };
  }, [socket, conversation?.id, user?.id]);

  // Autoscroll bas
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage({ content, type, attachments }) {
    try {
      const { data } = await api.post(`/messages/conversation/${conversation.id}`, {
        content, type, attachments,
      });
      setMessages((prev) => {
        // Si le serveur a déjà broadcast via socket on évite le doublon
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Impossible d'envoyer");
    }
  }

  function onTyping(is) {
    if (!socket || !conversation) return;
    socket.emit("typing", { conversation_id: conversation.id, is_typing: is });
    clearTimeout(typingTimer.current);
    if (is) {
      typingTimer.current = setTimeout(() => {
        socket.emit("typing", { conversation_id: conversation.id, is_typing: false });
      }, 2500);
    }
  }

  function call(type) {
    if (isGroup) {
      toast("Les appels de groupe arrivent bientôt");
      return;
    }
    if (!d.peer) return;
    startCall(d.peer, conversation.id, type);
  }

  if (!conversation) {
    return (
      <div className="h-full chat-empty-bg flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-senegal-green
                        flex items-center justify-center text-white text-4xl mb-5 shadow-soft">
          💬
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Bienvenue sur Senegram</h2>
        <p className="text-ink-500 max-w-md mt-2">
          Sélectionne une discussion ou crée-en une nouvelle pour commencer à échanger.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-ink-50">
      {/* Header */}
      <div className="h-16 flex items-center gap-3 px-4 bg-white border-b border-ink-100">
        <button className="btn-ghost p-2 md:hidden" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar
          user={{ display_name: d.name, avatar_url: d.avatar_url, username: d.name }}
          size={42}
          online={isOnline}
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink-900 truncate">{d.name}</div>
          <div className="text-xs text-ink-500 truncate">
            {typing ? `${typing} est en train d'écrire…` : d.subtitle}
          </div>
        </div>
        <button className="btn-ghost p-2" onClick={() => call("audio")} title="Appel audio">
          <Phone className="w-5 h-5" />
        </button>
        <button className="btn-ghost p-2" onClick={() => call("video")} title="Appel vidéo">
          <Video className="w-5 h-5" />
        </button>
        <button className="btn-ghost p-2">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {loading
          ? <div className="text-center text-ink-500 text-sm">Chargement…</div>
          : messages.length === 0
            ? <div className="text-center text-ink-500 text-sm mt-10">
                Aucun message. Dis bonjour 👋
              </div>
            : messages.map((m, idx) => {
                const prev = messages[idx - 1];
                const showSender = isGroup
                  && m.sender_id !== user.id
                  && (!prev || prev.sender_id !== m.sender_id);
                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMe={m.sender_id === user.id}
                    showSender={showSender}
                  />
                );
              })
        }
        {typing && (
          <div className="text-xs text-ink-500 italic">…</div>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} onTyping={onTyping} />
    </div>
  );
}
