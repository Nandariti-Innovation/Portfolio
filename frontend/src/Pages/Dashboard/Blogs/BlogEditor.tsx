import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  Send,
  Settings2,
  Sparkles,
  Tag,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDashboardUi } from "@/features/dashboardUi/DashboardUi";
import supabase from "@/Superbase/client";
import { contentHtml, getReadingStats, slugify } from "./blogUtils";
import { RichTextEditor } from "./RichTextEditor";
import { emptyBlog, type Blog, type BlogStatus } from "./types";

type EditableBlog = ReturnType<typeof emptyBlog> & { id?: string; created_at?: string; updated_at?: string };

const inputClass = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white";

export default function BlogEditor() {
  const { collapsed } = useDashboardUi();
  const { blogId } = useParams();
  const navigate = useNavigate();
  const isNew = !blogId;
  const [blog, setBlog] = useState<EditableBlog>(emptyBlog());
  const [tagText, setTagText] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const html = contentHtml(blog.content);
  const stats = useMemo(() => getReadingStats(html), [html]);

  useEffect(() => {
    if (!blogId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error: failure } = await supabase.from("blogs").select("*").eq("id", blogId).single();
      if (cancelled) return;
      if (failure || !data) {
        setError(failure?.message || "Blog not found.");
      } else {
        const loaded = data as Blog;
        setBlog({ ...loaded, content: loaded.content || { type: "doc", html: "" } });
        setTagText((loaded.tags || []).join(", "));
      }
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [blogId]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setField = <K extends keyof EditableBlog>(key: K, value: EditableBlog[K]) => {
    setBlog((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setSavedMessage("");
  };

  const changeTitle = (title: string) => {
    setBlog((current) => ({ ...current, title, slug: slugTouched ? current.slug : slugify(title) || null }));
    setDirty(true);
    setSavedMessage("");
  };

  const normalizedTags = () => Array.from(new Set(tagText.split(",").map((item) => item.trim()).filter(Boolean))).slice(0, 12);

  const persist = async (nextStatus: BlogStatus = blog.status) => {
    const title = blog.title.trim();
    const slug = (blog.slug || slugify(title)).trim();
    if (!title) { setError("Add a title before saving."); return; }
    if (nextStatus === "published" && !slug) { setError("A slug is required before publishing."); return; }
    if (nextStatus === "published" && stats.wordCount === 0) { setError("Write some article content before publishing."); return; }

    setSaving(true);
    setError("");
    setSavedMessage("");
    const now = new Date().toISOString();
    const payload = {
      title,
      subtitle: blog.subtitle?.trim() || null,
      slug: slug || null,
      excerpt: blog.excerpt?.trim() || null,
      content: { type: "doc", html },
      cover_image_url: blog.cover_image_url?.trim() || null,
      cover_image_path: blog.cover_image_path?.trim() || null,
      cover_image_alt: blog.cover_image_alt?.trim() || null,
      tags: normalizedTags(),
      status: nextStatus,
      is_featured: blog.is_featured,
      word_count: stats.wordCount,
      reading_time_minutes: stats.readingTime,
      seo_title: blog.seo_title?.trim() || null,
      seo_description: blog.seo_description?.trim() || null,
      canonical_url: blog.canonical_url?.trim() || null,
      published_at: nextStatus === "published" ? blog.published_at || now : null,
      updated_at: now,
    };

    const result = blog.id
      ? await supabase.from("blogs").update(payload).eq("id", blog.id).select("*").single()
      : await supabase.from("blogs").insert(payload).select("*").single();

    setSaving(false);
    if (result.error || !result.data) {
      setError(result.error?.message || "The blog could not be saved.");
      return;
    }
    const saved = result.data as Blog;
    setBlog(saved);
    setTagText((saved.tags || []).join(", "));
    setDirty(false);
    setSavedMessage(nextStatus === "published" ? "Published successfully." : nextStatus === "draft" ? "Draft saved." : "Changes saved.");
    if (isNew) navigate(`/dashboard/blogs/${saved.id}/edit`, { replace: true });
  };

  const width = collapsed ? "w-[calc(100vw-70px)]" : "w-[calc(100vw-240px)]";
  if (loading) return <main className={`grid h-full place-items-center bg-background text-gray-500 dark:bg-darkthemebg ${width}`}><span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} />Loading editor…</span></main>;

  return (
    <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-800 transition-all dark:bg-darkthemebg dark:text-gray-100 ${width}`}>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/dashboard/blogs" className="grid size-10 shrink-0 place-items-center rounded-xl border border-gray-300 bg-white text-gray-600 hover:text-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300" aria-label="Back to blogs"><ArrowLeft size={18} /></Link>
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{isNew ? "New story" : "Edit story"}</p><h1 className="truncate text-xl font-bold sm:text-2xl">{blog.title || "Untitled draft"}</h1></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {savedMessage && <span className="hidden items-center gap-1.5 text-xs font-medium text-emerald-600 sm:flex"><CheckCircle2 size={15} />{savedMessage}</span>}
            {blog.id && <Link to={`/dashboard/blogs/${blog.id}/preview`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"><Eye size={16} />Preview</Link>}
            {blog.status === "published" && <button type="button" disabled={saving} onClick={() => void persist("draft")} className="h-10 cursor-pointer rounded-lg border border-amber-300 px-4 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30">Move to draft</button>}
            <button type="button" disabled={saving} onClick={() => void persist(blog.status)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Save</button>
            {blog.status !== "published" && <button type="button" disabled={saving} onClick={() => void persist("published")} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"><Send size={16} />Publish</button>}
          </div>
        </header>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:px-10">
              <input value={blog.title} maxLength={180} onChange={(event) => changeTitle(event.target.value)} placeholder="Story title" aria-label="Story title" className="w-full border-0 bg-transparent text-3xl font-bold leading-tight text-gray-950 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-gray-600 sm:text-5xl" />
              <textarea value={blog.subtitle || ""} maxLength={300} rows={2} onChange={(event) => setField("subtitle", event.target.value || null)} placeholder="Add a short subtitle that draws readers in…" aria-label="Story subtitle" className="mt-4 w-full resize-none border-0 bg-transparent text-lg leading-7 text-gray-500 outline-none placeholder:text-gray-300 dark:text-gray-300 dark:placeholder:text-gray-600" />
            </section>
            <RichTextEditor value={html} onChange={(value) => setField("content", { type: "doc", html: value })} />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4">
            <EditorPanel title="Story settings" icon={Settings2}>
              <Field label="URL slug"><div className="flex items-center rounded-xl border border-gray-300 bg-white text-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 dark:border-gray-600 dark:bg-gray-900"><span className="pl-3 text-gray-400">/blog/</span><input value={blog.slug || ""} maxLength={120} onChange={(event) => { setSlugTouched(true); setField("slug", slugify(event.target.value) || null); }} className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none" /></div></Field>
              <Field label="Excerpt"><textarea value={blog.excerpt || ""} maxLength={320} rows={4} onChange={(event) => setField("excerpt", event.target.value || null)} placeholder="Used on blog cards and search results" className={`${inputClass} resize-none`} /></Field>
              <Field label="Tags" hint="Separate with commas"><div className="relative"><Tag size={16} className="absolute left-3 top-3 text-gray-400" /><input value={tagText} onChange={(event) => { setTagText(event.target.value); setDirty(true); }} placeholder="React, JavaScript, Career" className={`${inputClass} pl-9`} /></div></Field>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-700"><span><span className="block font-medium">Featured story</span><span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">Highlight this post in the dashboard.</span></span><input type="checkbox" checked={blog.is_featured} onChange={(event) => setField("is_featured", event.target.checked)} className="size-4 rounded border-gray-300 text-primary focus:ring-primary" /></label>
            </EditorPanel>

            <EditorPanel title="Cover image" icon={ImageIcon}>
              {blog.cover_image_url && <img src={blog.cover_image_url} alt={blog.cover_image_alt || "Cover preview"} className="aspect-[16/9] w-full rounded-xl object-cover" />}
              <Field label="Public image URL"><input type="url" value={blog.cover_image_url || ""} onChange={(event) => setField("cover_image_url", event.target.value || null)} placeholder="https://…" className={inputClass} /></Field>
              <Field label="Storage path" hint="Optional"><input value={blog.cover_image_path || ""} onChange={(event) => setField("cover_image_path", event.target.value || null)} placeholder="blogs/cover.webp" className={inputClass} /></Field>
              <Field label="Alternative text"><input value={blog.cover_image_alt || ""} onChange={(event) => setField("cover_image_alt", event.target.value || null)} placeholder="Describe the image" className={inputClass} /></Field>
              <Link to="/dashboard/media" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">Open media library <span aria-hidden>↗</span></Link>
            </EditorPanel>

            <EditorPanel title="SEO" icon={Sparkles}>
              <Field label="SEO title" hint={`${(blog.seo_title || "").length}/60`}><input value={blog.seo_title || ""} maxLength={60} onChange={(event) => setField("seo_title", event.target.value || null)} placeholder={blog.title || "Search result title"} className={inputClass} /></Field>
              <Field label="SEO description" hint={`${(blog.seo_description || "").length}/160`}><textarea value={blog.seo_description || ""} maxLength={160} rows={3} onChange={(event) => setField("seo_description", event.target.value || null)} placeholder={blog.excerpt || "Search result description"} className={`${inputClass} resize-none`} /></Field>
              <Field label="Canonical URL" hint="Optional"><input type="url" value={blog.canonical_url || ""} onChange={(event) => setField("canonical_url", event.target.value || null)} placeholder="https://…" className={inputClass} /></Field>
            </EditorPanel>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800"><span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><FileText size={16} />{stats.wordCount} words</span><span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><Clock3 size={16} />{stats.readingTime} min read</span></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function EditorPanel({ title, icon: Icon, children }: { title: string; icon: typeof Settings2; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Icon size={17} className="text-primary" />{title}</h2><div className="space-y-4">{children}</div></section>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-gray-600 dark:text-gray-300"><span>{label}</span>{hint && <span className="font-normal text-gray-400">{hint}</span>}</span>{children}</label>;
}
