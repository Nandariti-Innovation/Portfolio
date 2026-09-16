import type { BlogContent } from "./types";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function contentHtml(content: BlogContent | null | undefined) {
  if (!content || typeof content !== "object") return "";
  return typeof content.html === "string" ? content.html : "";
}

export function plainTextFromHtml(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ");
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent || "";
}

export function getReadingStats(html: string) {
  const words = plainTextFromHtml(html).trim().split(/\s+/).filter(Boolean).length;
  return { wordCount: words, readingTime: Math.max(1, Math.ceil(words / 220)) };
}

export function dateLabel(value: string | null) {
  if (!value) return "Not published";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
