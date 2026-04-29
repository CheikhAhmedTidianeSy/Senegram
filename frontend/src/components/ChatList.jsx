import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import Avatar from "./Avatar";
import { convDisplay } from "../utils/conversation";

function timeShort(d) {
  if (!d) return "";
  try {
    return formatDistanceToNowStrict(new Date(d), { addSuffix: false, locale: fr });
  } catch { return ""; }
}

export default function ChatList({ conversations, currentUser, activeId, onSelect, onlineUsers }) {
  if (!conversations.length) {
    return (
      <div className="p-8 text-center text-ink-500 text-sm">
        Aucune discussion — démarre avec le bouton <b>+</b> ci-dessus.
      </div>
    );
  }
  return (
    <ul>
      {conversations.map((c) => {
        const d = convDisplay(c, currentUser);
        const isActive = c.id === activeId;
        const isOnline =
          c.type === "private" &&
          d.peer &&
          (onlineUsers[d.peer.id] === "online" || d.peer.status === "online");

        const last = c.last_message;
        const lastPreview = last
          ? last.type === "text"
            ? last.content
            : last.type === "image" ? "📷 Photo"
            : last.type === "video" ? "🎥 Vidéo"
            : last.type === "audio" ? "🎙 Audio"
            : last.type === "file"  ? "📎 Fichier"
            : last.type === "call"  ? "📞 Appel"
            : last.content
          : "Démarrez la conversation";

        return (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition
                ${isActive ? "bg-brand-50" : "hover:bg-ink-100/60"}`}
            >
              <Avatar
                user={{ display_name: d.name, avatar_url: d.avatar_url, username: d.name }}
                size={48}
                online={isOnline}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className={`truncate font-semibold ${isActive ? "text-brand-900" : "text-ink-900"}`}>
                    {d.name}
                  </div>
                  <div className="text-xs text-ink-500 flex-none">
                    {timeShort(last?.created_at || c.updated_at)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm text-ink-500">{lastPreview}</div>
                  {c.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                                     text-xs font-semibold rounded-full bg-brand-600 text-white">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
