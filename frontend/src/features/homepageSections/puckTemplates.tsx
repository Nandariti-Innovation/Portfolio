/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any, react-hooks/rules-of-hooks -- Puck invokes registry render functions as React components; the lint rule cannot infer that contract */
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Config, Data, Slot } from "@puckeditor/core";
import { HomepageSectionHeading } from "@/components/sections/HomepageSectionHeading";
import type { HomepageSectionConfiguration, SectionDataField, SectionFieldType } from "./manifest";
import {
  bindingValue,
  slotValue,
  type CardPreset,
  type DynamicSection,
  type PuckLayoutData,
  type TemplateDefinition,
  type TemplateDependency,
  type TemplateNode,
  type VisualLayout,
  type VisualLayoutV2,
} from "./templates";

type SourceMode = "static" | "dynamic";
type TextStyle = "heading" | "subheading" | "paragraph" | "text";
type SizeChoice = "auto" | "fit" | "full" | "25" | "33" | "50" | "66" | "75";
type SizingProps = { width?: SizeChoice; height?: SizeChoice };
type BorderProps = {
  borderStyle?: "none" | "solid" | "dashed" | "dotted" | "double";
  borderWidth?: "1" | "2" | "4";
  borderColor?: "subtle" | "muted" | "light" | "accent" | "dark";
  borderRadius?: "none" | "small" | "medium" | "large" | "full";
};
type DesignProps = SizingProps & BorderProps;
type TextProps = DesignProps & { contentMode: SourceMode; contentValue: string; contentField: string; size: "small" | "medium" | "large" | "xlarge"; weight: "regular" | "medium" | "bold"; align: "left" | "center" | "right"; tone: "default" | "muted" | "accent" };
type Blocks = {
  SectionHeading: DesignProps;
  Collection: DesignProps & { item: Slot; preset: CardPreset; sourceSection: string; limit: number; orderBy: string; orderDirection: "asc" | "desc"; layout: "grid" | "stack" | "timeline"; desktopColumns: "1" | "2" | "3" | "4"; gap: "small" | "medium" | "large" };
  Group: DesignProps & { content: Slot; surface: "none" | "card" | "accent"; padding: "none" | "small" | "medium" | "large"; arrangement: "column" | "row" | "grid"; gap: "small" | "medium" | "large"; justify: "start" | "center" | "between"; align: "start" | "center" | "end"; radius: "none" | "medium" | "large" };
  Heading: TextProps;
  Subheading: TextProps;
  Paragraph: TextProps;
  InlineText: TextProps;
  ImageBlock: DesignProps & { srcMode: SourceMode; srcValue: string; srcField: string; altMode: SourceMode; altValue: string; altField: string; shape: "portrait" | "square" | "landscape"; fit: "cover" | "contain"; radius: "none" | "medium" | "large" };
  TagsBlock: DesignProps & { valuesMode: SourceMode; valuesValue: string; valuesField: string; tone: "default" | "accent" };
  DateBlock: DesignProps & { dateMode: SourceMode; dateValue: string; dateField: string; format: "month-year" | "medium" | "iso" };
  Button: DesignProps & { labelMode: SourceMode; labelValue: string; labelField: string; hrefMode: SourceMode; hrefValue: string; hrefField: string; hrefPrefix: string; variant: "primary" | "secondary" | "outline" | "text"; size: "small" | "medium" | "large"; fullWidth: boolean; newTab: boolean };
  LinkBlock: DesignProps & { labelMode: SourceMode; labelValue: string; labelField: string; hrefMode: SourceMode; hrefValue: string; hrefField: string; hrefPrefix: string; newTab: boolean };
  Index: DesignProps;
  Divider: DesignProps;
  Spacer: DesignProps & { size: "small" | "medium" | "large" };
};

export type PuckTemplateData = Data<Blocks>;
type BindingKind = "text" | "image" | "date" | "list" | "url" | "sort";
const identifier = /^[a-z][a-z0-9_]{0,63}$/;
const storage = "https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/";
const ItemContext = createContext<{ item: Record<string, unknown>; index: number }>({ item: {}, index: 0 });
const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";

const classes: Record<string, Record<string, string>> = {
  gap: { small: "gap-3", medium: "gap-6", large: "gap-10" },
  surface: { none: "", card: "border border-white/15 bg-[#101010]/95", accent: "border border-[#ff6b24]/40 bg-[#302117]/60" },
  padding: { none: "", small: "p-3", medium: "p-5", large: "p-8" },
  arrangement: {
    column: "flex flex-col",
    row: "flex flex-col sm:flex-row sm:flex-wrap",
    grid: "grid grid-cols-1 sm:grid-cols-2",
  },
  justify: { start: "justify-start", center: "justify-center", between: "justify-between" },
  align: { start: "items-start", center: "items-center", end: "items-end" },
  radius: { none: "", medium: "rounded-lg", large: "rounded-2xl" },
  textSize: { small: "text-xs", medium: "text-sm", large: "text-xl md:text-2xl", xlarge: "text-3xl md:text-5xl" },
  weight: { regular: "font-normal", medium: "font-medium", bold: "font-bold" },
  textAlign: { left: "text-left", center: "text-center", right: "text-right" },
  tone: { default: "text-[#f2efe9]", muted: "text-[#aaa7a2]", accent: "text-[#ff6b24]" },
  image: { portrait: "aspect-[4/5]", square: "aspect-square", landscape: "aspect-video" },
  fit: { cover: "object-cover", contain: "object-contain" },
  columns: { "1": "xl:grid-cols-1", "2": "md:grid-cols-2", "3": "md:grid-cols-2 xl:grid-cols-3", "4": "md:grid-cols-2 xl:grid-cols-4" },
  spacer: { small: "h-3", medium: "h-6", large: "h-12" },
} as const;

const compatibleTypes: Record<BindingKind, SectionFieldType[]> = {
  text: ["string", "text", "rich_text", "integer", "number", "boolean", "uuid"],
  image: ["image", "url", "string", "text"],
  date: ["date", "datetime"],
  list: ["string_array", "string", "text"],
  url: ["url", "string", "text", "integer", "uuid"],
  sort: ["string", "text", "integer", "number", "date", "datetime", "uuid"],
};

export function compatibleFields(section: HomepageSectionConfiguration | undefined, kind: BindingKind) {
  if (!section) return [];
  return section.data_schema.fields.filter((field) => compatibleTypes[kind].includes(field.type));
}

