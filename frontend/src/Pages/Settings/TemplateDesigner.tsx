import { Children, isValidElement, useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { createUsePuck, Puck, type Overrides } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import supabase from "@/Superbase/client";
import { parseHeadingManifest, type HomepageSectionConfiguration, type SectionFieldType } from "@/features/homepageSections/manifest";
import type { DynamicSection, TemplateDefinition, TemplateNode } from "@/features/homepageSections/templates";
import { analyzeTemplate, asPuckLayout, createTemplateConfig, type PuckTemplateData } from "@/features/homepageSections/puckTemplates";

type SectionTemplate = TemplateDefinition & { reference_section_key: string | null; display_fields: string[] };
const input = "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900";

const designFieldNames = new Set([
  "width", "height", "innerSpacing", "outerSpacing", "background", "opacity", "overflow", "aspectRatio", "shadow", "rotation",
  "position", "positionOffsets", "zIndex", "borderStyle", "borderWidth", "borderColor", "borderSides", "borderRadius",
  "layout", "desktopColumns", "gap", "surface", "arrangement", "justify", "align", "padding", "radius",
  "size", "weight", "tone", "fontFamily", "fontSize", "lineHeight", "letterSpacing", "italic", "decoration", "transform",
  "wrapping", "paragraphSpacing", "fit", "shape", "imagePosition", "imageAspect", "imageOpacity", "brightness", "contrast",
  "saturation", "grayscale", "overlayColor", "overlayOpacity", "format", "variant", "textColor",
]);

const useTemplatePuck = createUsePuck();

const fieldNameFromChild = (child: ReactNode) => {
  if (!isValidElement(child) || child.key === null) return "";
  return String(child.key).replace(/^\.\$/, "").replace(/^\$/, "");
};

function TemplateFields({ children, isLoading }: { children: ReactNode; isLoading: boolean }) {
  const activePlugin = useTemplatePuck((state) => state.appState.ui.plugin.current);
  const designMode = activePlugin === "outline";
  const visibleFields = Children.toArray(children).filter((child) => designFieldNames.has(fieldNameFromChild(child)) === designMode);

  return <div className="grid gap-4 p-4">
    <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{designMode ? "Design" : "Content"}</p>
      <p className="mt-1 text-xs text-gray-500">{designMode ? "Edit layout, spacing, typography, borders, and visual styles." : "Choose static or database content and edit the block's data."}</p>
    </div>
    {visibleFields.length ? visibleFields : !isLoading && <p className="text-xs text-gray-500">This block has no {designMode ? "design" : "content"} controls.</p>}
  </div>;
}

const templateOverrides: Partial<Overrides> = { fields: TemplateFields };

const sampleValue = (field: { key: string; label: string; type: SectionFieldType }, index: number) => {
  if (field.type === "string_array") return ["React", "Design", "Portfolio"];
  if (field.type === "integer" || field.type === "number") return index + 1;
  if (field.type === "boolean") return true;
  if (field.type === "date" || field.type === "datetime") return `202${index + 3}-0${index + 1}-01`;
  if (field.type === "image") return "";
  if (field.type === "url") return "https://example.com";
  return `${field.label} ${index + 1}`;
};

function sourceFromData(data: PuckTemplateData) {
  const visit = (nodes: TemplateNode[]): string => {
    for (const node of nodes) {
      if (node.type === "Collection" && typeof node.props.sourceSection === "string") return node.props.sourceSection;
      for (const property of ["item", "content"]) {
        if (Array.isArray(node.props[property])) {
          const value = visit(node.props[property] as TemplateNode[]);
          if (value) return value;
        }
      }
    }
    return "";
  };
  return visit(data.content as TemplateNode[]);
}

export function TemplateDesigner({ original, onClose, onSaved }: { original: SectionTemplate | null; onClose: () => void; onSaved: () => void }) {
  const [key, setKey] = useState(original?.template_key || "");
  const [name, setName] = useState(original?.display_name || "");
  const [description, setDescription] = useState(original?.description || "");
  const [published, setPublished] = useState(original?.is_published ?? true);
  const [sources, setSources] = useState<HomepageSectionConfiguration[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await supabase.from("settings").select("setting_object,schema_version").eq("setting_name", "headings").single();
      if (cancelled) return;
      if (result.error || !result.data || result.data.schema_version !== 2) {
        setError(result.error?.message || "Homepage section schemas are unavailable.");
      } else {
        const parsed = parseHeadingManifest(result.data.setting_object);
        if (parsed.errors.length) setError("Homepage section schemas are invalid. Repair Headings before designing templates.");
        else setSources(parsed.sections);
      }
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const prepared = useMemo(() => {
    if (!sources.length) return { layout: null, failure: "" };
    try { return { layout: asPuckLayout(original, sources), failure: "" }; }
    catch (issue) { return { layout: null, failure: issue instanceof Error ? issue.message : "Unable to prepare this template." }; }
  }, [original, sources]);
  const initial = prepared.layout;

  useEffect(() => { if (prepared.failure) setError(prepared.failure); }, [prepared.failure]);

  useEffect(() => {
    if (initial) setSelectedSource(initial.collection.source_section);
  }, [initial]);

  const source = sources.find((item) => item.section_key === selectedSource) || sources[0];
  const sample: DynamicSection = useMemo(() => ({
    section_key: "template_preview",
    heading: source?.heading || { index: "01", eyebrow: "YOUR SECTION", title: "A reusable section layout" },
    order: 1,
    template_key: "template_preview",
    field_bindings: {},
    items: source ? [0, 1, 2].map((index) => Object.fromEntries(source.data_schema.fields.map((field) => [field.key, sampleValue(field, index)]))) : [],
  }), [source]);
  const config = useMemo(() => createTemplateConfig(sample, sources, selectedSource), [sample, sources, selectedSource]);

  const save = async (data: PuckTemplateData) => {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(key) || !name.trim() || !description.trim() || name.trim().length > 120 || description.trim().length > 500) {
      setError("Provide a valid key, name, and description before publishing."); return;
    }
    let analysis: ReturnType<typeof analyzeTemplate>;
    try { analysis = analyzeTemplate(data, sources); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Invalid layout."); return; }
    setBusy(true); setError("");
    const definition = {
      variant: "puck", schema_version: 2, show_heading: data.content.some((node) => node.type === "SectionHeading"),
      fields: analysis.dependencies.map((item) => item.field), dependencies: { section_key: analysis.collection.source_section, fields: analysis.dependencies },
      collection: analysis.collection, puck_data: data,
    };
    const patch = {
      display_name: name.trim(), description: description.trim(), layout_key: "puck", reference_section_key: analysis.collection.source_section,
      display_fields: analysis.dependencies.map((item) => item.field), layout_definition: definition, slots: analysis.slots,
      is_published: published, updated_at: new Date().toISOString(),
    };
    const result = original
      ? await supabase.from("section_templates").update(patch).eq("template_key", key).select("template_key").single()
      : await supabase.from("section_templates").insert({ ...patch, template_key: key, is_builtin: false }).select("template_key").single();
    if (result.error) setError(result.error.message); else onSaved();
    setBusy(false);
  };

  if (loading) return <div className="flex min-h-96 items-center justify-center gap-3 p-8 text-sm text-gray-500"><Loader2 size={18} className="animate-spin"/>Loading section schemas…</div>;
  if (!initial || !source) return <div className="p-6"><p role="alert" className="text-sm text-red-600">{error || "Create at least one homepage section before designing templates."}</p><button type="button" onClick={onClose} className="mt-4 rounded-lg border px-4 py-2 text-sm">Close designer</button></div>;

  return <div className="p-4 dark:text-white">
    <h2 className="text-lg font-semibold">{original ? `Edit ${original.display_name}` : "Create a reusable template"}</h2>
    <p className="mt-1 text-sm text-gray-500">Choose a preset in Repeating items, connect it to any section schema, then mix static and database-backed blocks inside the card.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_2fr]">
      <label className="text-sm">Template key<input className={input} value={key} disabled={!!original} maxLength={64} onChange={(event) => setKey(event.target.value)}/></label>
      <label className="text-sm">Display name<input className={input} value={name} maxLength={120} onChange={(event) => setName(event.target.value)}/></label>
      <label className="text-sm">Description<input className={input} value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)}/></label>
    </div>
    <div className="my-3 flex items-center justify-between gap-3"><p className="text-xs text-gray-500">Dynamic fields are selected directly on each block. Responsive behavior is automatic.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)}/>Available on homepage</label></div>
    {error && <p role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="mb-2 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Close designer</button></div>
    <div className="overflow-hidden rounded-xl border border-gray-300 text-gray-900 dark:border-gray-600">
      <Puck config={config} data={initial.puck_data as PuckTemplateData}
        overrides={templateOverrides}
        onChange={(data) => { const next = sourceFromData(data); if (next && next !== selectedSource) setSelectedSource(next); }}
        onPublish={async (data) => { if (!busy) await save(data); }}/>
    </div>
  </div>;
}
