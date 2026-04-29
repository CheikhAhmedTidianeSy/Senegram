import { useRef, useState } from "react";
import { Paperclip, Send, Smile, Image as ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const EMOJIS = ["😀","😂","🥰","😍","🔥","👍","🙏","🎉","❤️","🇸🇳","😎","🙌","💪","😢","😮"];

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [pending, setPending]     = useState(null); // fichier prêt à envoyer
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const imageRef = useRef(null);

  function onChange(e) {
    setText(e.target.value);
    onTyping?.(true);
  }

  async function pickAndUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload/file", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPending(data.file);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload impossible");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!text.trim() && !pending) return;

    let type = "text";
    const attachments = [];
    if (pending) {
      attachments.push(pending);
      if (pending.mime_type?.startsWith("image/")) type = "image";
      else if (pending.mime_type?.startsWith("video/")) type = "video";
      else if (pending.mime_type?.startsWith("audio/")) type = "audio";
      else type = "file";
    }

    await onSend({ content: text.trim() || null, type, attachments });
    setText(""); setPending(null); setShowEmoji(false);
    onTyping?.(false);
  }

  return (
    <div className="p-3 bg-white border-t border-ink-100 relative">
      {pending && (
        <div className="flex items-center gap-3 p-2 mb-2 rounded-xl bg-ink-100">
          <ImageIcon className="w-5 h-5 text-brand-700" />
          <div className="flex-1 min-w-0 text-sm truncate">{pending.file_name}</div>
          <button onClick={() => setPending(null)} className="p-1 hover:bg-ink-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="absolute bottom-full mb-2 left-3 p-2 card grid grid-cols-5 gap-1 z-20">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setText((t) => t + e)} className="text-xl hover:bg-ink-100 rounded p-1">
              {e}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <button type="button" className="btn-ghost p-2" onClick={() => setShowEmoji((v) => !v)}>
          <Smile className="w-5 h-5" />
        </button>
        <button type="button" className="btn-ghost p-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Paperclip className="w-5 h-5" />
        </button>
        <button type="button" className="btn-ghost p-2" onClick={() => imageRef.current?.click()} disabled={uploading}>
          <ImageIcon className="w-5 h-5" />
        </button>
        <input type="file" ref={fileRef} hidden
               onChange={(e) => pickAndUpload(e.target.files?.[0])} />
        <input type="file" ref={imageRef} hidden accept="image/*,video/*"
               onChange={(e) => pickAndUpload(e.target.files?.[0])} />

        <textarea
          rows={1}
          className="input flex-1 resize-none max-h-32"
          placeholder="Écris un message…"
          value={text}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <button type="submit" className="btn-primary p-3"
                disabled={uploading || (!text.trim() && !pending)}>
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