const optionsFor = (fields: SectionDataField[]) => fields.map((field) => ({ label: `${field.label} (${field.key})`, value: field.key }));
const modeField = (label: string) => ({ type: "select" as const, label: `${label} source`, options: [{ label: "Static", value: "static" }, { label: "Database field", value: "dynamic" }] });
const selectField = (label: string, fields: SectionDataField[]) => ({ type: "select" as const, label, options: optionsFor(fields) });
const select = (label: string, values: string[]) => ({ type: "select" as const, label, options: values.map((value) => ({ label: value.replaceAll("-", " "), value })) });
const sizeOptions = [
  { label: "Auto", value: "auto" }, { label: "Fit content", value: "fit" }, { label: "Full (100%)", value: "full" },
  { label: "25%", value: "25" }, { label: "33%", value: "33" }, { label: "50%", value: "50" },
  { label: "66%", value: "66" }, { label: "75%", value: "75" },
];
const sizingFields = {
  width: { type: "select" as const, label: "Width", options: sizeOptions },
  height: { type: "select" as const, label: "Height", options: sizeOptions },
};
const borderFields = {
  borderStyle: { type: "select" as const, label: "Border style", options: ["none", "solid", "dashed", "dotted", "double"].map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })) },
  borderWidth: { type: "select" as const, label: "Border thickness", options: [{ label: "Thin (1px)", value: "1" }, { label: "Medium (2px)", value: "2" }, { label: "Thick (4px)", value: "4" }] },
  borderColor: { type: "select" as const, label: "Border colour", options: ["subtle", "muted", "light", "accent", "dark"].map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })) },
  borderRadius: { type: "select" as const, label: "Corner radius", options: [{ label: "None", value: "none" }, { label: "Small", value: "small" }, { label: "Medium", value: "medium" }, { label: "Large", value: "large" }, { label: "Pill / circle", value: "full" }] },
};
const designFields = { ...sizingFields, ...borderFields };
const withSizingFields = (fields: Record<string, unknown>) => ({ ...fields, ...designFields });
const sizingDefaults = (width: SizeChoice = "auto"): DesignProps => ({ width, height: "auto", borderStyle: "none", borderWidth: "1", borderColor: "subtle", borderRadius: "none" });
const sizeValue = (value: unknown): CSSProperties["width"] => ({ fit: "fit-content", full: "100%", "25": "25%", "33": "33.333%", "50": "50%", "66": "66.667%", "75": "75%" }[String(value)] || "auto");
const borderColors: Record<NonNullable<BorderProps["borderColor"]>, string> = { subtle: "rgba(255, 255, 255, 0.15)", muted: "#6b6965", light: "#f2efe9", accent: "#ff6b24", dark: "#111111" };
const borderRadii: Record<NonNullable<BorderProps["borderRadius"]>, string> = { none: "0", small: "0.25rem", medium: "0.5rem", large: "1rem", full: "9999px" };
const sizeAttributes = (props: DesignProps) => {
  const style: CSSProperties = { width: sizeValue(props.width), height: sizeValue(props.height), boxSizing: "border-box" };
  if (props.borderStyle && props.borderStyle !== "none") {
    style.borderStyle = props.borderStyle;
    style.borderWidth = `${props.borderWidth || "1"}px`;
    style.borderColor = borderColors[props.borderColor || "subtle"];
  }
  if (props.borderRadius) {
    style.borderRadius = borderRadii[props.borderRadius];
    if (props.borderRadius !== "none") style.overflow = "hidden";
  }
  return {
    style,
    "data-template-width": props.width || "auto",
    "data-template-height": props.height || "auto",
  };
};
function Sized({ props, className = "", children }: { props: DesignProps; className?: string; children: ReactNode }) {
  return <div {...sizeAttributes(props)} className={className}>{children}</div>;
}
const block = (type: keyof Blocks, props: Record<string, unknown>): TemplateNode => ({ type, props: { id: `${type}-${crypto.randomUUID()}`, ...props } });

const defaultText = (style: TextStyle, field: string, value: string): TextProps => ({
  contentMode: "dynamic", contentValue: value, contentField: field,
  size: style === "heading" ? "large" : style === "subheading" ? "medium" : "small",
  weight: style === "heading" ? "bold" : style === "subheading" ? "medium" : "regular",
  align: "left", tone: style === "subheading" ? "accent" : style === "paragraph" ? "muted" : "default",
});

const defaultGroup = (surface: "none" | "card", content: TemplateNode[]) => block("Group", {
  surface, padding: surface === "card" ? "medium" : "none", arrangement: "column", gap: "small", justify: "start", align: "start", radius: "medium", content,
});

const PRESET_FIELDS: Record<CardPreset, Record<string, string>> = {
  project: { image: "project_image", category: "project_type", title: "project_name", description: "project_description", tags: "project_tech_stack", link: "project_id", order: "project_priority" },
  experience: { date: "work_start_date", title: "work_designation", subtitle: "work_company_name", description: "work_short_description", tags: "work_tech_stack", order: "work_start_date" },
  blog: { date: "published_at", title: "title", description: "excerpt", tags: "tags", link: "canonical_url", order: "published_at" },
};

export function presetCard(preset: CardPreset): TemplateNode[] {
  const field = PRESET_FIELDS[preset];
  if (preset === "experience") return [defaultGroup("none", [
    block("DateBlock", { dateMode: "dynamic", dateValue: "2026-01-01", dateField: field.date, format: "month-year" }),
    block("Heading", defaultText("heading", field.title, "Role title")),
    block("Subheading", defaultText("subheading", field.subtitle, "Company")),
    block("Paragraph", defaultText("paragraph", field.description, "Describe this experience.")),
    block("TagsBlock", { valuesMode: "dynamic", valuesValue: "React, TypeScript", valuesField: field.tags, tone: "default" }),
  ])];
  if (preset === "blog") return [defaultGroup("none", [
    block("Index", {}),
    block("DateBlock", { dateMode: "dynamic", dateValue: "2026-01-01", dateField: field.date, format: "medium" }),
    block("Heading", defaultText("heading", field.title, "Article title")),
    block("Paragraph", defaultText("paragraph", field.description, "Article summary")),
    block("TagsBlock", { valuesMode: "dynamic", valuesValue: "Engineering, Notes", valuesField: field.tags, tone: "default" }),
    block("LinkBlock", { labelMode: "static", labelValue: "Read article", labelField: "", hrefMode: "dynamic", hrefValue: "/blogs", hrefField: field.link, hrefPrefix: "", newTab: false }),
  ])];
  return [defaultGroup("card", [
    block("ImageBlock", { srcMode: "dynamic", srcValue: "", srcField: field.image, altMode: "dynamic", altValue: "Project image", altField: field.title, shape: "portrait", fit: "contain", radius: "none" }),
    block("Subheading", defaultText("subheading", field.category, "Featured")),
    block("Heading", defaultText("heading", field.title, "Project title")),
    block("Paragraph", defaultText("paragraph", field.description, "Project summary")),
    block("TagsBlock", { valuesMode: "dynamic", valuesValue: "React, TypeScript", valuesField: field.tags, tone: "default" }),
    block("Button", { labelMode: "static", labelValue: "View details", labelField: "", hrefMode: "dynamic", hrefValue: "/projects", hrefField: field.link, hrefPrefix: "/project/", variant: "text", size: "small", fullWidth: false, newTab: false }),
  ])];
}

