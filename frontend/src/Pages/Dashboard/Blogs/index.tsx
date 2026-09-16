import { useContext, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BookOpenText,
  CalendarDays,
  Copy,
  Edit3,
  Eye,
  FilePenLine,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { AlertDialog } from "radix-ui";
import { Link } from "react-router-dom";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";
import supabase from "@/Superbase/client";
import { dateLabel, slugify } from "./blogUtils";
import type { Blog, BlogListItem, BlogStatus } from "./types";

const selectedColumns = "id,title,subtitle,slug,excerpt,cover_image_url,cover_image_path,cover_image_alt,tags,status,is_featured,word_count,reading_time_minutes,seo_title,seo_description,canonical_url,published_at,created_at,updated_at";
const control = "rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function Blogs() {
  const { collapsed } = useContext(settingContext);
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | BlogStatus>("all");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const { data, error: failure } = await supabase.from("blogs").select(selectedColumns).order("updated_at", { ascending: false }).limit(500);
    if (failure) { setBlogs([]); setError(failure.message); }
    else setBlogs((data || []) as BlogListItem[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return blogs.filter((blog) => {
      const matchesStatus = status === "all" || blog.status === status;
      const matchesSearch = !term || [blog.title, blog.subtitle, blog.excerpt, blog.slug, ...(blog.tags || [])].some((value) => String(value || "").toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [blogs, search, status]);

  const updateStatus = async (blog: BlogListItem, nextStatus: BlogStatus) => {
    if (nextStatus === "published" && blog.word_count === 0) {
      setError("Open this story in the editor and add content before publishing it.");
      return;
    }
    setWorkingId(blog.id);
    setError("");
    const slug = blog.slug || slugify(blog.title);
    const update = {
      status: nextStatus,
      slug: slug || null,
      published_at: nextStatus === "published" ? blog.published_at || new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const { error: failure } = await supabase.from("blogs").update(update).eq("id", blog.id);
    setWorkingId("");
    if (failure) { setError(failure.message); return; }
    await load();
  };

  const duplicate = async (id: string) => {
    setWorkingId(id);
    setError("");
    const { data, error: readError } = await supabase.from("blogs").select("*").eq("id", id).single();
    if (readError || !data) { setWorkingId(""); setError(readError?.message || "Unable to duplicate this blog."); return; }
    const source = data as Blog;
    const { id: _id, created_at: _created, updated_at: _updated, ...copy } = source;
    void _id; void _created; void _updated;
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("blogs").insert({ ...copy, title: `Copy of ${source.title}`, slug: null, status: "draft", is_featured: false, published_at: null, updated_at: now });
    setWorkingId("");
    if (insertError) { setError(insertError.message); return; }
    await load();
  };

  const remove = async (id: string) => {
    setWorkingId(id);
    setError("");
    const { error: failure } = await supabase.from("blogs").delete().eq("id", id);
    setWorkingId("");
    if (failure) { setError(failure.message); return; }
    setBlogs((current) => current.filter((blog) => blog.id !== id));
  };

  const width = collapsed ? "w-[calc(100vw-70px)]" : "w-[calc(100vw-240px)]";
  const published = blogs.filter((blog) => blog.status === "published").length;
  const drafts = blogs.filter((blog) => blog.status === "draft").length;
  const featured = blogs.filter((blog) => blog.is_featured).length;

  return <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-800 transition-all dark:bg-darkthemebg dark:text-gray-100 ${width}`}>
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Blogs</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Write, preview, and publish long-form stories from your portfolio dashboard.</p></div><div className="flex gap-2"><button type="button" disabled={loading} onClick={() => void load()} aria-label="Refresh blogs" className="grid size-10 cursor-pointer place-items-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button><Link to="/dashboard/blogs/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white"><Plus size={17} />New story</Link></div></header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="All stories" value={blogs.length} icon={BookOpenText} /><Stat label="Published" value={published} icon={Send} tone="emerald" /><Stat label="Drafts" value={drafts} icon={FilePenLine} tone="amber" /><Stat label="Featured" value={featured} icon={Star} tone="violet" /></section>

      <section className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><label className="relative min-w-[220px] flex-1"><span className="sr-only">Search blogs</span><Search size={16} className="absolute left-3 top-3.5 text-gray-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, slug, excerpt, or tags…" className={`${control} w-full pl-9`} /></label><select value={status} onChange={(event) => setStatus(event.target.value as "all" | BlogStatus)} className={control}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option></select></section>

      {error && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><span>{error}</span><button type="button" onClick={() => setError("")} className="cursor-pointer font-medium underline">Dismiss</button></div>}

      <section className="mt-5" aria-live="polite" aria-busy={loading}>
        {loading ? <div className="flex justify-center gap-3 py-24 text-gray-500"><Loader2 className="animate-spin" />Loading stories…</div> : visible.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800"><BookOpenText size={38} className="mx-auto text-gray-300 dark:text-gray-600" /><h2 className="mt-4 text-lg font-semibold">{blogs.length ? "No matching stories" : "Write your first story"}</h2><p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{blogs.length ? "Try another search term or status filter." : "Create a draft, shape it in the rich editor, preview it, and publish when it is ready."}</p>{!blogs.length && <Link to="/dashboard/blogs/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white"><Plus size={17} />Create story</Link>}</div> : <div className="grid gap-4 lg:grid-cols-2">{visible.map((blog) => <BlogCard key={blog.id} blog={blog} busy={workingId === blog.id} onStatus={updateStatus} onDuplicate={duplicate} onDelete={remove} />)}</div>}
      </section>
    </div>
  </main>;
}

function Stat({ label, value, icon: Icon, tone = "blue" }: { label: string; value: number; icon: typeof BookOpenText; tone?: "blue" | "emerald" | "amber" | "violet" }) {
  const tones = { blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300", emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300", amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300", violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300" };
  return <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p><p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{value}</p></div><span className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon size={20} /></span></div></article>;
}

function BlogCard({ blog, busy, onStatus, onDuplicate, onDelete }: { blog: BlogListItem; busy: boolean; onStatus: (blog: BlogListItem, status: BlogStatus) => Promise<void>; onDuplicate: (id: string) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const statusTone = blog.status === "published" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : blog.status === "archived" ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><div className="grid h-full sm:grid-cols-[170px_minmax(0,1fr)]">{blog.cover_image_url ? <img src={blog.cover_image_url} alt={blog.cover_image_alt || ""} className="h-44 w-full object-cover sm:h-full" /> : <div className="grid h-40 place-items-center bg-gradient-to-br from-blue-50 to-violet-50 text-blue-200 dark:from-gray-900 dark:to-gray-800 dark:text-gray-700 sm:h-full"><BookOpenText size={46} /></div>}<div className="flex min-w-0 flex-col p-5"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone}`}>{blog.status}</span>{blog.is_featured && <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><Star size={12} />Featured</span>}</div><h2 className="mt-3 line-clamp-2 text-lg font-bold text-gray-950 dark:text-white">{blog.title || "Untitled draft"}</h2><p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{blog.excerpt || blog.subtitle || "No excerpt added yet."}</p>{blog.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{blog.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">{tag}</span>)}</div>}<div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-gray-400"><span className="flex items-center gap-1.5"><CalendarDays size={13} />{dateLabel(blog.published_at || blog.updated_at)}</span><span>{blog.word_count} words</span><span>{blog.reading_time_minutes} min read</span></div><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-700"><Link to={`/dashboard/blogs/${blog.id}/edit`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white"><Edit3 size={14} />Edit</Link><Link to={`/dashboard/blogs/${blog.id}/preview`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-xs font-semibold hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"><Eye size={14} />Preview</Link><button type="button" disabled={busy} onClick={() => void onDuplicate(blog.id)} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700" aria-label={`Duplicate ${blog.title}`} title="Duplicate"><Copy size={14} /></button>{blog.status === "published" ? <button type="button" disabled={busy} onClick={() => void onStatus(blog, "draft")} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-amber-300 text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:hover:bg-amber-950/30" aria-label={`Move ${blog.title} to draft`} title="Move to draft"><FilePenLine size={14} /></button> : <button type="button" disabled={busy} onClick={() => void onStatus(blog, "published")} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30" aria-label={`Publish ${blog.title}`} title="Publish"><Send size={14} /></button>}{blog.status !== "archived" && <button type="button" disabled={busy} onClick={() => void onStatus(blog, "archived")} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700" aria-label={`Archive ${blog.title}`} title="Archive"><Archive size={14} /></button>}<DeleteDialog title={blog.title} busy={busy} onConfirm={() => onDelete(blog.id)} /></div></div></div></article>;
}

function DeleteDialog({ title, busy, onConfirm }: { title: string; busy: boolean; onConfirm: () => Promise<void> }) {
  return <AlertDialog.Root><AlertDialog.Trigger asChild><button type="button" disabled={busy} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30" aria-label={`Delete ${title}`} title="Delete"><Trash2 size={14} /></button></AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm" /><AlertDialog.Content className="fixed left-1/2 top-1/2 z-[80] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl outline-none dark:border-gray-700 dark:bg-gray-800"><div className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40"><Trash2 size={21} /></div><AlertDialog.Title className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">Delete this story?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">“{title}” will be permanently removed. This cannot be undone.</AlertDialog.Description><div className="mt-6 flex justify-end gap-3"><AlertDialog.Cancel asChild><button type="button" className="h-10 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm font-medium dark:border-gray-600">Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button type="button" onClick={() => void onConfirm()} className="h-10 cursor-pointer rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700">Delete story</button></AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>;
}
