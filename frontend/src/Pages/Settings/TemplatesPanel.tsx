import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, BookOpenText, BriefcaseBusiness, LayoutTemplate, Loader2, RefreshCw, Rocket } from "lucide-react";
import supabase from "@/Superbase/client";
import type { DynamicSection, TemplateDefinition } from "@/features/homepageSections/templates";
import { VisualTemplate } from "@/features/homepageSections/puckTemplates";

type SectionTemplate = TemplateDefinition & {
  reference_section_key: string | null;
  display_fields: string[];
};

const templateIcons = {
  project_grid: Rocket,
  experience_timeline: BriefcaseBusiness,
  blog_list: BookOpenText,
};
const TemplateDesigner = lazy(() => import("./TemplateDesigner").then(module => ({ default: module.TemplateDesigner })));
const builtInOrder = ["project_v1", "experience_v1", "blog_v1"];

export const TemplatesPanel = () => {
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<SectionTemplate | null | "new">(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await supabase.from("section_templates")
        .select("template_key,display_name,description,layout_key,reference_section_key,display_fields,is_builtin,is_published,layout_definition,slots")
        .order("template_key", { ascending: true });
      if (cancelled) return;
      if (result.error) {
        setError(result.error.message);
        setTemplates([]);
      } else {
        setError("");
        setTemplates(((result.data || []) as SectionTemplate[]).sort((a, b) => {
          const first = builtInOrder.indexOf(a.template_key);
          const second = builtInOrder.indexOf(b.template_key);
          if (first === -1 && second === -1) return a.template_key.localeCompare(b.template_key);
          if (first === -1) return 1;
          if (second === -1) return -1;
          return first - second;
        }));
      }
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [refresh]);

  return <section aria-labelledby="templates-title" className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 id="templates-title" className="text-xl font-semibold">Homepage templates</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Compose a layout once, then assign it to any section with compatible fields.</p></div>
      <div className="flex gap-2"><button type="button" onClick={() => setEditing("new")} className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm text-white">New template</button>
      <button type="button" aria-label="Refresh templates" disabled={loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}
        className="grid size-10 place-items-center rounded-xl border border-gray-300 bg-white text-gray-600 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/></button></div>
    </div>

    {loading ? <div role="status" className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-24 text-gray-500 dark:border-gray-700 dark:bg-gray-800"><Loader2 size={20} className="animate-spin"/>Loading templates…</div>
      : error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">Unable to load templates: {error}</div>
      : templates.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800"><LayoutTemplate size={28} className="mx-auto text-gray-400"/><p className="mt-3 font-medium">No templates found</p><p className="mt-1 text-sm text-gray-500">The template catalog has no records yet.</p></div>
      : <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {templates.map((template) => <TemplateCard key={template.template_key} template={template} onEdit={() => setEditing(template)}/>)}</div>}
    {editing && createPortal(
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-white dark:bg-gray-800" aria-label="Template layout designer">
        <div className="mx-auto max-w-[1600px]">
          <Suspense fallback={<p className="p-8 text-sm">Loading designer…</p>}><TemplateDesigner key={editing === "new" ? "new" : editing.template_key} original={editing === "new" ? null : editing}
            onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setLoading(true); setRefresh((value) => value + 1); }}/></Suspense>
        </div>
      </div>, document.body)}
  </section>;
};