function textFields(props: Partial<TextProps>, fields: SectionDataField[], multiline: boolean) {
  return withSizingFields({
    contentMode: modeField("Content"),
    ...(props.contentMode === "dynamic" ? { contentField: selectField("Database column", fields) } : { contentValue: { type: multiline ? "textarea" : "text", label: "Static content" } }),
    size: select("Text size", ["small", "medium", "large", "xlarge"]),
    weight: select("Weight", ["regular", "medium", "bold"]),
    align: select("Alignment", ["left", "center", "right"]),
    tone: select("Colour", ["default", "muted", "accent"]),
  });
}

function useResolved(mode: SourceMode, staticValue: unknown, field: string, prefix = "") {
  const { item } = useContext(ItemContext);
  return bindingValue(item, mode, staticValue, field, prefix);
}

function ItemIndex() {
  const { index } = useContext(ItemContext);
  return <span className="font-mono text-xs text-[#ff6b24]">{String(index + 1).padStart(2, "0")}</span>;
}

function imageSource(value: unknown) {
  const source = text(value);
  if (!source) return "";
  try { const parsed = new URL(source); return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : ""; }
  catch { return source.startsWith("/") || /^[a-z]+:/i.test(source) ? "" : storage + source.split("/").map(encodeURIComponent).join("/"); }
}

function safeHref(value: unknown) {
  const href = text(value);
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try { const parsed = new URL(href); return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : ""; }
  catch { return ""; }
}

function TextElement({ kind, props }: { kind: TextStyle; props: TextProps }) {
  const value = useResolved(props.contentMode, props.contentValue, props.contentField);
  const label = Array.isArray(value) ? text(value[0]) : text(value);
  const className = `${kind === "heading" ? "font-serif" : ""} ${classes.textSize[props.size]} ${classes.weight[props.weight]} ${classes.textAlign[props.align]} ${classes.tone[props.tone]}`;
  if (kind === "heading") return <Sized props={props}><h3 className={className}>{label}</h3></Sized>;
  if (kind === "subheading") return <Sized props={props}><h4 className={className}>{label}</h4></Sized>;
  if (kind === "text") return <Sized props={props}><span className={className}>{label}</span></Sized>;
  return <Sized props={props}><p className={`${className} leading-6`}>{label}</p></Sized>;
}

function SmartLink({ href, newTab, className, children }: { href: string; newTab: boolean; className: string; children: ReactNode }) {
  if (!href) return <span className={className}>{children}</span>;
  if (href.startsWith("/")) return <Link to={href} className={className}>{children}</Link>;
  return <a href={href} className={className} target={newTab ? "_blank" : undefined} rel="noopener noreferrer">{children}</a>;
}

