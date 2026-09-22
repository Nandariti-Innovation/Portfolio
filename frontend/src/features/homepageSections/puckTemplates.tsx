/* eslint-disable react-refresh/only-export-components -- shared Puck config and data utilities are not route components */
import { createContext, createElement, useContext, type ComponentType } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Config, Data, Slot } from "@puckeditor/core";
import { HomepageSectionHeading } from "@/components/sections/HomepageSectionHeading";
import { slotValue, type DynamicSection, type TemplateDefinition, type VisualLayout } from "./templates";

type Blocks = {
  SectionHeading: Record<string, never>;
  Collection: { item: Slot; layout: "grid" | "stack" | "timeline"; mobile: "1" | "2"; tablet: "1" | "2" | "3"; desktop: "1" | "2" | "3" | "4"; gap: "small" | "medium" | "large" };
  Group: { content: Slot; surface: "none" | "card" | "accent"; padding: "none" | "small" | "medium" | "large"; arrangement: "stack" | "row" | "split" };
  Text: { slot: string; style: "title" | "subtitle" | "eyebrow" | "body" | "muted" | "date" };
  Image: { slot: string; shape: "portrait" | "square" | "landscape"; fit: "cover" | "contain" };
  Tags: { slot: string };
  Link: { slot: string; label: string };
  StaticLink: { href: string; label: string };
  DateRange: { start: string; end: string };
  Index: Record<string, never>;
  Divider: Record<string, never>;
  Spacer: { size: "small" | "medium" | "large" };
};

export type PuckTemplateData = Data<Blocks>;
const ItemContext = createContext<{ item: Record<string, unknown>; index: number }>({ item: {}, index: 0 });
const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";
const selectClass = {
  grid: {
    mobile: { "1": "grid-cols-1", "2": "grid-cols-2" },
    tablet: { "1": "md:grid-cols-1", "2": "md:grid-cols-2", "3": "md:grid-cols-3" },
    desktop: { "1": "xl:grid-cols-1", "2": "xl:grid-cols-2", "3": "xl:grid-cols-3", "4": "xl:grid-cols-4" },
  },
  gap: { small: "gap-3", medium: "gap-6", large: "gap-10" },
  surface: { none: "", card: "overflow-hidden rounded-lg border border-white/15 bg-[#101010]/95", accent: "rounded-lg border border-[#ff6b24]/40 bg-[#302117]/60" },
  padding: { none: "", small: "p-3", medium: "p-5", large: "p-8" },
  arrangement: { stack: "flex flex-col gap-3", row: "flex flex-wrap items-center gap-4", split: "grid grid-cols-1 gap-4 md:grid-cols-2" },
  text: {
    title: "font-serif text-2xl leading-tight md:text-3xl",
    subtitle: "font-semibold text-base md:text-xl",
    eyebrow: "font-mono text-xs uppercase tracking-widest text-[#ff6b24]",
    body: "text-sm leading-6 text-[#f2efe9]",
    muted: "text-sm leading-6 text-[#aaa7a2]",
    date: "font-mono text-xs uppercase text-[#ff6b24]",
  },
  image: { portrait: "aspect-[4/5]", square: "aspect-square", landscape: "aspect-video" },
  fit: { cover: "object-cover", contain: "object-contain" },
  spacer: { small: "h-3", medium: "h-6", large: "h-12" },
} as const;

const imageSource = (value: unknown) => {
  const source = text(value);
  if (!source) return "";
  try {
    const parsed = new URL(source);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    if (source.startsWith("/") || /^[a-z]+:/i.test(source)) return "";
    return "https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/" +
      source.split("/").map(encodeURIComponent).join("/");
  }
};
const safeHref = (value: unknown) => {
  const href = text(value);
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try { const parsed = new URL(href); return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : ""; }
  catch { return ""; }
};

function useField(section: DynamicSection, slot: string) {
  const { item } = useContext(ItemContext);
  if (section.section_key === "template_preview" && !section.field_bindings[slot]) return slot;
  return slotValue(item, section.field_bindings[slot]);
}

