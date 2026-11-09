import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered, CheckSquare,
  Quote, Code, Link as LinkIcon, Image as ImageIcon, Table as TableIcon, Undo2, Redo2,
  Heading1, Heading2, Heading3, Paperclip, Highlighter, Type, Rows3, Grid2x2, FileText,
} from "lucide-react";
import { FontSize } from "@/lib/fontSize";

const FONTS = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter, ui-sans-serif, sans-serif" },
  { label: "Comic Neue", value: "'Comic Neue', cursive" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Mono", value: "'JetBrains Mono', ui-monospace, monospace" },
];

const SIZES = [
  { label: "Normal", value: "" },
  { label: "Small", value: "13px" },
  { label: "Large", value: "20px" },
  { label: "XL", value: "26px" },
];

const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"];

export type PaperStyle = "none" | "ruled" | "grid";

export function NoteEditor({
  content,
  onChange,
  onUploadImage,
  editable = true,
  paperStyle = "none",
  onPaperStyleChange,
}: {
  content: string;
  onChange: (html: string, text: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  editable?: boolean;
  paperStyle?: PaperStyle;
  onPaperStyleChange?: (style: PaperStyle) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHighlights, setShowHighlights] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    editable,
    editorProps: { attributes: { class: `tiptap paper-${paperStyle}` } },
    onUpdate: ({ editor }) => onChange(editor.getHTML(), editor.getText()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    dom.classList.remove("paper-none", "paper-ruled", "paper-grid");
    dom.classList.add(`paper-${paperStyle}`);
  }, [editor, paperStyle]);

  if (!editor) return null;

  const wordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;
  const charCount = editor.getText().length;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await onUploadImage(file);
    editor?.chain().focus().setImage({ src: url }).run();
  }

  const btn = (active: boolean) =>
    `p-2 rounded-lg hover-surface ${active ? "bg-brand-100 text-brand-700" : ""}`;

  return (
    <div className="flex flex-col h-full">
      {editable && (
        <div
          className="flex flex-wrap items-center gap-0.5 border-b pb-2 mb-3"
          style={{ borderColor: "var(--color-border)" }}
          // A <button>'s default mousedown behavior steals focus (and with
          // it, the browser's text selection) from the contenteditable
          // editor before React's onClick ever fires — so every command
          // below would silently apply to an empty selection. Selects are
          // excluded: preventing their mousedown stops the dropdown from
          // opening at all.
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) e.preventDefault();
          }}
        >
          <select
            className="text-sm rounded-md px-1.5 py-1.5 outline-none border mr-1"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setFontFamily(v).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
            title="Font"
          >
            {FONTS.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            className="text-sm rounded-md px-1.5 py-1.5 outline-none border mr-1"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setFontSize(v).run();
              else editor.chain().focus().unsetFontSize().run();
            }}
            title="Text size"
          >
            {SIZES.map((s) => (
              <option key={s.label} value={s.value}>{s.label}</option>
            ))}
          </select>
          <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--color-border)" }} />
          <button className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></button>
          <button className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></button>
          <button className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></button>
          <button className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></button>
          <div className="relative">
            <button className={btn(editor.isActive("highlight"))} onClick={() => setShowHighlights((v) => !v)} title="Highlight">
              <Highlighter size={16} />
            </button>
            {showHighlights && (
              <div className="absolute top-full mt-1 flex gap-1 p-2 rounded-lg shadow-md note-card z-10">
                {HIGHLIGHTS.map((c) => (
                  <button
                    key={c}
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: c, borderColor: "var(--color-border)" }}
                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlights(false); }}
                  />
                ))}
                <button
                  className="w-5 h-5 rounded-full border flex items-center justify-center text-xs"
                  style={{ borderColor: "var(--color-border)" }}
                  title="Remove highlight"
                  onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlights(false); }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--color-border)" }} />
          <button className={btn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={16} /></button>
          <button className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></button>
          <button className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></button>
          <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--color-border)" }} />
          <button className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></button>
          <button className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></button>
          <button className={btn(editor.isActive("taskList"))} onClick={() => editor.chain().focus().toggleTaskList().run()}><CheckSquare size={16} /></button>
          <button className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></button>
          <button className={btn(editor.isActive("codeBlock"))} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code size={16} /></button>
          <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--color-border)" }} />
          <button
            className={btn(editor.isActive("link"))}
            onClick={() => {
              const url = window.prompt("Link URL");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
          >
            <LinkIcon size={16} />
          </button>
          <button className={btn(false)} onClick={() => fileInputRef.current?.click()} title="Insert image">
            <ImageIcon size={16} />
          </button>
          <button className={btn(false)} onClick={() => fileInputRef.current?.click()} title="Attach file">
            <Paperclip size={16} />
          </button>
          <button
            className={btn(false)}
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <TableIcon size={16} />
          </button>
          <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--color-border)" }} />
          {onPaperStyleChange && (
            <>
              <button className={btn(paperStyle === "none")} title="Plain page" onClick={() => onPaperStyleChange("none")}><FileText size={16} /></button>
              <button className={btn(paperStyle === "ruled")} title="Ruled page" onClick={() => onPaperStyleChange("ruled")}><Rows3 size={16} /></button>
              <button className={btn(paperStyle === "grid")} title="Grid page" onClick={() => onPaperStyleChange("grid")}><Grid2x2 size={16} /></button>
              <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--color-border)" }} />
            </>
          )}
          <button className={btn(false)} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></button>
          <button className={btn(false)} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      <EditorContent editor={editor} className="flex-1 max-w-none focus:outline-none" />

      {editable && (
        <div className="pt-2 text-xs text-right flex items-center justify-end gap-1" style={{ color: "var(--color-text-muted)" }}>
          <Type size={12} /> {wordCount} words · {charCount} characters
        </div>
      )}
    </div>
  );
}
