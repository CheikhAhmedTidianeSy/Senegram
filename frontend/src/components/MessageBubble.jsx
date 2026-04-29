import { format } from "date-fns";
import { Check, CheckCheck, FileText, Download } from "lucide-react";
import clsx from "clsx";
import { fileUrl } from "../services/api";

function timeHHMM(d) {
  try { return format(new Date(d), "HH:mm"); } catch { return ""; }
}

export default function MessageBubble({ message, isMe, showSender = false }) {
  const cls = clsx(
    "bubble",
    isMe ? "bubble-me" : "bubble-them",
    isMe ? "ml-auto" : "mr-auto",
  );

  return (
    <div className={clsx("w-full flex", isMe ? "justify-end" : "justify-start")}>
      <div className={cls}>
        {!isMe && showSender && (
          <div className="text-xs font-semibold text-brand-700 mb-0.5">
            {message.sender_name}
          </div>
        )}

        {message.type === "system" ? (
          <div className="italic text-sm">{message.content}</div>
        ) : (
          <>
            {message.attachments?.map((a) => (
              <Attachment key={a.id} a={a} />
            ))}
            {message.content && (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
          </>
        )}

        <div className={clsx(
          "flex items-center gap-1 text-[10px] mt-0.5",
          isMe ? "text-white/70 justify-end" : "text-ink-500 justify-end",
        )}>
          {message.is_edited && <span>modifié ·</span>}
          {timeHHMM(message.created_at)}
          {isMe && (
            message.read_by_all
              ? <CheckCheck className="w-3.5 h-3.5" />
              : <Check className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
    </div>
  );
}

function Attachment({ a }) {
  const url = fileUrl(a.url);
  if (a.mime_type?.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mb-1">
        <img src={url} alt={a.file_name} className="rounded-xl max-h-72 object-cover" />
      </a>
    );
  }
  if (a.mime_type?.startsWith("video/")) {
    return <video src={url} controls className="rounded-xl max-h-72 mb-1" />;
  }
  if (a.mime_type?.startsWith("audio/")) {
    return <audio src={url} controls className="w-full mb-1" />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
       className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 mb-1">
      <FileText className="w-5 h-5" />
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium">{a.file_name}</div>
        <div className="text-xs opacity-80">{Math.round((a.file_size || 0) / 1024)} Ko</div>
      </div>
      <Download className="w-4 h-4 opacity-70" />
    </a>
  );
}
