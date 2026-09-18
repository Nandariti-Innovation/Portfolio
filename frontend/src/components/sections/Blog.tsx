import { ArrowUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/StateManagement/Redux/reduxStore";
import { SectionHeader } from "./SectionHeader";

type HeadingType = { index: string; eyebrow: string; title: string };

export const Blog = () => {
  const blogs = useSelector((state: RootState) => state.homepageBlogs.items);
  const { setting } = useSelector((state: RootState) => state.settings);
  const heading = setting.find((item) => item.setting_name === "headings")
    ?.setting_object.blog as HeadingType | undefined;

  if (!blogs.length) return null;

  return (
    <section className="panel content-panel" id="blog">
      <SectionHeader
        index={heading?.index || "04"}
        eyebrow={heading?.eyebrow || "FIELD NOTES"}
        title={heading?.title || "Writing from inside the build."}
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