export function createTemplateConfig(
  section: DynamicSection,
  sources: HomepageSectionConfiguration[] = [],
  selectedSourceKey = section.section_key,
): Config<Blocks> {
  const source = sources.find((item) => item.section_key === selectedSourceKey);
  const textColumns = compatibleFields(source, "text");
  const imageColumns = compatibleFields(source, "image");
  const dateColumns = compatibleFields(source, "date");
  const listColumns = compatibleFields(source, "list");
  const urlColumns = compatibleFields(source, "url");
  const sortColumns = compatibleFields(source, "sort");
  const sourceOptions = sources.map((item) => ({ label: item.heading.eyebrow || item.section_key, value: item.section_key }));
  const textComponent = (kind: TextStyle, label: string, multiline: boolean) => ({
    label,
    defaultProps: { ...defaultText(kind, "", label), contentMode: "static", ...sizingDefaults("fit") },
    fields: textFields({ contentMode: "static" }, textColumns, multiline),
    resolveFields: (data: { props: TextProps }) => textFields(data.props, textColumns, multiline),
    render: (props: any) => <TextElement kind={kind} props={props as TextProps}/>,
  });

  const config = { components: {
    SectionHeading: { label: "Section heading", fields: designFields, defaultProps: sizingDefaults("full"), render: (props: any) => <Sized props={props}><HomepageSectionHeading section={section}/></Sized> },
    Collection: {
      label: "Repeating items",
      fields: withSizingFields({
        preset: { type: "select", label: "Card preset (changing it replaces the card)", options: [{ label: "Project cards", value: "project" }, { label: "Experience items", value: "experience" }, { label: "Blog cards", value: "blog" }] },
        sourceSection: { type: "select", label: "Data source", options: sourceOptions },
        limit: { type: "number", label: "Items to show", min: 1, max: 12 },
        orderBy: { type: "select", label: "Order by", options: optionsFor(sortColumns) },
        orderDirection: { type: "select", label: "Order direction", options: [{ label: "Ascending", value: "asc" }, { label: "Descending", value: "desc" }] },
        layout: select("Layout", ["grid", "stack", "timeline"]),
        desktopColumns: select("Desktop columns", ["1", "2", "3", "4"]),
        gap: select("Gap", ["small", "medium", "large"]),
        item: { type: "slot", allow: ["Group", "Heading", "Subheading", "Paragraph", "InlineText", "ImageBlock", "TagsBlock", "DateBlock", "Button", "LinkBlock", "Index", "Divider", "Spacer"] },
      }),
      defaultProps: { preset: "project", sourceSection: sources[0]?.section_key || "project", limit: 3, orderBy: sortColumns[0]?.key || "project_priority", orderDirection: "asc", layout: "grid", desktopColumns: "3", gap: "medium", item: presetCard("project"), ...sizingDefaults("full") },
      resolveData: (data: any, { changed }: { changed: Record<string, boolean> }) => changed.preset ? { ...data, props: { ...data.props, item: presetCard(data.props.preset) } } : data,
      render: (props: any) => {
        const { item: Item, layout, desktopColumns, gap, puck } = props;
        const collectionClass = layout === "timeline" ? `grid border-l border-[#ff6b24]/70 pl-5 ${classes.gap[gap]}` : layout === "stack" ? `grid grid-cols-1 ${classes.gap[gap]}` : `grid grid-cols-1 ${classes.columns[desktopColumns]} ${classes.gap[gap]}`;
        const items = puck.isEditing ? (section.items.length ? section.items.slice(0, 3) : [{ id: "preview" }]) : section.items;
        return <Sized props={props} className={collectionClass}>{items.map((item, index) => <ItemContext.Provider key={String(item.id ?? item.project_id ?? item.work_id ?? index)} value={{ item, index }}><div className="min-w-0"><Item minEmptyHeight={100}/></div></ItemContext.Provider>)}</Sized>;
      },
    },
    Group: {
      label: "Container",
      fields: withSizingFields({
        surface: select("Surface", ["none", "card", "accent"]), padding: select("Padding", ["none", "small", "medium", "large"]),
        arrangement: select("Layout", ["column", "row", "grid"]), gap: select("Gap", ["small", "medium", "large"]),
        justify: select("Horizontal alignment", ["start", "center", "between"]), align: select("Vertical alignment", ["start", "center", "end"]),
        content: { type: "slot", disallow: ["Collection", "SectionHeading"] },
      }),
      defaultProps: { surface: "none", padding: "none", arrangement: "column", gap: "small", justify: "start", align: "start", radius: "none", content: [], ...sizingDefaults("full") },
      render: (props: any) => { const { content: Content, surface, padding, arrangement, gap, justify, align, radius } = props; return <Sized props={props}><Content minEmptyHeight={40} className={`template-layout-${arrangement} ${classes.surface[surface]} ${classes.padding[padding]} ${classes.arrangement[arrangement]} ${classes.gap[gap]} ${classes.justify[justify]} ${classes.align[align]} ${props.borderRadius ? "" : classes.radius[radius]}`}/></Sized>; },
    },
    Heading: textComponent("heading", "Heading", false),
    Subheading: textComponent("subheading", "Subheading", false),
    Paragraph: textComponent("paragraph", "Paragraph", true),
    InlineText: textComponent("text", "Text", false),
    ImageBlock: {
      label: "Image", defaultProps: { srcMode: "static", srcValue: "", srcField: "", altMode: "static", altValue: "", altField: "", shape: "portrait", fit: "cover", radius: "none", ...sizingDefaults("full") },
      fields: withSizingFields({ srcMode: modeField("Image"), srcValue: { type: "text", label: "Image URL or storage path" }, altMode: modeField("Alternative text"), altValue: { type: "text", label: "Alternative text" }, shape: select("Shape", ["portrait", "square", "landscape"]), fit: select("Fit", ["cover", "contain"]) }),
      resolveFields: (data: any) => withSizingFields({ srcMode: modeField("Image"), ...(data.props.srcMode === "dynamic" ? { srcField: selectField("Image column", imageColumns) } : { srcValue: { type: "text", label: "Image URL or storage path" } }), altMode: modeField("Alternative text"), ...(data.props.altMode === "dynamic" ? { altField: selectField("Alternative-text column", textColumns) } : { altValue: { type: "text", label: "Alternative text" } }), shape: select("Shape", ["portrait", "square", "landscape"]), fit: select("Fit", ["cover", "contain"]) }),
      render: (props: any) => { const src = imageSource(useResolved(props.srcMode, props.srcValue, props.srcField)); const alt = text(useResolved(props.altMode, props.altValue, props.altField)); const legacyRadius = props.borderRadius ? "" : classes.radius[props.radius]; return <Sized props={props}>{src ? <img src={src} alt={alt} loading="lazy" decoding="async" className={`block size-full ${classes.image[props.shape]} ${classes.fit[props.fit]} ${legacyRadius}`}/> : <div aria-label={alt || undefined} className={`size-full bg-[#302117] ${classes.image[props.shape]} ${legacyRadius}`}/>}</Sized>; },
    },
    TagsBlock: {
      label: "Tags / list", defaultProps: { valuesMode: "static", valuesValue: "React, TypeScript", valuesField: "", tone: "default", ...sizingDefaults("fit") },
      fields: withSizingFields({ valuesMode: modeField("Values"), valuesValue: { type: "text", label: "Comma-separated values" }, tone: select("Colour", ["default", "accent"]) }),
      resolveFields: (data: any) => withSizingFields({ valuesMode: modeField("Values"), ...(data.props.valuesMode === "dynamic" ? { valuesField: selectField("List column", listColumns) } : { valuesValue: { type: "text", label: "Comma-separated values" } }), tone: select("Colour", ["default", "accent"]) }),
      render: (props: any) => { const raw = useResolved(props.valuesMode, props.valuesValue, props.valuesField); const values = Array.isArray(raw) ? raw.filter((value): value is string => typeof value === "string") : text(raw).split(",").map((value) => value.trim()).filter(Boolean); return <Sized props={props} className="flex flex-wrap gap-2">{values.slice(0, 12).map((value) => <span key={value} className={`border border-white/15 px-2 py-1 font-mono text-xs ${props.tone === "accent" ? "text-[#ff6b24]" : ""}`}>{value}</span>)}</Sized>; },
    },
    DateBlock: {
      label: "Date", defaultProps: { dateMode: "static", dateValue: "2026-01-01", dateField: "", format: "medium", ...sizingDefaults("fit") },
      fields: withSizingFields({ dateMode: modeField("Date"), dateValue: { type: "text", label: "Date" }, format: select("Format", ["month-year", "medium", "iso"]) }),
      resolveFields: (data: any) => withSizingFields({ dateMode: modeField("Date"), ...(data.props.dateMode === "dynamic" ? { dateField: selectField("Date column", dateColumns) } : { dateValue: { type: "text", label: "Date" } }), format: select("Format", ["month-year", "medium", "iso"]) }),
      render: (props: any) => { const raw = text(useResolved(props.dateMode, props.dateValue, props.dateField)); const date = new Date(raw); const label = !raw || Number.isNaN(date.getTime()) ? "" : props.format === "iso" ? date.toISOString().slice(0, 10) : date.toLocaleDateString("en-US", props.format === "month-year" ? { month: "short", year: "numeric" } : { dateStyle: "medium" }); return <Sized props={props}><time className="font-mono text-xs uppercase text-[#ff6b24]">{label}</time></Sized>; },
    },
    Button: {
      label: "Button", defaultProps: { labelMode: "static", labelValue: "Button", labelField: "", hrefMode: "static", hrefValue: "/", hrefField: "", hrefPrefix: "", variant: "primary", size: "medium", fullWidth: false, newTab: false, ...sizingDefaults("fit") },
      fields: withSizingFields({ labelMode: modeField("Label"), labelValue: { type: "text", label: "Label" }, hrefMode: modeField("Destination"), hrefValue: { type: "text", label: "Internal path or HTTPS URL" }, hrefPrefix: { type: "text", label: "Optional path prefix" }, variant: select("Style", ["primary", "secondary", "outline", "text"]), size: select("Size", ["small", "medium", "large"]), newTab: { type: "radio", label: "External link", options: [{ label: "Same tab", value: false }, { label: "New tab", value: true }] } }),
      resolveFields: (data: any) => withSizingFields({ labelMode: modeField("Label"), ...(data.props.labelMode === "dynamic" ? { labelField: selectField("Label column", textColumns) } : { labelValue: { type: "text", label: "Label" } }), hrefMode: modeField("Destination"), ...(data.props.hrefMode === "dynamic" ? { hrefField: selectField("URL or ID column", urlColumns), hrefPrefix: { type: "text", label: "Optional path prefix, e.g. /project/" } } : { hrefValue: { type: "text", label: "Internal path or HTTPS URL" } }), variant: select("Style", ["primary", "secondary", "outline", "text"]), size: select("Size", ["small", "medium", "large"]), newTab: { type: "radio", label: "External link", options: [{ label: "Same tab", value: false }, { label: "New tab", value: true }] } }),
      render: (props: any) => { const label = text(useResolved(props.labelMode, props.labelValue, props.labelField)); const href = safeHref(useResolved(props.hrefMode, props.hrefValue, props.hrefField, props.hrefPrefix)); const variant = { primary: "bg-[#ff6b24] text-white", secondary: "bg-white text-black", outline: "border border-white/40 text-white", text: "text-[#ff6b24]" }[props.variant as "primary" | "secondary" | "outline" | "text"]; const size = { small: "px-3 py-2 text-xs", medium: "px-4 py-2.5 text-sm", large: "px-6 py-3 text-base" }[props.size as "small" | "medium" | "large"]; return <Sized props={props}><SmartLink href={href} newTab={props.newTab} className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium !no-underline ${variant} ${size} ${props.fullWidth ? "w-full" : "w-auto"}`}>{label}<ArrowUpRight size={15}/></SmartLink></Sized>; },
    },
    LinkBlock: {
      label: "Link", defaultProps: { labelMode: "static", labelValue: "View details", labelField: "", hrefMode: "static", hrefValue: "/", hrefField: "", hrefPrefix: "", newTab: false, ...sizingDefaults("fit") },
      fields: withSizingFields({ labelMode: modeField("Label"), labelValue: { type: "text", label: "Label" }, hrefMode: modeField("Destination"), hrefValue: { type: "text", label: "Internal path or HTTPS URL" }, hrefPrefix: { type: "text", label: "Optional path prefix" }, newTab: { type: "radio", options: [{ label: "Same tab", value: false }, { label: "New tab", value: true }] } }),
      resolveFields: (data: any) => withSizingFields({ labelMode: modeField("Label"), ...(data.props.labelMode === "dynamic" ? { labelField: selectField("Label column", textColumns) } : { labelValue: { type: "text", label: "Label" } }), hrefMode: modeField("Destination"), ...(data.props.hrefMode === "dynamic" ? { hrefField: selectField("URL or ID column", urlColumns), hrefPrefix: { type: "text", label: "Optional path prefix" } } : { hrefValue: { type: "text", label: "Internal path or HTTPS URL" } }), newTab: { type: "radio", options: [{ label: "Same tab", value: false }, { label: "New tab", value: true }] } }),
      render: (props: any) => { const label = text(useResolved(props.labelMode, props.labelValue, props.labelField)); const href = safeHref(useResolved(props.hrefMode, props.hrefValue, props.hrefField, props.hrefPrefix)); return <Sized props={props}><SmartLink href={href} newTab={props.newTab} className="inline-flex items-center gap-2 font-mono text-xs text-[#ff6b24] !no-underline">{label}<ArrowUpRight size={15}/></SmartLink></Sized>; },
    },
    Index: { label: "Item number", fields: designFields, defaultProps: sizingDefaults("fit"), render: (props: any) => <Sized props={props}><ItemIndex/></Sized> },
    Divider: { label: "Divider", fields: designFields, defaultProps: sizingDefaults("full"), render: (props: any) => <Sized props={props}><hr className="w-full border-white/20"/></Sized> },
    Spacer: { label: "Spacing", fields: withSizingFields({ size: select("Size", ["small", "medium", "large"]) }), defaultProps: { size: "medium", ...sizingDefaults("full") }, render: (props: any) => <Sized props={props} className={classes.spacer[props.size]}><span aria-hidden="true"/></Sized> },
  } };
  return config as unknown as Config<Blocks>;
}

const allowedV2 = new Set(["SectionHeading", "Collection", "Group", "Heading", "Subheading", "Paragraph", "InlineText", "ImageBlock", "TagsBlock", "DateBlock", "Button", "LinkBlock", "Index", "Divider", "Spacer"]);
const dynamicProps: Record<string, Array<[string, BindingKind]>> = {
  Heading: [["contentField", "text"]], Subheading: [["contentField", "text"]], Paragraph: [["contentField", "text"]], InlineText: [["contentField", "text"]],
  ImageBlock: [["srcField", "image"], ["altField", "text"]], TagsBlock: [["valuesField", "list"]], DateBlock: [["dateField", "date"]],
  Button: [["labelField", "text"], ["hrefField", "url"]], LinkBlock: [["labelField", "text"], ["hrefField", "url"]],
};

export type TemplateAnalysis = { slots: []; dependencies: TemplateDependency[]; collection: VisualLayoutV2["collection"] };

export function analyzeTemplate(data: PuckTemplateData, sources: HomepageSectionConfiguration[]): TemplateAnalysis {
  let count = 0;
  let collection: { props: Record<string, unknown> } | null = null;
  const used = new Map<string, SectionFieldType | "unknown">();
  const requestedKinds = new Map<string, Set<BindingKind>>();
  function walk(nodes: unknown, depth = 0, insideCollection = false): void {
    if (!Array.isArray(nodes) || depth > 8) throw new Error("The template has too many nested blocks.");
    for (const candidate of nodes) {
      count++;
      if (count > 120 || !candidate || typeof candidate !== "object" || !("type" in candidate) || !("props" in candidate)) throw new Error("The template is invalid or exceeds 120 blocks.");
      const node = candidate as TemplateNode;
      if (!allowedV2.has(node.type) || !node.props || typeof node.props !== "object") throw new Error("The template contains an unsupported block.");
      if (node.type === "Collection") {
        if (collection) throw new Error("Use exactly one Repeating items block.");
        collection = { props: node.props };
        walk(node.props.item, depth + 1, true);
      } else if (node.type === "Group") walk(node.props.content, depth + 1, insideCollection);
      for (const [property, kind] of dynamicProps[node.type] || []) {
        const modeProperty = property.replace("Field", "Mode");
        if (node.props[modeProperty] !== "dynamic") continue;
        if (!insideCollection) throw new Error("Database fields can only be used inside Repeating items.");
        const field = node.props[property];
        if (typeof field !== "string" || !identifier.test(field)) throw new Error(`${node.type} needs a database column.`);
        used.set(field, kind === "date" ? "date" : "unknown");
        const kinds = requestedKinds.get(field) || new Set<BindingKind>();
        kinds.add(kind);
        requestedKinds.set(field, kinds);
      }
    }
  }
  if (JSON.stringify(data).length > 120000) throw new Error("The template is too large.");
  walk(data.content);
  const selectedCollection = collection as { props: Record<string, unknown> } | null;
  if (!selectedCollection) throw new Error("Add one Repeating items block.");
  const props = selectedCollection.props;
  const sourceKey = typeof props.sourceSection === "string" ? props.sourceSection : "";
  const source = sources.find((item) => item.section_key === sourceKey);
  if (!source) throw new Error("Choose a valid data source for Repeating items.");
  const orderBy = typeof props.orderBy === "string" ? props.orderBy : "";
  if (!compatibleFields(source, "sort").some((field) => field.key === orderBy)) throw new Error("Choose a sortable Order by field.");
  used.set(orderBy, source.data_schema.fields.find((field) => field.key === orderBy)?.type || "unknown");
  if (used.size < 2) throw new Error("Bind at least one card block to a database column.");
  for (const [field] of used) {
    const schemaField = source.data_schema.fields.find((candidate) => candidate.key === field);
    if (!schemaField) throw new Error(`Column ${field} is not available in ${source.heading.eyebrow}.`);
    for (const kind of requestedKinds.get(field) || []) {
      if (!compatibleTypes[kind].includes(schemaField.type)) throw new Error(`${schemaField.label} cannot be used by this type of block.`);
    }
  }
  const identity = source.data_schema.fields.find((field) => field.generated && ["uuid", "integer", "string"].includes(field.type));
  if (identity) used.set(identity.key, identity.type);
  const preset = props.preset;
  const limit = Number(props.limit);
  const direction = props.orderDirection;
  if (!["project", "experience", "blog"].includes(String(preset))) throw new Error("Choose one of the three card presets.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 12) throw new Error("Items to show must be between 1 and 12.");
  if (direction !== "asc" && direction !== "desc") throw new Error("Choose an order direction.");
  const dependencies = Array.from(used, ([field, fallback]) => ({ field, type: source.data_schema.fields.find((candidate) => candidate.key === field)?.type || fallback }));
  return { slots: [], dependencies, collection: { source_section: sourceKey, preset: preset as CardPreset, limit, order_by: orderBy, order_direction: direction } };
}

export function starterTemplate(preset: CardPreset, source: HomepageSectionConfiguration): PuckTemplateData {
  const preferredOrder = PRESET_FIELDS[preset].order;
  const orderBy = compatibleFields(source, "sort").find((field) => field.key === preferredOrder)?.key || compatibleFields(source, "sort")[0]?.key || source.data_schema.fields[0]?.key || "id";
  return { root: {}, content: [block("SectionHeading", {}), block("Collection", { preset, sourceSection: source.section_key, limit: 3, orderBy, orderDirection: preset === "blog" || preset === "experience" ? "desc" : "asc", layout: preset === "experience" ? "timeline" : preset === "blog" ? "stack" : "grid", desktopColumns: preset === "project" ? "3" : "1", gap: "medium", item: presetCard(preset) })] } as PuckTemplateData;
}

function legacySource(template: TemplateDefinition | null, sources: HomepageSectionConfiguration[]) {
  const key = template?.template_key.startsWith("experience") ? "experience" : template?.template_key.startsWith("blog") ? "blog" : "project";
  return sources.find((source) => source.section_key === key) || sources[0];
}

function mapLegacyNodes(nodes: TemplateNode[], source: HomepageSectionConfiguration): TemplateNode[] {
  const preset = source.section_key === "experience" ? "experience" : source.section_key === "blog" ? "blog" : "project";
  const presetFields = PRESET_FIELDS[preset];
  const legacyFallback: Record<string, string> = {
    image: presetFields.image, category: presetFields.category, title: presetFields.title,
    description: presetFields.description, tags: presetFields.tags, link: presetFields.link,
    date: presetFields.date, start: presetFields.date, end: presetFields.date,
  };
  const bind = (slot: unknown) => {
    const value = typeof slot === "string" ? source.field_bindings?.[slot] : undefined;
    const fallback = typeof slot === "string" ? legacyFallback[slot] || slot : "";
    return typeof value === "string" ? { field: value, prefix: "" } : value || { field: fallback, prefix: "" };
  };
  return nodes.flatMap((node) => {
    if (node.type === "Collection") return [block("Collection", { preset: source.section_key === "experience" ? "experience" : source.section_key === "blog" ? "blog" : "project", sourceSection: source.section_key, limit: 3, orderBy: source.section_key === "experience" ? "work_start_date" : source.section_key === "blog" ? "published_at" : "project_priority", orderDirection: source.section_key === "project" ? "asc" : "desc", layout: node.props.layout === "timeline" ? "timeline" : node.props.layout === "stack" ? "stack" : "grid", desktopColumns: node.props.desktop || "3", gap: node.props.gap || "medium", item: mapLegacyNodes((node.props.item as TemplateNode[]) || [], source) })];
    if (node.type === "Group") return [block("Group", { surface: node.props.surface || "none", padding: node.props.padding || "none", arrangement: node.props.arrangement === "row" ? "row" : node.props.arrangement === "split" ? "grid" : "column", gap: "small", justify: "start", align: "start", radius: node.props.surface === "card" ? "medium" : "none", content: mapLegacyNodes((node.props.content as TemplateNode[]) || [], source) })];
    if (node.type === "Text") { const binding = bind(node.props.slot); const style = node.props.style; const type = style === "title" ? "Heading" : style === "subtitle" || style === "eyebrow" ? "Subheading" : style === "date" ? "DateBlock" : "Paragraph"; return type === "DateBlock" ? [block(type, { dateMode: "dynamic", dateValue: "", dateField: binding.field, format: "month-year" })] : [block(type, { ...defaultText(type === "Heading" ? "heading" : type === "Subheading" ? "subheading" : "paragraph", binding.field, ""), contentMode: "dynamic" })]; }
    if (node.type === "Image") { const binding = bind(node.props.slot); return [block("ImageBlock", { srcMode: "dynamic", srcValue: "", srcField: binding.field, altMode: "static", altValue: "", altField: "", shape: node.props.shape || "portrait", fit: node.props.fit || "cover", radius: "none" })]; }
    if (node.type === "Tags") { const binding = bind(node.props.slot); return [block("TagsBlock", { valuesMode: "dynamic", valuesValue: "", valuesField: binding.field, tone: "default" })]; }
    if (node.type === "Link") { const binding = bind(node.props.slot); return [block("LinkBlock", { labelMode: "static", labelValue: node.props.label || "View details", labelField: "", hrefMode: "dynamic", hrefValue: "", hrefField: binding.field, hrefPrefix: binding.prefix, newTab: false })]; }
    if (node.type === "StaticLink") return [block("LinkBlock", { labelMode: "static", labelValue: node.props.label || "View all", labelField: "", hrefMode: "static", hrefValue: node.props.href || "/", hrefField: "", hrefPrefix: "", newTab: false })];
    if (node.type === "DateRange") { const first = bind(node.props.start); const second = bind(node.props.end); return [block("DateBlock", { dateMode: "dynamic", dateValue: "", dateField: first.field, format: "month-year" }), block("DateBlock", { dateMode: "dynamic", dateValue: "", dateField: second.field, format: "month-year" })]; }
    if (["SectionHeading", "Index", "Divider", "Spacer"].includes(node.type)) return [block(node.type as keyof Blocks, { ...node.props, id: undefined })];
    return [];
  });
}

export function asPuckLayout(template: TemplateDefinition | null, sources: HomepageSectionConfiguration[]): VisualLayoutV2 {
  const source = legacySource(template, sources);
  if (!source) throw new Error("Create a homepage section before designing a template.");
  if (template?.layout_definition.variant === "puck" && template.layout_definition.schema_version === 2) return template.layout_definition;
  if (template?.layout_definition.variant === "puck") {
    const data = { root: template.layout_definition.puck_data.root || {}, content: mapLegacyNodes(template.layout_definition.puck_data.content, source) } as PuckTemplateData;
    const analysis = analyzeTemplate(data, sources);
    return { variant: "puck", schema_version: 2, show_heading: data.content.some((node) => node.type === "SectionHeading"), fields: analysis.dependencies.map((item) => item.field), dependencies: { section_key: analysis.collection.source_section, fields: analysis.dependencies }, collection: analysis.collection, puck_data: data as PuckLayoutData };
  }
  const preset: CardPreset = template?.layout_definition.variant === "timeline" ? "experience" : template?.layout_definition.variant === "list" ? "blog" : "project";
  const data = starterTemplate(preset, source);
  const analysis = analyzeTemplate(data, sources);
  return { variant: "puck", schema_version: 2, show_heading: true, fields: analysis.dependencies.map((item) => item.field), dependencies: { section_key: analysis.collection.source_section, fields: analysis.dependencies }, collection: analysis.collection, puck_data: data as PuckLayoutData };
}

function LegacyNode({ node, section }: { node: TemplateNode; section: DynamicSection }) {
  const { item } = useContext(ItemContext);
  const value = (slot: unknown) => slotValue(item, section.field_bindings[String(slot)]);
  if (node.type === "SectionHeading") return <Sized props={node.props}><HomepageSectionHeading section={section}/></Sized>;
  if (node.type === "Collection") {
    const gap = String(node.props.gap || "medium");
    const wrapper = node.props.layout === "timeline" ? `grid border-l border-[#ff6b24]/70 pl-5 ${classes.gap[gap]}` : node.props.layout === "stack" ? `grid ${classes.gap[gap]}` : `grid grid-cols-1 md:grid-cols-2 ${classes.columns[String(node.props.desktop || "3")]} ${classes.gap[gap]}`;
    return <div className={wrapper}>{section.items.map((record, index) => <ItemContext.Provider key={String(record.id ?? index)} value={{ item: record, index }}><NodeList nodes={(node.props.item as TemplateNode[]) || []} section={section} legacy/></ItemContext.Provider>)}</div>;
  }
  if (node.type === "Group") return <div className={`${classes.surface[String(node.props.surface || "none")]} ${classes.padding[String(node.props.padding || "none")]} ${node.props.arrangement === "row" ? classes.arrangement.row : node.props.arrangement === "split" ? classes.arrangement.grid : classes.arrangement.column} gap-3`}><NodeList nodes={(node.props.content as TemplateNode[]) || []} section={section} legacy/></div>;
  if (node.type === "Text") { const label = text(value(node.props.slot)); return node.props.style === "title" ? <h3 className="font-serif text-2xl md:text-3xl">{label}</h3> : <p className={node.props.style === "eyebrow" || node.props.style === "date" ? "font-mono text-xs text-[#ff6b24]" : "text-sm leading-6 text-[#aaa7a2]"}>{label}</p>; }
  if (node.type === "Image") { const src = imageSource(value(node.props.slot)); return src ? <img src={src} alt="" loading="lazy" className="aspect-[4/5] w-full object-contain"/> : null; }
  if (node.type === "Tags") { const values = value(node.props.slot); return <div className="flex flex-wrap gap-2">{Array.isArray(values) && values.map((tag) => <span key={String(tag)} className="border border-white/15 px-2 py-1 text-xs">{String(tag)}</span>)}</div>; }
  if (node.type === "Link" || node.type === "StaticLink") { const href = safeHref(node.type === "Link" ? value(node.props.slot) : node.props.href); return <SmartLink href={href} newTab={false} className="inline-flex items-center gap-2 text-xs text-[#ff6b24]">{String(node.props.label || "View details")}<ArrowUpRight size={15}/></SmartLink>; }
  if (node.type === "Index") return <ItemIndex/>;
  if (node.type === "Divider") return <hr className="border-white/20"/>;
  if (node.type === "Spacer") return <div className={classes.spacer[String(node.props.size || "medium")]}/>;
  return null;
}

function V2Node({ node, section }: { node: TemplateNode; section: DynamicSection }) {
  const { item } = useContext(ItemContext);
  const resolved = (base: string) => bindingValue(item, node.props[`${base}Mode`] as SourceMode, node.props[`${base}Value`], String(node.props[`${base}Field`] || ""), String(node.props[`${base}Prefix`] || ""));
  if (!allowedV2.has(node.type)) return null;
  if (node.type === "SectionHeading") return <HomepageSectionHeading section={section}/>;
  if (node.type === "Collection") {
    const gap = String(node.props.gap || "medium");
    const columns = String(node.props.desktopColumns || "3");
    const wrapper = node.props.layout === "timeline" ? `grid border-l border-[#ff6b24]/70 pl-5 ${classes.gap[gap]}` : node.props.layout === "stack" ? `grid grid-cols-1 ${classes.gap[gap]}` : `grid grid-cols-1 ${classes.columns[columns]} ${classes.gap[gap]}`;
    return <Sized props={node.props} className={wrapper}>{section.items.map((record, index) => <ItemContext.Provider key={String(record.id ?? record.project_id ?? record.work_id ?? index)} value={{ item: record, index }}><NodeList nodes={(node.props.item as TemplateNode[]) || []} section={section}/></ItemContext.Provider>)}</Sized>;
  }
  if (node.type === "Group") return <Sized props={node.props} className={`${classes.surface[String(node.props.surface)] || ""} ${classes.padding[String(node.props.padding)] || ""} ${classes.arrangement[String(node.props.arrangement)] || classes.arrangement.column} ${classes.gap[String(node.props.gap)] || classes.gap.small} ${classes.justify[String(node.props.justify)] || ""} ${classes.align[String(node.props.align)] || ""} ${node.props.borderRadius ? "" : classes.radius[String(node.props.radius)] || ""}`}><NodeList nodes={(node.props.content as TemplateNode[]) || []} section={section}/></Sized>;
  if (["Heading", "Subheading", "Paragraph", "InlineText"].includes(node.type)) return <TextElement kind={node.type === "Heading" ? "heading" : node.type === "Subheading" ? "subheading" : node.type === "Paragraph" ? "paragraph" : "text"} props={node.props as unknown as TextProps}/>;
  if (node.type === "ImageBlock") { const src = imageSource(resolved("src")); const alt = text(resolved("alt")); const legacyRadius = node.props.borderRadius ? "" : classes.radius[String(node.props.radius)]; return <Sized props={node.props}>{src ? <img src={src} alt={alt} loading="lazy" decoding="async" className={`block size-full ${classes.image[String(node.props.shape)]} ${classes.fit[String(node.props.fit)]} ${legacyRadius}`}/> : <div aria-label={alt || undefined} className={`size-full bg-[#302117] ${classes.image[String(node.props.shape)]} ${legacyRadius}`}/>}</Sized>; }
  if (node.type === "TagsBlock") { const raw = resolved("values"); const values = Array.isArray(raw) ? raw.map(String) : text(raw).split(",").map((value) => value.trim()).filter(Boolean); return <Sized props={node.props} className="flex flex-wrap gap-2">{values.slice(0, 12).map((tag) => <span key={tag} className={`border border-white/15 px-2 py-1 font-mono text-xs ${node.props.tone === "accent" ? "text-[#ff6b24]" : ""}`}>{tag}</span>)}</Sized>; }
  if (node.type === "DateBlock") { const raw = text(resolved("date")); const date = new Date(raw); const label = !raw || Number.isNaN(date.getTime()) ? "" : node.props.format === "iso" ? date.toISOString().slice(0, 10) : date.toLocaleDateString("en-US", node.props.format === "month-year" ? { month: "short", year: "numeric" } : { dateStyle: "medium" }); return <Sized props={node.props}><time className="font-mono text-xs uppercase text-[#ff6b24]">{label}</time></Sized>; }
  if (node.type === "Button" || node.type === "LinkBlock") { const label = text(resolved("label")); const href = safeHref(resolved("href")); const isButton = node.type === "Button"; const variant = { primary: "bg-[#ff6b24] text-white", secondary: "bg-white text-black", outline: "border border-white/40 text-white", text: "text-[#ff6b24]" }[String(node.props.variant)] || "text-[#ff6b24]"; const size = { small: "px-3 py-2 text-xs", medium: "px-4 py-2.5 text-sm", large: "px-6 py-3 text-base" }[String(node.props.size)] || "text-xs"; return <Sized props={node.props}><SmartLink href={href} newTab={Boolean(node.props.newTab)} className={isButton ? `inline-flex items-center justify-center gap-2 rounded-lg font-medium !no-underline ${variant} ${size} ${node.props.fullWidth ? "w-full" : "w-auto"}` : "inline-flex items-center gap-2 font-mono text-xs text-[#ff6b24] !no-underline"}>{label}<ArrowUpRight size={15}/></SmartLink></Sized>; }
  if (node.type === "Index") return <Sized props={node.props}><ItemIndex/></Sized>;
  if (node.type === "Divider") return <Sized props={node.props}><hr className="w-full border-white/20"/></Sized>;
  if (node.type === "Spacer") return <Sized props={node.props} className={classes.spacer[String(node.props.size)]}><span aria-hidden="true"/></Sized>;
  return null;
}

function NodeList({ nodes, section, legacy = false }: { nodes: TemplateNode[]; section: DynamicSection; legacy?: boolean }) {
  return <>{nodes.map((node, index) => <span className="contents" key={String(node.props.id ?? index)}>{legacy ? <LegacyNode node={node} section={section}/> : <V2Node node={node} section={section}/>}</span>)}</>;
}

export function VisualTemplate({ section, layout }: { section: DynamicSection; layout: VisualLayout }) {
  return <NodeList nodes={layout.puck_data.content} section={section} legacy={layout.schema_version === 1}/>;
}
