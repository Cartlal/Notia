import { FileText, Music } from "lucide-react";
import type { Attachment } from "@/lib/types";

export function AttachmentsPanel({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
      <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Attachments</p>
      <div className="flex flex-col gap-2">
        {attachments.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-lg border p-2" style={{ borderColor: "var(--color-border)" }}>
            {a.kind === "image" && <img src={a.url} alt={a.fileName} className="w-10 h-10 rounded object-cover shrink-0" />}
            {a.kind === "audio" && <Music size={18} className="shrink-0" style={{ color: "var(--color-text-muted)" }} />}
            {a.kind === "file" && <FileText size={18} className="shrink-0" style={{ color: "var(--color-text-muted)" }} />}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{a.fileName}</p>
              {a.kind === "audio" && <audio controls src={a.url} className="w-full mt-1 h-8" />}
            </div>
            {a.kind !== "audio" && (
              <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 shrink-0">
                Open
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
