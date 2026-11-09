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
import { useEffect, useRef } from "react";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered, CheckSquare,
  Quote, Code, Link as LinkIcon, Image as ImageIcon, Table as TableIcon, Undo2, Redo2,
  Heading1, Heading2, Heading3, Paperclip,
} from "lucide-react";

export function NoteEditor({
  content,
  onChange,
  onUploadImage,
  editable = true,
}: {
  content: string;
  onChange: (html: string, text: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  editable?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML(), editor.getText()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

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
    `p-2 rounded-lg hover:bg-brand-50 ${active ? "bg-brand-100 text-brand-700" : ""}`;

  return (
    <div className="flex flex-col h-full">
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b pb-2 mb-3" style={{ borderColor: "var(--color-border)" }}>
          <button className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></button>
          <button className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></button>
          <button className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></button>
          <button className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></button>
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
          <button className={btn(false)} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></button>
          <button className={btn(false)} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      <EditorContent editor={editor} className="flex-1 prose prose-sm max-w-none focus:outline-none" />

      {editable && (
        <div className="pt-2 text-xs text-right" style={{ color: "var(--color-text-muted)" }}>
          {wordCount} words · {charCount} characters
        </div>
      )}
    </div>
  );
}
