import { ArrowUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/StateManagement/Redux/reduxStore";
import { SectionHeader } from "./SectionHeader";
import { getSectionConfiguration } from "@/features/homepageSections/manifest";

export const Blog = () => {
  const blogs = useSelector((state: RootState) => state.homepageBlogs.items);
  const { setting } = useSelector((state: RootState) => state.settings);
  const section = getSectionConfiguration(setting, "blog");

  if (!section?.enabled || !blogs.length) return null;

  const { heading } = section;

  return (
    <section className="panel content-panel" id="blog">
      <SectionHeader
        index={heading.index}
        eyebrow={heading.eyebrow}
        title={heading.title}
      />
      <div className="post-list">
        {blogs.map((post) => (
          <article key={post.id}>
            <span>{formatBlogDate(post.published_at)}</span>
            <p>{post.tags?.[0] || `${post.reading_time_minutes} MIN READ`}</p>
            <h3>{post.title}</h3>
            <ArrowUpRight aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
};

function formatBlogDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "RECENT";
  return date
    .toLocaleDateString("en-US", { month: "2-digit", year: "numeric" })
    .replace("/", ".");
}
