import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertCircle, Check, Loader2, Plus, RotateCcw, Save } from "lucide-react";
import supabase from "@/Superbase/client";
import type { SettingsType } from "@/StateManagement/Redux/@types";
import type { AppDispatch } from "@/StateManagement/Redux/reduxStore";
import { upsertSettingData } from "@/StateManagement/Redux/slices/settings";
import {
  parseHeadingManifest,
  type HomepageHeadingManifest,
  type HomepageSectionConfiguration,
  type SectionHeading,
} from "@/features/homepageSections/manifest";
import { validBinding, type TemplateDefinition } from "@/features/homepageSections/templates";
import { NewSectionDialog } from "./NewSectionDialog";

const columns = "setting_id,setting_name,setting_object,schema_version,created_at,updated_at";
const inputClass = "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-600 dark:bg-gray-900";

export const HeadingsEditor = ({ onUnsavedChange }: { onUnsavedChange: (unsaved: boolean) => void }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [saved, setSaved] = useState<SettingsType<HomepageHeadingManifest> | null>(null);
  const [draft, setDraft] = useState<HomepageHeadingManifest>({});
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [newSectionDirty, setNewSectionDirty] = useState(false);
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [{ data, error: failure }, templateResult] = await Promise.all([
      supabase.from("settings").select(columns).eq("setting_name", "headings").single(),
      supabase.from("section_templates").select("template_key,display_name,description,layout_key,layout_definition,slots,is_builtin,is_published"),
    ]);
    if (templateResult.error) { setError(templateResult.error.message); setLoading(false); return false; }
    setTemplates((templateResult.data || []) as TemplateDefinition[]);
    if (failure || !data) {
      setError(failure?.message || "The headings setting could not be found.");
      setLoading(false);
      return false;
    }
    if (data.schema_version !== 2) {
      setError("Headings must be migrated to schema version 2 before editing.");
      setLoading(false);
      return false;
    }
    const parsed = parseHeadingManifest(data.setting_object);
    if (parsed.errors.length) {
      setError("Stored headings are invalid. Please review the schema before editing them here.");
      setLoading(false);
      return false;
    }
    const next = data as SettingsType<HomepageHeadingManifest>;
    setSaved(next);
    setDraft(structuredClone(parsed.manifest));
    setSelected((previous) => previous in parsed.manifest ? previous : parsed.sections[0]?.section_key || "");
    dispatch(upsertSettingData(next));
    setLoading(false);
    return true;
  }, [dispatch]);

  useEffect(() => { void load(); }, [load]);
  const changed = !!saved && JSON.stringify(draft) !== JSON.stringify(saved.setting_object);
  const hasUnsavedWork = changed || newSectionDirty;
  useEffect(() => { onUnsavedChange(hasUnsavedWork); return () => onUnsavedChange(false); }, [hasUnsavedWork, onUnsavedChange]);
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedWork]);
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const warn = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) return;
      if (window.confirm("Discard unsaved heading changes?")) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("click", warn, true);
    return () => document.removeEventListener("click", warn, true);
  }, [hasUnsavedWork]);

  const ordered = useMemo(() => Object.values(draft).sort((a, b) => a.order - b.order), [draft]);
  const section = draft[selected];
  const validation = useMemo(() => {
    const errors = parseHeadingManifest(draft).errors.map((item) => `${item.section_key}: ${item.message}`);
    if (ordered.some((item) => [item.heading.index, item.heading.eyebrow, item.heading.title].some((value) => /<[^>]*>/.test(value)))) {
      errors.push("Headings must be plain text without HTML.");
    }
    for (const item of ordered) {
      if (!item.enabled) continue;
      const template = templates.find(t => t.template_key === item.template_key && t.is_published);
      if (!template) { errors.push(`${item.section_key}: choose an available template.`); continue; }
      const fields = item.data_schema.fields.map(field => field.key);
      if (template.slots.some(slot => slot.required && !validBinding(item.field_bindings?.[slot.key], fields))) {
        errors.push(`${item.section_key}: bind all required template slots to table fields.`);
      }
    }
    return errors;
  }, [draft, ordered, templates]);

  const patch = (change: Partial<HomepageSectionConfiguration>) => {
    setDraft((current) => ({ ...current, [selected]: { ...current[selected], ...change } }));
    setNotice("");
  };
  const editHeading = (key: keyof SectionHeading, value: string) => {
    if (!section) return;
    patch({ heading: { ...section.heading, [key]: value } });
  };
  const resetOne = () => {
    if (!saved || !section) return;
    setDraft((current) => ({ ...current, [selected]: structuredClone(saved.setting_object[selected]) }));
    setError("");
  };

  const save = async () => {
    if (!saved || !changed || validation.length || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: failure } = await supabase.from("settings")
      .update({ setting_object: draft, updated_at: new Date().toISOString() })
      .eq("setting_id", saved.setting_id).eq("schema_version", 2)
      .eq("updated_at", saved.updated_at).select(columns).maybeSingle();
    if (failure) setError(failure.message);
    else if (!data) setError("Someone changed the headings since you opened this page. Reload to review the latest version.");
    else {
      const next = data as SettingsType<HomepageHeadingManifest>;
      setSaved(next);
      setDraft(structuredClone(next.setting_object));
      dispatch(upsertSettingData(next));
      setNotice("Heading changes saved.");
    }
    setBusy(false);
  };

  return <section aria-labelledby="headings-title" className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 id="headings-title" className="text-xl font-semibold">Homepage headings</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Edit a section’s heading or define a new inactive section and its table fields.</p></div>
      <div className="text-right"><button type="button" disabled={loading || !saved || busy || changed} onClick={() => setCreating(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Plus size={17}/>New section</button>
        {changed && <p className="mt-1 text-xs text-gray-500">Save your edits first.</p>}</div>
    </div>

    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertCircle size={18} className="shrink-0"/>
      <span>{error}{!changed && saved && <button type="button" onClick={() => void load()} className="ml-2 underline">Reload</button>}</span></div>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><Check size={17}/>{notice}</p>}

    {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-24 text-gray-500 dark:border-gray-700 dark:bg-gray-800"><Loader2 size={20} className="animate-spin"/>Loading headings…</div>
      : !saved ? <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"><button type="button" onClick={() => void load()} className="rounded-lg bg-primary px-4 py-2 text-sm text-white">Try again</button></div>
      : <>
        <div className="grid gap-5 xl:grid-cols-[215px_minmax(0,1fr)]">
          <div className="flex gap-2 overflow-x-auto xl:flex-col" aria-label="Homepage sections">
            {ordered.map((item) => <button type="button" key={item.section_key} onClick={() => setSelected(item.section_key)}
              aria-current={selected === item.section_key ? "true" : undefined}
              className={`flex min-w-36 shrink-0 items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left text-sm xl:w-full ${selected === item.section_key ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"}`}>
              <span className="truncate capitalize">{item.section_key.replaceAll("_", " ")}</span><span className={`size-2 shrink-0 rounded-full ${item.enabled ? "bg-emerald-500" : "bg-gray-400"}`}/>
            </button>)}
          </div>
          {section && <div className="space-y-5">
            <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
                <div><h3 className="text-lg font-semibold capitalize">{section.section_key.replaceAll("_", " ")}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Section key: {section.section_key} · Table: {section.table_name}</p></div>
                <button type="button" disabled={!saved.setting_object[selected] || JSON.stringify(section) === JSON.stringify(saved.setting_object[selected])}
                  onClick={resetOne} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:opacity-40 dark:border-gray-600"><RotateCcw size={14}/>Reset section</button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[100px_minmax(0,1fr)]">
                <label className="text-sm font-medium">Index<input className={inputClass} maxLength={3} value={section.heading.index} onChange={(event) => editHeading("index", event.target.value)}/><span className="mt-1 block text-right text-xs text-gray-400">{section.heading.index.length}/3</span></label>
                <label className="text-sm font-medium">Eyebrow<input className={inputClass} maxLength={40} value={section.heading.eyebrow} onChange={(event) => editHeading("eyebrow", event.target.value)}/><span className="mt-1 block text-right text-xs text-gray-400">{section.heading.eyebrow.length}/40</span></label>
              </div>
              <label className="mt-3 block text-sm font-medium">Title<input className={inputClass} maxLength={160} value={section.heading.title} onChange={(event) => editHeading("title", event.target.value)}/><span className="mt-1 block text-right text-xs text-gray-400">{section.heading.title.length}/160</span></label>
              <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 dark:border-gray-700 sm:grid-cols-2 sm:items-end">
                <label className="text-sm font-medium">Display order<input type="number" min={1} step={1} className={inputClass} value={section.order} onChange={(event) => patch({ order: Number(event.target.value) })}/></label>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-700">
                  <input type="checkbox" checked={section.enabled} disabled={!section.template_key || !templates.some(t => t.template_key === section.template_key && t.is_published)} onChange={(event) => patch({ enabled: event.target.checked })}/>
                  <span><strong className="block font-medium">Show on homepage</strong><small className="text-gray-500 dark:text-gray-400">{section.template_key ? "Toggle this section’s visibility." : "A template must be assigned first."}</small></span>
                </label>
              </div>
              <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-700">
                <label className="text-sm font-medium">Reusable template<select className={inputClass} value={section.template_key ?? ""} onChange={e => patch({ template_key: e.target.value || null, enabled: false, field_bindings: {} })}>
                  <option value="">Select a template</option>{templates.filter(t => t.is_published).map(t => <option key={t.template_key} value={t.template_key}>{t.display_name}</option>)}</select></label>
                {templates.find(t => t.template_key === section.template_key) && <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {templates.find(t => t.template_key === section.template_key)!.slots.map(slot => {
                    const binding = section.field_bindings?.[slot.key];
                    const field = typeof binding === "string" ? binding : binding?.field || "";
                    const compatible = section.data_schema.fields.filter(item => slot.type === "list" ? item.type === "string_array" :
                      slot.type === "date" ? ["date","datetime"].includes(item.type) :
                      slot.type === "image" ? ["image","url","string"].includes(item.type) :
                      slot.type === "link" ? ["url","string","integer","uuid"].includes(item.type) :
                      ["string","text","integer","number"].includes(item.type));
                    return <label key={slot.key} className="text-sm capitalize">{slot.key.replaceAll("_", " ")}{slot.required ? " *" : ""}
                      <select className={inputClass} value={field} onChange={e => {
                        const next = { ...section.field_bindings };
                        if (e.target.value) next[slot.key] = typeof binding === "object" ? { ...binding, field: e.target.value } : e.target.value;
                        else delete next[slot.key];
                        patch({ field_bindings: next, enabled: false });
                      }}><option value="">No field</option>{compatible.map(item => <option key={item.key} value={item.key}>{item.label} ({item.key})</option>)}</select>
                    </label>;
                  })}
                </div>}
                <p className="mt-3 text-xs text-gray-500">Source table: {section.table_name} · {section.data_schema.fields.length} data fields. Publish content in Sections before enabling it.</p>
              </div>
            </article>
            <div className="rounded-2xl border border-gray-700 bg-[#0b0b0b] p-5 text-white sm:p-7">
              <p className="mb-4 text-xs uppercase tracking-widest text-gray-400">Live heading preview</p>
              <span className="font-mono text-xs text-[#ff6b24]">{section.heading.index || "—"}</span>
              <p className="mt-2 font-mono text-xs tracking-[0.25em] text-gray-300">{section.heading.eyebrow || "EYEBROW"}</p>
              <p className="mt-3 max-w-lg text-3xl font-semibold leading-tight sm:text-4xl" style={{ fontFamily: '"Playfair Display", serif' }}>{section.heading.title || "Your section title"}</p>
            </div>
          </div>}
        </div>
        {validation.length > 0 && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">{validation[0]}</p>}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
          <p className="text-sm text-gray-500 dark:text-gray-400">{changed ? "You have unsaved heading changes." : "All heading changes saved."}</p>
          <div className="flex gap-2"><button type="button" disabled={!changed || busy} onClick={() => { setDraft(structuredClone(saved.setting_object)); setError(""); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-gray-600">Discard changes</button>
            <button type="button" disabled={!changed || validation.length > 0 || busy} onClick={() => void save()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{busy ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}Save changes</button></div>
        </div>
      </>}
    {creating && <NewSectionDialog open onOpenChange={setCreating} existingKeys={Object.keys(draft)} blockedByEdits={changed}
      onDirtyChange={setNewSectionDirty} onCreated={async (key) => {
        const loaded = await load();
        if (loaded) { setSelected(key); setNotice(`“${key}” has been created. It remains inactive until a template is assigned.`); }
      }}/>}</section>;
};
