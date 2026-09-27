"use client";
import { useState, type FormEvent } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link2, ImagePlus, Undo2, Redo2, Table2, Minus, Code, X } from "lucide-react";
import { safeLink, type RichNode } from "@/lib/blog/model";
import styles from "./blog.module.css";

export function ImageUpload({ onInsert, onCancel, onBusy }: { onInsert: (path: string, alt: string, caption: string) => void; onCancel: () => void; onBusy: (busy: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null); const [alt, setAlt] = useState(""); const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function upload(event: FormEvent) {
    event.preventDefault(); if (!file || !alt.trim()) return;
    if (file.size > 3_000_000) { setError("Choose an image smaller than 3 MB."); return; }
    setBusy(true); onBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/blog/images", { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Image upload failed.");
      onInsert(data.path, alt.trim(), caption.trim());
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); onBusy(false); }
  }
  return <form className={styles.insertPanel} onSubmit={upload}><fieldset disabled={busy}>
    <legend>Add an image</legend><p className="admin-help">JPEG, PNG, WebP or AVIF, up to 3 MB. Images are optimized automatically.</p>
    <label className="admin-field">Image file<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" required onChange={event => setFile(event.target.files?.[0] ?? null)}/></label>
    <label className="admin-field">Image description (alt text)<input required maxLength={500} value={alt} onChange={event => setAlt(event.target.value)} placeholder="Describe what the image shows"/></label>
    <label className="admin-field">Caption / photo credit (optional)<input maxLength={500} value={caption} onChange={event => setCaption(event.target.value)}/></label>
    {error && <p role="alert" className="admin-message error">{error}</p>}
    <div className={styles.actions}><button className="admin-button primary" type="submit">{busy ? "Uploading…" : "Upload image"}</button><button className="admin-button" type="button" onClick={onCancel}>Cancel</button></div>
  </fieldset></form>;
}

