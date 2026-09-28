import { Children, isValidElement, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { createUsePuck, Puck, type Overrides } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import supabase from "@/Superbase/client";
import { parseHeadingManifest, type HomepageSectionConfiguration, type SectionFieldType } from "@/features/homepageSections/manifest";
import type { DynamicSection, TemplateDefinition, TemplateNode } from "@/features/homepageSections/templates";
import { analyzeTemplate, asPuckLayout, createTemplateConfig, type PuckTemplateData } from "@/features/homepageSections/puckTemplates";
import type { TemplateDetails } from "./TemplateDetailsDialog";

type SectionTemplate = TemplateDefinition & { reference_section_key: string | null; display_fields: string[] };

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

export function TemplateDesigner({ original, details, onClose, onSaved }: { original: SectionTemplate | null; details: TemplateDetails; onClose: () => void; onSaved: () => void }) {
  const [sources, setSources] = useState<HomepageSectionConfiguration[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(!original || details.display_name !== original.display_name || details.description !== original.description || details.is_published !== original.is_published);

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
  const close = useCallback(() => {
    if (busy) return;
    if (dirty && !window.confirm("Discard unpublished template changes?")) return;
    onClose();
  }, [busy, dirty, onClose]);
  const overrides = useMemo<Partial<Overrides>>(() => ({
    ...templateOverrides,
    headerActions: ({ children }) => <div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={close} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-40"><X size={14}/>Close designer</button>{children}</div>,
  }), [busy, close]);

  const save = async (data: PuckTemplateData) => {
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
      display_name: details.display_name, description: details.description, layout_key: "puck", reference_section_key: analysis.collection.source_section,
      display_fields: analysis.dependencies.map((item) => item.field), layout_definition: definition, slots: analysis.slots,
      is_published: details.is_published, updated_at: new Date().toISOString(),
    };
    const result = original
      ? await supabase.from("section_templates").update(patch).eq("template_key", details.template_key).select("template_key").single()
      : await supabase.from("section_templates").insert({ ...patch, template_key: details.template_key, is_builtin: false }).select("template_key").single();
    if (result.error) setError(result.error.message); else onSaved();
    setBusy(false);
  };

  if (loading) return <div className="flex min-h-96 items-center justify-center gap-3 p-8 text-sm text-gray-500"><Loader2 size={18} className="animate-spin"/>Loading section schemas…</div>;
  if (!initial || !source) return <div className="p-6"><p role="alert" className="text-sm text-red-600">{error || "Create at least one homepage section before designing templates."}</p><button type="button" onClick={close} className="mt-4 rounded-lg border px-4 py-2 text-sm">Close designer</button></div>;

  return <div className="relative h-dvh overflow-hidden bg-white text-gray-900 dark:bg-gray-800">
    {error && <p role="alert" className="absolute left-1/2 top-16 z-[110] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-lg">{error}</p>}
    <div className="h-full overflow-hidden">
      <Puck config={config} data={initial.puck_data as PuckTemplateData}
        ui={{ leftSideBarVisible: false, rightSideBarVisible: false }}
        overrides={overrides}
        onChange={(data) => { setDirty(true); const next = sourceFromData(data); if (next && next !== selectedSource) setSelectedSource(next); }}
        onPublish={async (data) => { if (!busy) await save(data); }}/>
    </div>
  </div>;
}
