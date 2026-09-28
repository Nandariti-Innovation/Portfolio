import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, Edit3, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useDashboardUi } from "@/features/dashboardUi/DashboardUi";
import supabase from "@/Superbase/client";
import { contentHtml, dateLabel } from "./blogUtils";
import type { Blog } from "./types";

export default function BlogPreview() {
  const { collapsed } = useDashboardUi();
  const { blogId } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const width = collapsed ? "w-[calc(100vw-70px)]" : "w-[calc(100vw-240px)]";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: failure } = await supabase.from("blogs").select("*").eq("id", blogId).single();
      if (cancelled) return;
      if (failure || !data) setError(failure?.message || "Blog not found.");
      else setBlog(data as Blog);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [blogId]);

  if (loading) return <main className={`grid h-full place-items-center bg-background text-gray-500 dark:bg-darkthemebg ${width}`}><span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} />Loading preview…</span></main>;

  return <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-800 transition-all dark:bg-darkthemebg dark:text-gray-100 ${width}`}>
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link to="/dashboard/blogs" className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium dark:border-gray-600 dark:bg-gray-800"><ArrowLeft size={16} />All blogs</Link>{blog && <Link to={`/dashboard/blogs/${blog.id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white"><Edit3 size={16} />Edit story</Link>}</header>
      {error || !blog ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error || "Blog not found."}</div> : <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {blog.cover_image_url && <img src={blog.cover_image_url} alt={blog.cover_image_alt || blog.title} className="max-h-[520px] w-full object-cover" />}
        <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-14">
          <div className="mb-5 flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${blog.status === "published" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{blog.status}</span>{blog.tags.map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{tag}</span>)}</div>
          <h1 className="text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-6xl">{blog.title}</h1>
          {blog.subtitle && <p className="mt-5 text-xl leading-8 text-gray-500 dark:text-gray-300">{blog.subtitle}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-gray-200 pb-7 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"><span>Deepanshu Gulia</span><span>{dateLabel(blog.published_at || blog.updated_at)}</span><span className="flex items-center gap-1.5"><Clock3 size={15} />{blog.reading_time_minutes} min read</span></div>
          <div className="blog-preview-content mt-8 text-[17px] leading-8 text-gray-800 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: contentHtml(blog.content) }} />
        </div>
      </article>}
    </div>
  </main>;
}
