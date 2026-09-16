export type BlogStatus = "draft" | "published" | "archived";

export type BlogContent = {
  type: "doc";
  html?: string;
  content?: unknown[];
};

export type Blog = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string | null;
  excerpt: string | null;
  content: BlogContent;
  cover_image_url: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  tags: string[];
  status: BlogStatus;
  is_featured: boolean;
  word_count: number;
  reading_time_minutes: number;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogListItem = Omit<Blog, "content">;

export const emptyBlog = (): Omit<Blog, "id" | "created_at" | "updated_at"> => ({
  title: "",
  subtitle: null,
  slug: null,
  excerpt: null,
  content: { type: "doc", html: "" },
  cover_image_url: null,
  cover_image_path: null,
  cover_image_alt: null,
  tags: [],
  status: "draft",
  is_featured: false,
  word_count: 0,
  reading_time_minutes: 1,
  seo_title: null,
  seo_description: null,
  canonical_url: null,
  published_at: null,
});