export function BlogRichEditor({ initial, onChange, onBusy, disabled }: { initial: RichNode; onChange: (body: RichNode) => void; onBusy: (busy: boolean) => void; disabled: boolean }) {
  const [panel, setPanel] = useState<"link" | "image" | "image-text" | null>(null); const [href, setHref] = useState(""); const [error, setError] = useState("");
  const [imageAlt, setImageAlt] = useState(""); const [imageCaption, setImageCaption] = useState("");
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, defaultProtocol: "https" } }), Image.configure({ allowBase64: false }), TableKit.configure({ table: { resizable: false } })],
    content: initial, immediatelyRender: false,
    editorProps: { attributes: { role: "textbox", "aria-label": "Article body", "aria-multiline": "true", spellcheck: "true" } },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichNode),
  });
  const observedSelection = useEditorState({ editor, selector: ({ editor }) => editor ? ({ bold: editor.isActive("bold"), italic: editor.isActive("italic"), underline: editor.isActive("underline"), strike: editor.isActive("strike"), bulletList: editor.isActive("bulletList"), orderedList: editor.isActive("orderedList"), blockquote: editor.isActive("blockquote"), codeBlock: editor.isActive("codeBlock"), link: editor.isActive("link"), image: editor.isActive("image"), table: editor.isActive("table"), heading: editor.isActive("heading") ? String(editor.getAttributes("heading").level) : "paragraph", undo: editor.can().undo(), redo: editor.can().redo() }) : null });
  const selection = observedSelection ?? { bold: false, italic: false, underline: false, strike: false, bulletList: false, orderedList: false, blockquote: false, codeBlock: false, link: false, image: false, table: false, heading: "paragraph", undo: false, redo: false };
  if (!editor) return <p role="status">Loading editor…</p>;
  const buttons = [
    { label: "Bold", Icon: Bold, active: selection.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: "Italic", Icon: Italic, active: selection.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Underline", Icon: Underline, active: selection.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: "Strikethrough", Icon: Strikethrough, active: selection.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { label: "Bullet list", Icon: List, active: selection.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", Icon: ListOrdered, active: selection.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Quote", Icon: Quote, active: selection.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Code block", Icon: Code, active: selection.codeBlock, run: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: "Add or edit link", Icon: Link2, active: selection.link, run: () => { setHref(editor.getAttributes("link").href ?? "https://"); setError(""); setPanel("link"); } },
    { label: "Insert image", Icon: ImagePlus, active: false, run: () => setPanel("image") },
    { label: "Insert table", Icon: Table2, active: selection.table, run: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: "Divider", Icon: Minus, active: false, run: () => editor.chain().focus().setHorizontalRule().run() },
  ];
  return <div className={styles.editor}>
    <fieldset disabled={disabled} className={styles.editorControls}>
      <div className={styles.toolbar} role="group" aria-label="Text formatting">
        <select aria-label="Text style" value={selection.heading} onChange={event => event.target.value === "paragraph" ? editor.chain().focus().setParagraph().run() : editor.chain().focus().toggleHeading({ level: Number(event.target.value) as 2 | 3 | 4 }).run()}><option value="paragraph">Paragraph</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option></select>
        {buttons.map(({ label, Icon, active, run }) => <button key={label} type="button" aria-label={label} title={label} aria-pressed={active} onClick={run}><Icon size={17}/></button>)}
        <button type="button" aria-label="Undo" title="Undo" disabled={!selection.undo} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={17}/></button>
        <button type="button" aria-label="Redo" title="Redo" disabled={!selection.redo} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={17}/></button>
      </div>
      {selection.table && <div className={styles.tableTools} role="group" aria-label="Table editing"><button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>Add row</button><button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>Add column</button><button type="button" onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</button><button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</button><button type="button" onClick={() => editor.chain().focus().deleteTable().run()}>Remove table</button></div>}
      {selection.image && <div className={styles.tableTools}><button type="button" onClick={() => { const attrs = editor.getAttributes("image"); setImageAlt(attrs.alt ?? ""); setImageCaption(attrs.title ?? ""); setPanel("image-text"); }}>Edit image description / caption</button><button type="button" onClick={() => editor.chain().focus().deleteSelection().run()}>Remove selected image</button></div>}
    </fieldset>
    {panel === "link" && <form className={styles.insertPanel} onSubmit={event => { event.preventDefault(); if (!safeLink(href.trim())) { setError("Enter a valid https://, http://, mailto: or /site link."); return; } editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run(); setPanel(null); }}><label className="admin-field">Link URL<input autoFocus value={href} onChange={event => setHref(event.target.value)} maxLength={2000}/></label>{error && <p role="alert">{error}</p>}<div className={styles.actions}><button className="admin-button primary" type="submit">Apply link</button><button className="admin-button" type="button" onClick={() => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); setPanel(null); }}>Remove link</button><button className="admin-button" type="button" onClick={() => setPanel(null)}><X size={15}/> Cancel</button></div></form>}
    {panel === "image" && <ImageUpload onBusy={onBusy} onCancel={() => setPanel(null)} onInsert={(src, alt, title) => { editor.chain().focus().setImage({ src, alt, title }).run(); setPanel(null); }}/>} 
    {panel === "image-text" && <form className={styles.insertPanel} onSubmit={event => { event.preventDefault(); editor.chain().focus().updateAttributes("image", { alt: imageAlt.trim(), title: imageCaption.trim() }).run(); setPanel(null); }}><label className="admin-field">Image description (alt text)<input required value={imageAlt} onChange={event => setImageAlt(event.target.value)} maxLength={500}/></label><label className="admin-field">Caption / photo credit<input value={imageCaption} onChange={event => setImageCaption(event.target.value)} maxLength={500}/></label><div className={styles.actions}><button className="admin-button primary">Update image text</button><button className="admin-button" type="button" onClick={() => setPanel(null)}>Cancel</button></div></form>}
    <div inert={disabled || undefined}><EditorContent editor={editor}/></div>
  </div>;
}