const TemplateCard = ({ template, onEdit }: { template: SectionTemplate; onEdit: () => void }) => {
  const Icon = templateIcons[template.layout_key as keyof typeof templateIcons] || LayoutTemplate;
  const v2Dependencies = template.layout_definition.variant === "puck" && "schema_version" in template.layout_definition && template.layout_definition.schema_version === 2
    ? template.layout_definition.dependencies.fields : [];
  const previewValue = (field: string, type: string, index: number) => {
    if (type === "string_array") return ["React", "Design", "Portfolio"];
    if (type === "integer" || type === "number") return index + 1;
    if (type === "boolean") return true;
    if (type === "date" || type === "datetime") return `202${index + 3}-0${index + 1}-01`;
    if (type === "url") return "/projects";
    if (type === "image") return "";
    return `${field.replaceAll("_", " ")} ${index + 1}`;
  };
  const preview: DynamicSection = {
    section_key: "template_preview", heading: { index: "01", eyebrow: "PREVIEW", title: template.display_name },
    order: 1, template_key: template.template_key,
    field_bindings: Object.fromEntries(template.slots.map(slot => [slot.key, slot.key])),
    items: [0, 1, 2].map(index => v2Dependencies.length
      ? Object.fromEntries(v2Dependencies.map(dependency => [dependency.field, previewValue(dependency.field, dependency.type, index)]))
      : { title: `Example 0${index + 1}`, description: "Preview content for this template", category: "FEATURED", date: "2026-09-22", tags: ["React", "Design"], link: "/projects" }),
  };

  return <article className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="relative overflow-hidden border-b border-gray-700 bg-[#0c0c0c] p-5 text-[#f2efe9]">
      <span className="absolute right-4 top-4 rounded-md border border-white/20 bg-black/50 px-2 py-1 font-mono text-[10px] text-[#ff6b24]">Layout preview</span>
      <div className="mt-6 h-40 overflow-hidden">{template.layout_definition.variant === "puck" ?
        <div className="w-[250%] origin-top-left scale-[0.4] pointer-events-none"><VisualTemplate section={preview} layout={template.layout_definition}/></div> :
        <TemplatePreview layout={template.layout_key}/>}</div>
    </div>
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-base font-semibold"><Icon size={17} className="text-primary"/>{template.display_name}</h3>
        <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{template.template_key}</p></div>
        {template.is_builtin && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">Built in</span>}</div>
      <p className="min-h-12 text-sm leading-6 text-gray-600 dark:text-gray-300">{template.description}</p>
      <div className="border-t border-gray-100 pt-4 text-xs dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">Used by <span className="font-semibold capitalize text-gray-800 dark:text-gray-100">{template.reference_section_key || "No section yet"}</span></p>
        <p className="mt-3 font-medium text-gray-700 dark:text-gray-200">Fields displayed ({template.display_fields.length})</p>
        <div className="mt-2 flex flex-wrap gap-1.5">{template.display_fields.map((field) => <span key={field} className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[10px] text-gray-600 dark:bg-gray-900 dark:text-gray-300">{field}</span>)}</div>
        <button type="button" onClick={onEdit} className="mt-4 rounded-lg border border-gray-300 px-3 py-2 text-sm text-primary dark:border-gray-600">Edit layout</button>
      </div>
    </div>
  </article>;
};

const TemplatePreview = ({ layout }: { layout: string }) => {
  if (layout === "project_grid") return <div className="grid grid-cols-3 gap-2" aria-label="Three featured project cards">
    {["01", "02", "03"].map((index) => <div key={index} className="overflow-hidden rounded border border-white/15 bg-[#191919]">
      <div className="flex aspect-[4/3] items-start bg-gradient-to-br from-[#ff6b24]/40 via-[#312219] to-[#171717] p-2 font-mono text-[9px] text-[#ff6b24]">{index}</div>
      <div className="space-y-2 p-2"><div className="h-1 w-3/4 rounded bg-white/70"/><div className="h-1 w-full rounded bg-white/20"/><div className="h-1 w-1/2 rounded bg-white/20"/><span className="block h-2 w-8 rounded-sm border border-white/20"/></div>
    </div>)}
  </div>;

  if (layout === "experience_timeline") return <div className="ml-5 space-y-4 border-l border-[#ff6b24]/70 pl-5" aria-label="Experience timeline">
    {["Role and company", "Previous role"].map((role, index) => <div key={role} className="relative"><span className="absolute -left-[25px] top-1 size-2 rounded-full border-2 border-[#ff6b24] bg-[#0c0c0c]"/><p className="font-mono text-[10px] text-[#ff6b24]">{index ? "2022 — 2023" : "2023 — NOW"}</p><p className="mt-1 text-sm font-semibold">{role}</p><div className="mt-2 h-1 w-3/4 rounded bg-white/20"/></div>)}
  </div>;

  if (layout === "blog_list") return <div aria-label="Blog post list" className="divide-y divide-white/20 border-y border-white/20">
    {["A note from the build", "Designing useful systems", "Lessons in motion"].map((title, index) => <div key={title} className="grid grid-cols-[36px_1fr_auto] items-center gap-2 py-3"><span className="font-mono text-[10px] text-[#ff6b24]">0{index + 1}</span><span className="truncate font-serif text-sm">{title}</span><ArrowUpRight size={13} className="text-[#ff6b24]"/></div>)}
  </div>;

  return <div className="flex h-40 items-center justify-center text-gray-400"><LayoutTemplate size={38} aria-label="Template layout"/></div>;
};
