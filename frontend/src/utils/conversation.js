/** Renvoie le titre + avatar d'une conversation vue par `currentUser`. */
export function convDisplay(conv, currentUser) {
  if (!conv) return { name: "", avatar_url: null, peer: null };
  if (conv.type === "group") {
    return {
      name: conv.name || "Groupe",
      avatar_url: conv.avatar_url,
      peer: null,
      subtitle: `${conv.members?.length || 0} membres`,
    };
  }
  const other = (conv.members || []).find((m) => m.id !== currentUser?.id);
  return {
    name: other?.display_name || other?.username || "Conversation",
    avatar_url: other?.avatar_url,
    peer: other,
    subtitle: other?.status === "online" ? "en ligne" : "hors ligne",
  };
}
