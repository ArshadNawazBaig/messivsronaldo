"use client";
/* eslint-disable @next/next/no-img-element -- Uploads are optimized on the server and draft images require session cookies. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, FileText, ImagePlus, Plus, Save, Send, Trash2, Undo2, Eye, Pencil, Search } from "lucide-react";
import { languageNames, locales, localizedPath, type Locale } from "@/lib/i18n/config";
import { emptyDocument, documentText, type BlogDraft, type BlogPost, type BlogCommand } from "@/lib/blog/model";
import { RichBody } from "@/components/blog/rich-body";
import { BlogRichEditor, ImageUpload } from "./blog-rich-editor";
import styles from "./blog.module.css";

function status(post: BlogPost) { return post.deleted ? "Trash" : post.published ? post.draftChanged ? "Unpublished changes" : "Published" : "Draft"; }
function newPost(locale: Locale): BlogPost {
  return { id: crypto.randomUUID(), locale, slug: "", revision: 0, draft: { title: "", description: "", category: "Analysis", summary: "", body: emptyDocument, image: null, citations: [] }, published: null, deleted: false, draftChanged: false, createdAt: "", updatedAt: "" };
}
export default function BlogManager() {
  const [locale, setLocale] = useState<Locale>("en"); const [posts, setPosts] = useState<BlogPost[]>([]); const [selected, setSelected] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("all"); const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/blog?locale=${locale}`, { cache: "no-store" }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Articles could not be loaded."); if (active) setPosts(data.posts); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale, reload]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || anchor.getAttribute("href")?.startsWith("#")) return;
      if (busy || !window.confirm("You have unsaved article changes. Leave this page and discard them?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload); document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", click, true); };
  }, [dirty, busy]);
  function canLeave() { return !busy && (!dirty || window.confirm("Discard unsaved changes to this article?")); }
  function open(post: BlogPost) { if (canLeave()) { setSelected(post); setDirty(false); setError(""); } }
  const shown = posts.filter(post => (filter === "trash" ? post.deleted : !post.deleted && (filter === "all" || filter === "published" && !!post.published || filter === "draft" && (!post.published || post.draftChanged))) && `${post.draft.title} ${post.slug}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return <div className={`page-container admin-page ${styles.workspace}`}>
    <div className="admin-heading"><div><Link href="/admin" className="admin-back-link"><ArrowLeft size={15}/> Admin dashboard</Link><span className="eyebrow">THE RIVALRY · PUBLISHING</span><h1>Blog editor</h1><p>Write a story. Shape the conversation.</p></div><button className="admin-button primary" disabled={busy || loading} onClick={() => open(newPost(locale))}><Plus size={17}/> New article</button></div>
    <div className={styles.layout}>
      <aside className={`panel ${styles.library}`} aria-label="Article library"><label className="admin-field">Article language<select value={locale} disabled={busy} onChange={event => { if (!canLeave()) return; setSelected(null); setDirty(false); setLoading(true); setError(""); setPosts([]); setLocale(event.target.value as Locale); }}>{locales.map(value => <option key={value} value={value}>{languageNames[value]}</option>)}</select></label>
        <label className={styles.search}><Search size={16}/><input aria-label="Search articles" placeholder="Search articles…" value={query} onChange={event => setQuery(event.target.value)}/></label>
        <label className="admin-field">Show<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All articles</option><option value="published">Published</option><option value="draft">Drafts & changes</option><option value="trash">Trash</option></select></label>
        {loading && <p role="status" className="admin-help">Loading articles…</p>}
        {error && <div role="alert"><p className="admin-message error">{error}</p><button className="admin-button" onClick={() => { setLoading(true); setError(""); setReload(value => value + 1); }}>Retry</button></div>}
        <div className={styles.postList}>{shown.map(post => <button type="button" key={post.id} className={selected?.id === post.id ? styles.selected : ""} aria-current={selected?.id === post.id ? "true" : undefined} disabled={busy} onClick={() => open(post)}><span className={styles.postStatus}>{status(post)}</span><strong>{post.draft.title || "Untitled article"}</strong><small>{post.updatedAt.slice(0, 10)}</small></button>)}</div>
        {!loading && !error && !shown.length && <p className="admin-help">No articles match this view.</p>}
        <p className={styles.libraryNote}>Articles publish in the selected language. Use the same URL slug in another language to connect its translated version.</p>
      </aside>
      {selected ? <ArticleEditor key={`${selected.id}:${selected.revision}`} post={selected} onDirty={setDirty} onBusy={setBusy} onSaved={post => { setPosts(items => [post, ...items.filter(item => item.id !== post.id)]); setSelected(post); setDirty(false); }} onReload={() => { if (canLeave()) { setSelected(null); setDirty(false); setLoading(true); setReload(value => value + 1); } }}/>
        : <section className={`panel ${styles.empty}`}><FileText size={40}/><h2>Your next story starts here.</h2><p>Select an article to edit, or start a new draft.</p><button className="admin-button primary" disabled={busy || loading} onClick={() => open(newPost(locale))}><Plus size={16}/> New article</button></section>}
    </div>
  </div>;
}

function ArticleEditor({ post, onDirty, onBusy, onSaved, onReload }: { post: BlogPost; onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void; onSaved: (post: BlogPost) => void; onReload: () => void }) {
  const [draft, setDraft] = useState<BlogDraft>(post.draft); const [slug, setSlug] = useState(post.slug); const [customSlug, setCustomSlug] = useState(!!post.slug);
  const [preview, setPreview] = useState(false); const [uploadCover, setUploadCover] = useState(false); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState("");
  const [changed, setChanged] = useState(false);
  const locked = post.revision > 0 || post.id.startsWith("seed:");
  const blocked = busy || uploading;
  function change<K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) { setDraft(current => ({ ...current, [key]: value })); setChanged(true); onDirty(true); }
  function imageBusy(value: boolean) { setUploading(value); onBusy(value); }
  async function save(action: BlogCommand["action"]) {
    if (blocked) return;
    const confirmations = { delete: "Move this article to Trash? It will immediately disappear from the website. You can restore its draft later.", unpublish: "Unpublish this article? It will be removed from the website and kept as a draft." };
    if ((action === "delete" || action === "unpublish") && !window.confirm(confirmations[action])) return;
    setBusy(true); onBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id: post.id, revision: post.revision, locale: post.locale, slug, ...(["save", "publish"].includes(action) ? { draft } : {}) }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "The article could not be saved.");
      onSaved(result.post);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); onBusy(false); }
  }
  const wordCount = documentText(draft.body).split(/\s+/).filter(Boolean).length;
  return <section className={`panel ${styles.composer}`} aria-label="Article editor" aria-busy={blocked}>
    <div className={styles.composerHeading}><div><span className="section-kicker">{languageNames[post.locale]} · {status(post)}</span><h2>{post.deleted ? "Article in Trash" : post.createdAt ? "Edit article" : "New article"}</h2></div><span className={styles.saveState} role="status">{busy ? "Saving…" : uploading ? "Uploading…" : changed ? "Unsaved changes" : post.updatedAt ? `Saved ${new Date(post.updatedAt).toLocaleString()}` : "Not saved yet"}</span></div>
    {error && <div className="admin-message error" role="alert">{error}<button type="button" className="admin-text-button" onClick={onReload}>Reload articles</button></div>}
    {post.deleted ? <div className={styles.empty}><Trash2 size={32}/><h3>{draft.title}</h3><p>This article is no longer published. Restore it to continue editing.</p><button className="admin-button" disabled={blocked} onClick={() => save("restore")}><Undo2 size={16}/> Restore as draft</button></div> : <>
      <div className={styles.publishBar}><div className={styles.actions}><button className="admin-button" disabled={blocked} onClick={() => save("save")}><Save size={16}/> Save draft</button><button className="admin-button primary" disabled={blocked} onClick={() => save("publish")}><Send size={16}/>{post.published ? "Publish changes" : "Publish article"}</button><button className="admin-button" disabled={blocked} aria-pressed={preview} onClick={() => setPreview(value => !value)}>{preview ? <Pencil size={16}/> : <Eye size={16}/>} {preview ? "Continue editing" : "Preview"}</button></div>{post.published && <a className="admin-text-button" href={localizedPath(`/insights/${post.slug}`, post.locale)} target="_blank" rel="noopener noreferrer">View live <ArrowUpRight size={14}/></a>}</div>
      <p className="admin-help">{post.published ? "Saving a draft keeps the current article live. Publish changes when your edit is ready." : "Drafts are private. Publishing adds this article to the website and sitemap."}</p>
      {preview ? <div className={styles.preview} lang={post.locale} dir={post.locale === "ar" ? "rtl" : "ltr"}><span className="eyebrow">{draft.category}</span><h1>{draft.title || "Untitled article"}</h1><p className={styles.excerpt}>{draft.description}</p>{draft.image && <figure><img src={draft.image.path} alt={draft.image.alt}/>{draft.image.caption && <figcaption>{draft.image.caption}</figcaption>}</figure>}{draft.summary && <aside className={styles.previewSummary}>{draft.summary}</aside>}<RichBody body={draft.body}/>{draft.citations.length > 0 && <div><h2>Sources & further reading</h2>{draft.citations.map((source, index) => <p key={index}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></p>)}</div>}</div> : <div hidden={preview}>
        <fieldset disabled={blocked} className={styles.fields}>
          <label className="admin-field">Article title<input className={styles.titleInput} lang={post.locale} dir="auto" maxLength={180} value={draft.title} placeholder="Give your story a headline" onChange={event => { change("title", event.target.value); if (!locked && !customSlug) setSlug(event.target.value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120)); }}/></label>
          <div className={styles.metaGrid}><label className="admin-field">URL slug<input aria-label="URL slug" disabled={locked} maxLength={120} value={slug} placeholder="messi-ronaldo-latest-analysis" onChange={event => { setCustomSlug(true); setSlug(event.target.value); setChanged(true); onDirty(true); }}/><small className="admin-help">{localizedPath(`/insights/${slug || "your-article"}`, post.locale)}{locked ? " · URL fixed after first save" : " · lowercase letters, numbers and hyphens"}</small></label><label className="admin-field">Category<input maxLength={80} value={draft.category} dir="auto" onChange={event => change("category", event.target.value)}/></label></div>
          <label className="admin-field">Excerpt / search description<textarea maxLength={500} rows={3} dir="auto" value={draft.description} placeholder="A short introduction for article cards and search results" onChange={event => change("description", event.target.value)}/></label>
          <label className="admin-field">At a glance (optional)<textarea maxLength={2000} rows={2} dir="auto" value={draft.summary} onChange={event => change("summary", event.target.value)} placeholder="A concise answer or takeaway"/></label>
          <div className={styles.cover}><strong>Cover image</strong>{draft.image ? <><div className={styles.coverPreview}><img src={draft.image.path} alt={draft.image.alt}/></div><label className="admin-field">Cover image alt text<input required maxLength={500} value={draft.image.alt} onChange={event => change("image", { ...draft.image!, alt: event.target.value })}/></label><label className="admin-field">Cover image caption / credit<input maxLength={500} value={draft.image.caption ?? ""} onChange={event => change("image", { ...draft.image!, caption: event.target.value })}/></label><button className="admin-text-button" onClick={() => change("image", null)}>Remove cover</button></> : <p className="admin-help">Shown above the article and when sharing its link.</p>}<button className="admin-button" onClick={() => setUploadCover(true)}><ImagePlus size={16}/>{draft.image ? "Replace cover image" : "Add cover image"}</button></div>
        </fieldset>
        {uploadCover && <ImageUpload onBusy={imageBusy} onCancel={() => setUploadCover(false)} onInsert={(path, alt, caption) => { change("image", { path, alt, caption }); setUploadCover(false); }}/>} 
        <div className={styles.bodyLabel}><strong>Article body</strong><span>{wordCount.toLocaleString()} words · {Math.max(1, Math.ceil(wordCount / 200))} min read</span></div>
        <div dir={post.locale === "ar" ? "rtl" : "ltr"} lang={post.locale}><BlogRichEditor initial={draft.body} onChange={body => change("body", body)} onBusy={imageBusy} disabled={blocked}/></div>
        <fieldset disabled={blocked} className={styles.sources}><legend>Sources & further reading</legend><p className="admin-help">Add references for factual claims. These appear at the end of the article.</p>{draft.citations.map((source, index) => <div className={styles.sourceRow} key={index}><label className="admin-field">Source title<input value={source.title} maxLength={200} onChange={event => change("citations", draft.citations.map((item, position) => position === index ? { ...item, title: event.target.value } : item))}/></label><label className="admin-field">Source URL<input type="url" maxLength={2000} value={source.url} placeholder="https://…" onChange={event => change("citations", draft.citations.map((item, position) => position === index ? { ...item, url: event.target.value } : item))}/></label><button className="admin-button" aria-label={`Remove source ${index + 1}`} onClick={() => change("citations", draft.citations.filter((_, position) => position !== index))}><Trash2 size={15}/></button></div>)}<button className="admin-button" disabled={draft.citations.length >= 100} onClick={() => change("citations", [...draft.citations, { title: "", url: "" }])}><Plus size={15}/> Add source</button></fieldset>
      </div>}
      <div className={styles.dangerZone}>{post.published && <button className="admin-button" disabled={blocked || changed} onClick={() => save("unpublish")}>Unpublish article</button>}{(post.createdAt || post.id.startsWith("seed:")) && <button className="admin-button" disabled={blocked || changed} onClick={() => save("delete")}><Trash2 size={15}/> Move to Trash</button>}{changed && post.createdAt && <span className="admin-help">Save changes before unpublishing or deleting.</span>}</div>
    </>}
  </section>;
}
