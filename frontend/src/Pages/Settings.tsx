import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Save, RotateCcw, Trash2 } from "lucide-react";
import supabase from "@/Superbase/client";
import { setSettingData } from "@/StateManagement/Redux/slices/settings";
import type { AppDispatch, RootState } from "@/StateManagement/Redux/reduxStore";
import type { SettingsType } from "@/StateManagement/Redux/@types";
import {
  parseHeadingManifest,
  type HomepageHeadingManifest,
  type HomepageSectionConfiguration,
  type SectionFieldType,
} from "@/features/homepageSections/manifest";

const control = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800";
const keyPattern = /^[a-z][a-z0-9_]{0,39}$/;
const reservedSectionKeys = new Set(["about", "footer", "hero", "settings", "users", "profiles"]);
const reservedFieldKeys = new Set(["id", "display_order", "is_visible", "created_at", "updated_at"]);
const fieldTypes: SectionFieldType[] = ["string", "text", "integer", "number", "boolean", "url", "date", "datetime", "image", "string_array"];
type FieldDraft = { key: string; label: string; type: SectionFieldType; required: boolean };
const emptyField = (): FieldDraft => ({ key: "", label: "", type: "string", required: false });

export const Settings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings.setting);
  const [row, setRow] = useState<SettingsType<HomepageHeadingManifest> | null>(null);
  const [draft, setDraft] = useState<HomepageHeadingManifest>({});
  const [tab, setTab] = useState<"headings" | "templates">("headings");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [sectionKey, setSectionKey] = useState("");
  const [newHeading, setNewHeading] = useState({ index: "", eyebrow: "", title: "" });
  const [fields, setFields] = useState<FieldDraft[]>([emptyField()]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await supabase.from("settings")
      .select("setting_id,setting_name,setting_object,schema_version,created_at,updated_at")
      .eq("setting_name", "headings").single();
    if (result.error) {
      setError(result.error.message);
      setRow(null);
    } else if (result.data.schema_version !== 2) {
      setError("The headings settings must be migrated to schema version 2 before editing.");
      setRow(null);
    } else {
      const parsed = parseHeadingManifest(result.data.setting_object);
      if (parsed.errors.length) {
        setError(`Invalid headings data: ${parsed.errors[0].section_key}.${parsed.errors[0].field} ${parsed.errors[0].message}`);
        setRow(null);
      } else {
        const next = result.data as SettingsType<HomepageHeadingManifest>;
        setRow(next);
        setDraft(structuredClone(parsed.manifest));
        dispatch(setSettingData([...settings.filter((s) => s.setting_name !== "headings"), next]));
        setLoading(false);
        return true;
      }
    }
    setLoading(false);
    return false;
  // Read the panel once; subsequent Redux updates should not refetch the form.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => { void load(); }, [load]);
  const changed = !!row && JSON.stringify(draft) !== JSON.stringify(row.setting_object);
  useEffect(() => {
    if (!changed) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed]);
  useEffect(() => {
    if (!changed) return;
    const warnOnNavigation = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (!link || !(link instanceof HTMLAnchorElement)) return;
      const destination = new URL(link.href);
      if (destination.origin !== window.location.origin || destination.pathname !== window.location.pathname) {
        if (!window.confirm("Discard unsaved heading changes?")) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };
    document.addEventListener("click", warnOnNavigation, true);
    return () => document.removeEventListener("click", warnOnNavigation, true);
  }, [changed]);

  const ordered = useMemo(() => Object.values(draft).sort((a, b) => a.order - b.order), [draft]);
  const updateSection = (key: string, change: Partial<HomepageSectionConfiguration>) => {
    setDraft((current) => ({ ...current, [key]: { ...current[key], ...change } }));
    setNotice("");
  };
  const save = async () => {
    if (!row || !changed || busy) return;
    const parsed = parseHeadingManifest(draft);
    if (parsed.errors.length) {
      const first = parsed.errors[0];
      setError(`${first.section_key}.${first.field}: ${first.message}`);
      return;
    }
    setBusy(true);
    setError("");
    const result = await supabase.from("settings")
      .update({ setting_object: draft, updated_at: new Date().toISOString() })
      .eq("setting_id", row.setting_id).eq("schema_version", 2)
      .eq("updated_at", row.updated_at)
      .select("setting_id,setting_name,setting_object,schema_version,created_at,updated_at")
      .maybeSingle();
    if (result.error) setError(result.error.message);
    else if (!result.data) setError("These headings changed elsewhere. Reload this page to review them before saving.");
    else {
      const next = result.data as SettingsType<HomepageHeadingManifest>;
      setRow(next);
      setDraft(structuredClone(next.setting_object));
      dispatch(setSettingData([...settings.filter((s) => s.setting_name !== "headings"), next]));
      setNotice("Headings saved.");
    }
    setBusy(false);
  };

  const create = async () => {
    if (busy || !row) return;
    const key = sectionKey.trim();
    const heading = { index: newHeading.index.trim(), eyebrow: newHeading.eyebrow.trim(), title: newHeading.title.trim() };
    if (!keyPattern.test(key) || reservedSectionKeys.has(key) || draft[key]) {
      setError("Choose a unique lowercase section key (letters, numbers and underscores, up to 40 characters)."); return;
    }
    if (!heading.index || heading.index.length > 3 || !heading.eyebrow || heading.eyebrow.length > 40 || !heading.title || heading.title.length > 160) {
      setError("Provide an index (up to 3 characters), eyebrow (up to 40), and title (up to 160)."); return;
    }
    if (!fields.length || fields.length > 20 || fields.some((f) => !keyPattern.test(f.key.trim()) || reservedFieldKeys.has(f.key.trim()) || !f.label.trim() || f.label.length > 80) || new Set(fields.map((f) => f.key.trim())).size !== fields.length) {
      setError("Add 1–20 data fields with unique lowercase keys and labels (up to 80 characters)."); return;
    }
    if (changed) { setError("Save or reset existing heading edits before creating a section."); return; }
    setBusy(true); setError(""); setNotice("");
    const result = await supabase.rpc("create_homepage_section", {
      p_section_key: key,
      p_heading: heading,
      p_fields: fields.map((f) => ({ ...f, key: f.key.trim(), label: f.label.trim() })),
    });
    if (result.error) setError(result.error.message);
    else {
      setShowNew(false); setSectionKey(""); setNewHeading({ index: "", eyebrow: "", title: "" }); setFields([emptyField()]);
      if (await load()) setNotice(`Section “${key}” created with its own table. It is inactive until a template is assigned.`);
    }
    setBusy(false);
  };

  return <main className="h-full min-w-0 flex-1 overflow-y-auto bg-background p-4 text-gray-900 dark:text-gray-100 sm:p-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <header><h1 className="text-3xl font-semibold">Settings</h1><p className="mt-1 text-sm text-gray-500">Manage your homepage sections.</p></header>
      <nav aria-label="Settings sections" className="flex gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
        <button type="button" aria-current={tab === "headings" ? "page" : undefined} onClick={() => setTab("headings")} className={`rounded-lg px-4 py-2 text-sm ${tab === "headings" ? "bg-primary text-white" : "bg-white dark:bg-gray-800"}`}>Headings</button>
        <button type="button" aria-current={tab === "templates" ? "page" : undefined} onClick={() => setTab("templates")} className={`rounded-lg px-4 py-2 text-sm ${tab === "templates" ? "bg-primary text-white" : "bg-white dark:bg-gray-800"}`}>Templates</button>
      </nav>
      {tab === "templates" ? <section className={card}><h2 className="font-semibold">Templates</h2><p className="mt-2 text-sm text-gray-500">Template creation and assignment will be added here. Newly created sections remain inactive until a template is assigned.</p></section> : <>
        {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">{notice}</p>}
        {loading ? <p>Loading headings…</p> : !row ? <button type="button" onClick={() => void load()} className="rounded-lg bg-primary px-4 py-2 text-white">Retry</button> : <>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-gray-500">{changed ? "Unsaved changes" : "All changes saved"}</p><div className="flex gap-2"><button type="button" disabled={!changed || busy} onClick={() => { setDraft(structuredClone(row.setting_object)); setError(""); }} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"><RotateCcw size={16}/>Reset</button><button type="button" disabled={!changed || busy} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"><Save size={16}/>Save changes</button></div></div>
          <div className="space-y-4">{ordered.map((section) => <article key={section.section_key} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold capitalize">{section.section_key.replaceAll("_", " ")}</h2><p className="text-xs text-gray-500">Table: {section.table_name} · Template: {section.template_key ?? "Not assigned"}</p></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={section.enabled} disabled={!section.template_key} onChange={(e) => updateSection(section.section_key, { enabled: e.target.checked })}/>Active</label></div>
            {!section.template_key && <p className="mt-3 text-sm text-amber-600">Assign a template before this section can be activated.</p>}
            <div className="mt-4 grid gap-3 sm:grid-cols-[90px_1fr_1fr]"><label className="text-sm">Index<input className={`${control} mt-1`} maxLength={3} value={section.heading.index} onChange={(e) => updateSection(section.section_key, { heading: { ...section.heading, index: e.target.value } })}/></label><label className="text-sm">Eyebrow<input className={`${control} mt-1`} maxLength={40} value={section.heading.eyebrow} onChange={(e) => updateSection(section.section_key, { heading: { ...section.heading, eyebrow: e.target.value } })}/></label><label className="text-sm">Order<input className={`${control} mt-1`} type="number" min={1} value={section.order} onChange={(e) => updateSection(section.section_key, { order: Number(e.target.value) })}/></label></div>
            <label className="mt-3 block text-sm">Title<input className={`${control} mt-1`} maxLength={160} value={section.heading.title} onChange={(e) => updateSection(section.section_key, { heading: { ...section.heading, title: e.target.value } })}/></label>
            <div className="mt-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-900"><span className="text-xs uppercase tracking-widest text-primary">{section.heading.index} / {section.heading.eyebrow}</span><p className="mt-1 text-lg font-semibold">{section.heading.title}</p></div>
          </article>)}</div>
          <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">New section</h2><p className="text-sm text-gray-500">Define its data fields to create a dedicated Supabase table. The section starts inactive.</p></div><button type="button" onClick={() => setShowNew(!showNew)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white"><Plus size={16}/>{showNew ? "Close" : "Add section"}</button></div>
          {showNew && <div className="mt-5 space-y-4"><label className="block text-sm">Section key and table name<input className={`${control} mt-1`} value={sectionKey} onChange={(e) => setSectionKey(e.target.value)} placeholder="awards"/><small>Lowercase letters, numbers and underscores. The table uses the same name.</small></label>
            <div className="grid gap-3 sm:grid-cols-3">{(["index", "eyebrow", "title"] as const).map((part) => <label key={part} className="text-sm capitalize">{part}<input className={`${control} mt-1`} maxLength={part === "index" ? 3 : part === "eyebrow" ? 40 : 160} value={newHeading[part]} onChange={(e) => setNewHeading((previous) => ({ ...previous, [part]: e.target.value }))}/></label>)}</div>
            <h3 className="font-medium">Data fields</h3>{fields.map((field, index) => <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end"><label className="text-sm">Column key<input className={`${control} mt-1`} value={field.key} onChange={(e) => setFields((previous) => previous.map((f, i) => i === index ? { ...f, key: e.target.value } : f))}/></label><label className="text-sm">Label<input className={`${control} mt-1`} value={field.label} onChange={(e) => setFields((previous) => previous.map((f, i) => i === index ? { ...f, label: e.target.value } : f))}/></label><label className="text-sm">Type<select className={`${control} mt-1`} value={field.type} onChange={(e) => setFields((previous) => previous.map((f, i) => i === index ? { ...f, type: e.target.value as SectionFieldType } : f))}>{fieldTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={field.required} onChange={(e) => setFields((previous) => previous.map((f, i) => i === index ? { ...f, required: e.target.checked } : f))}/>Required</label><button type="button" aria-label={`Remove field ${index + 1}`} disabled={fields.length === 1} onClick={() => setFields((previous) => previous.filter((_, i) => i !== index))} className="pb-2 text-red-500 disabled:opacity-30"><Trash2 size={17}/></button></div>)}
            <div className="flex gap-3"><button type="button" disabled={fields.length >= 20} onClick={() => setFields((previous) => [...previous, emptyField()])} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Add data field</button><button type="button" disabled={busy || changed} onClick={() => void create()} className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50">Create inactive section and table</button></div>
          </div>}</section>
        </>}
      </>}
    </div>
  </main>;
};