// The Puck config contains all executable React code. The database holds only component names and props.
export function createTemplateConfig(section: DynamicSection): Config<Blocks> {
  return { components: {
    SectionHeading: { label: "Section heading", render: () => <HomepageSectionHeading section={section}/> },
    Collection: {
      label: "Repeating items", fields: {
        layout: { type: "select", options: [{ label: "Grid", value: "grid" }, { label: "Stack", value: "stack" }, { label: "Timeline", value: "timeline" }] },
        mobile: { type: "select", options: ["1", "2"].map(value => ({ label: `${value} columns`, value })) },
        tablet: { type: "select", options: ["1", "2", "3"].map(value => ({ label: `${value} columns`, value })) },
        desktop: { type: "select", options: ["1", "2", "3", "4"].map(value => ({ label: `${value} columns`, value })) },
        gap: { type: "select", options: ["small", "medium", "large"].map(value => ({ label: value, value })) },
        item: { type: "slot", allow: ["Group", "Text", "Image", "Tags", "Link", "StaticLink", "DateRange", "Index", "Divider", "Spacer"] },
      },
      defaultProps: { layout: "grid", mobile: "1", tablet: "2", desktop: "3", gap: "medium", item: [] },
      render: ({ item: Item, layout, mobile, tablet, desktop, gap, puck }) => {
        const classes = layout === "grid" ? `grid items-stretch ${selectClass.grid.mobile[mobile]} ${selectClass.grid.tablet[tablet]} ${selectClass.grid.desktop[desktop]} ${selectClass.gap[gap]}` :
          layout === "timeline" ? "grid gap-6 border-l border-[#ff6b24]/70 pl-5" : `grid ${selectClass.gap[gap]}`;
        const items = puck.isEditing ? (section.items.length ? section.items.slice(0, 1) : [{ title: "Sample title" }]) : section.items;
        return <div className={classes}>{items.map((item, index) => <ItemContext.Provider key={String(item.id ?? item.project_id ?? item.work_id ?? index)} value={{ item, index }}>
          <div className="min-w-0"><Item minEmptyHeight={100}/></div>
        </ItemContext.Provider>)}</div>;
      },
    },
    Group: {
      label: "Container", fields: {
        surface: { type: "select", options: ["none", "card", "accent"].map(value => ({ label: value, value })) },
        padding: { type: "select", options: ["none", "small", "medium", "large"].map(value => ({ label: value, value })) },
        arrangement: { type: "select", options: ["stack", "row", "split"].map(value => ({ label: value, value })) },
        content: { type: "slot", disallow: ["Collection", "SectionHeading"] },
      },
      defaultProps: { surface: "card", padding: "medium", arrangement: "stack", content: [] },
      render: ({ content: Content, surface, padding, arrangement }) =>
        <div className={`${selectClass.surface[surface]} ${selectClass.padding[padding]} ${selectClass.arrangement[arrangement]}`}><Content minEmptyHeight={40}/></div>,
    },
    Text: {
      label: "Data text", fields: {
        slot: { type: "text", label: "Data slot (map it in Headings)" },
        style: { type: "select", options: ["title", "subtitle", "eyebrow", "body", "muted", "date"].map(value => ({ label: value, value })) },
      },
      defaultProps: { slot: "title", style: "title" },
      render: ({ slot, style }) => <FieldText section={section} slot={slot} styleName={style}/> ,
    },
    Image: {
      label: "Data image", fields: {
        slot: { type: "text", label: "Image data slot" },
        shape: { type: "select", options: ["portrait", "square", "landscape"].map(value => ({ label: value, value })) },
        fit: { type: "select", options: ["cover", "contain"].map(value => ({ label: value, value })) },
      },
      defaultProps: { slot: "image", shape: "portrait", fit: "cover" },
      render: ({ slot, shape, fit }) => <FieldImage section={section} slot={slot} shape={shape} fit={fit}/> ,
    },
    Tags: { label: "Data tags", fields: { slot: { type: "text", label: "List data slot" } }, defaultProps: { slot: "tags" },
      render: ({ slot }) => <FieldTags section={section} slot={slot}/> },
    Link: { label: "Data link", fields: { slot: { type: "text", label: "Link data slot" }, label: { type: "text" } },
      defaultProps: { slot: "link", label: "View details" },
      render: ({ slot, label, puck }) => <FieldLink section={section} slot={slot} label={label} editing={puck.isEditing}/> },
    StaticLink: { label: "Fixed link", fields: { href: { type: "text", label: "Internal path or HTTPS URL" }, label: { type: "text" } },
      defaultProps: { href: "/projects", label: "View all" }, render: ({ href, label, puck }) => {
        const safe = safeHref(href);
        const content = <>{label}<ArrowUpRight size={15}/></>;
        const classes = "inline-flex items-center gap-2 border-t border-white/20 pt-5 font-mono text-sm text-[#ff6b24]";
        if (puck.isEditing || !safe) return <span className={classes}>{content}</span>;
        return safe.startsWith("/") ? <Link to={safe} className={classes}>{content}</Link> :
          <a href={safe} className={classes} rel="noopener noreferrer">{content}</a>;
      } },
    DateRange: { label: "Date range", fields: { start: { type: "text", label: "Start date slot" }, end: { type: "text", label: "End date slot" } },
      defaultProps: { start: "date", end: "end_date" }, render: ({ start, end }) => <DateRange section={section} start={start} end={end}/> },
    Index: { label: "Item number", render: () => <ItemIndex/> },
    Divider: { label: "Divider", render: () => <hr className="border-white/20"/> },
    Spacer: { label: "Spacing", fields: { size: { type: "select", options: ["small", "medium", "large"].map(value => ({ label: value, value })) } },
      defaultProps: { size: "medium" }, render: ({ size }) => <div aria-hidden="true" className={selectClass.spacer[size]}/> },
  } };
}

// The public site interprets the same limited block schema without loading Puck's editor runtime.
export function VisualTemplate({ section, data }: { section: DynamicSection; data: VisualLayout["puck_data"] }) {
  const registry = createTemplateConfig(section).components;
  function renderNodes(nodes: VisualLayout["puck_data"]["content"]) {
    return nodes.map((node, index) => {
      if (!permitted.has(node.type) || !node.props || typeof node.props !== "object") return null;
      const entry = registry[node.type as keyof Blocks];
      if (!entry) return null;
      const properties: Record<string, unknown> = { ...node.props, puck: { isEditing: false } };
      for (const slot of ["item", "content"] as const) {
        if (Array.isArray(node.props[slot])) {
          const children = node.props[slot] as VisualLayout["puck_data"]["content"];
          properties[slot] = () => <>{renderNodes(children)}</>;
        }
      }
      return createElement(entry.render as ComponentType<Record<string, unknown>>, { key: String(node.props.id ?? index), ...properties });
    });
  }
  return <>{renderNodes(data.content)}</>;
}

function FieldText({ section, slot, styleName }: { section: DynamicSection; slot: string; styleName: keyof typeof selectClass.text }) {
  const value = useField(section, slot);
  const raw = styleName === "date" && value ? new Date(text(value)) : null;
  const label = raw && !Number.isNaN(raw.getTime()) ? raw.toLocaleDateString("en-US", { month: "short", year: "numeric" }) :
    Array.isArray(value) ? text(value[0]) : text(value);
  return styleName === "title" ? <h3 className={selectClass.text[styleName]}>{label}</h3> :
    <p className={selectClass.text[styleName]}>{label}</p>;
}
function ItemIndex() {
  const { index } = useContext(ItemContext);
  return <span className="font-mono text-xs text-[#ff6b24]">{String(index + 1).padStart(2, "0")}</span>;
}
function FieldImage({ section, slot, shape, fit }: { section: DynamicSection; slot: string; shape: keyof typeof selectClass.image; fit: keyof typeof selectClass.fit }) {
  const source = imageSource(useField(section, slot));
  return source ? <img src={source} loading="lazy" decoding="async" className={`block w-full ${selectClass.image[shape]} ${selectClass.fit[fit]}`} alt=""/> :
    <div aria-hidden="true" className={`${selectClass.image[shape]} w-full bg-[#302117]`}/>;
}
function DateRange({ section, start, end }: { section: DynamicSection; start: string; end: string }) {
  const first = useField(section, start);
  const last = useField(section, end);
  const date = (value: unknown) => {
    const parsed = new Date(text(value));
    return !value || Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  return <span className={selectClass.text.date}>{date(first)} – {date(last) || "Now"}</span>;
}
function FieldTags({ section, slot }: { section: DynamicSection; slot: string }) {
  const tags = useField(section, slot);
  return <div className="flex flex-wrap gap-2">{Array.isArray(tags) && tags.filter(value => typeof value === "string").slice(0, 8).map((tag: string) =>
    <span key={tag} className="border border-white/15 px-2 py-1 font-mono text-xs">{tag}</span>)}</div>;
}
function FieldLink({ section, slot, label, editing }: { section: DynamicSection; slot: string; label: string; editing: boolean }) {
  const href = safeHref(useField(section, slot));
  const classes = "inline-flex items-center gap-2 font-mono text-xs text-[#ff6b24]";
  const content = <>{label || "View details"}<ArrowUpRight size={15}/></>;
  if (!href || editing) return <span className={classes}>{content}</span>;
  return href.startsWith("/") ? <Link className={classes} to={href}>{content}</Link> :
    <a className={classes} href={href} rel="noopener noreferrer">{content}</a>;
}

const block = (type: keyof Blocks, props: Record<string, unknown>) => ({ type, props: { id: `${type}-${crypto.randomUUID()}`, ...props } });
const field = (slot: string, style: string) => block("Text", { slot, style });
const group = (surface: "card" | "none", content: unknown[]) => block("Group", { surface, padding: "medium", arrangement: "stack", content });
export function starterTemplate(variant: string): PuckTemplateData {
  const body = variant === "timeline" ? [block("DateRange", { start: "date", end: "end_date" }), field("title", "title"), field("subtitle", "eyebrow"), field("description", "muted"), block("Tags", { slot: "tags" })] :
    variant === "list" ? [block("Index", {}), field("date", "date"), field("category", "eyebrow"), field("title", "title"), block("Link", { slot: "link", label: "Read article" })] :
      [block("Image", { slot: "image", shape: "portrait", fit: "contain" }), field("category", "eyebrow"), field("title", "title"), field("description", "muted"), block("Tags", { slot: "tags" }), block("Link", { slot: "link", label: "View details" })];
  return { root: {}, content: [block("SectionHeading", {}), block("Collection", {
    layout: variant === "timeline" ? "timeline" : variant === "list" ? "stack" : "grid",
    mobile: "1", tablet: variant === "cards" ? "2" : "1", desktop: variant === "cards" ? "3" : "1", gap: "medium",
    item: [group(variant === "cards" ? "card" : "none", body)],
  }), ...(variant === "cards" ? [block("StaticLink", { href: "/projects", label: "View all projects" })] : [])] } as PuckTemplateData;
}

const fieldTypes: Record<string, string> = { Text: "text", Image: "image", Tags: "list", Link: "link" };
const permitted = new Set(["SectionHeading", "Collection", "Group", "Text", "Image", "Tags", "Link", "StaticLink", "DateRange", "Index", "Divider", "Spacer"]);
export function analyzeTemplate(data: PuckTemplateData) {
  const slots = new Map<string, string>();
  let count = 0;
  let collections = 0;
  function walk(nodes: unknown, depth = 0): void {
    if (!Array.isArray(nodes) || depth > 8) throw new Error("The template has too many nested blocks.");
    for (const node of nodes) {
      count++;
      if (count > 80 || !node || typeof node !== "object" || !("type" in node) || !permitted.has(String(node.type)))
        throw new Error("The template has an unsupported block or exceeds 80 blocks.");
      const element = node as { type: string; props?: Record<string, unknown> };
      if (!element.props || typeof element.props !== "object") throw new Error("A template block has no properties.");
      if (element.type === "Collection") { collections++; walk(element.props.item, depth + 1); }
      if (element.type === "Group") walk(element.props.content, depth + 1);
      if (fieldTypes[element.type]) {
        const name = element.props.slot;
        if (typeof name !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(name))
          throw new Error("Every data block needs a slot name with lowercase letters, numbers, or underscores.");
        const type = element.type === "Text" && element.props.style === "date" ? "date" : fieldTypes[element.type];
        if (slots.has(name) && slots.get(name) !== type) throw new Error(`Slot ${name} is used with incompatible block types.`);
        slots.set(name, type);
      }
      if (element.type === "DateRange") {
        for (const name of [element.props.start, element.props.end]) {
          if (typeof name !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(name)) throw new Error("Date range slots must have valid names.");
          slots.set(name, "date");
        }
      }
    }
  }
  if (JSON.stringify(data).length > 48000) throw new Error("The template is too large.");
  walk(data.content);
  if (data.content.length > 40 || slots.size > 32) throw new Error("Use at most 40 top-level blocks and 32 data slots.");
  if (collections !== 1 || slots.size === 0) throw new Error("Add one repeating items block and at least one data block.");
  return Array.from(slots, ([key, type]) => ({ key, type, required: key === "title" }));
}

export function asPuckLayout(template: TemplateDefinition | null): VisualLayout {
  if (template?.layout_definition.variant === "puck") return template.layout_definition;
  return { variant: "puck", schema_version: 1, show_heading: true, fields: [], puck_data: starterTemplate(template?.layout_definition.variant || "cards") };
}
