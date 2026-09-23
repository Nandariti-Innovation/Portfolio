import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";
import supabase from "@/Superbase/client";
import { parseHeadingManifest, type HomepageSectionConfiguration, type SectionDataField } from "@/features/homepageSections/manifest";

type Row = Record<string, unknown>;
const builtin = new Set(["project", "experience", "blog"]);
const input = "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900";

export default function SectionsDashboard() {
  const { sectionKey } = useParams();
  const { collapsed } = useContext(settingContext);
  const [sections, setSections] = useState<HomepageSectionConfiguration[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const section = sections.find(s => s.section_key === sectionKey && s.table_name === sectionKey);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(""); setDraft(null);
      const result = await supabase.from("settings").select("setting_object,schema_version").eq("setting_name", "headings").single();
      if (cancelled) return;
      if (result.error || result.data?.schema_version !== 2) {
        setError(result.error?.message || "Headings schema version 2 is required."); setLoading(false); return;
      }
      const parsed = parseHeadingManifest(result.data.setting_object);
      if (parsed.errors.length) setError("The headings configuration is invalid.");
      setSections(parsed.sections.filter(s => !builtin.has(s.section_key) && s.table_name === s.section_key));
      setLoading(false);
    };
    void load(); return () => { cancelled = true; };
  }, []);

  const loadRows = useCallback(async () => {
    if (!section) return;
    const result = await supabase.from(section.table_name).select("*").order("display_order").limit(100);
    if (result.error) setError(result.error.message);
    else { setRows((result.data || []) as Row[]); setError(""); }
  }, [section]);

  useEffect(() => { void loadRows(); }, [loadRows]);

  const save = async () => {
    if (!draft || !section) return;
    const fields = section.data_schema.fields.filter(f => f.editable !== false && !f.generated);
    if (fields.some(f => f.required && (draft[f.key] === null || draft[f.key] === undefined || draft[f.key] === ""))) {
      setError("Fill in all required fields."); return;
    }
    const record = Object.fromEntries(fields.map(field => [field.key, draft[field.key] ?? null]));
    const payload = { ...record, display_order: Number(draft.display_order) || 0, is_visible: draft.is_visible === true,
      updated_at: new Date().toISOString() };
    setBusy(true); setError(""); setNotice("");
    const result = draft.id ? await supabase.from(section.table_name).update(payload).eq("id", draft.id).select("id").single() :
      await supabase.from(section.table_name).insert(payload).select("id").single();
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    setDraft(null); setNotice("Section content saved."); await loadRows();
  };

  const remove = async (id: unknown) => {
    if (!section || !window.confirm("Delete this content record?")) return;
    setBusy(true); const result = await supabase.from(section.table_name).delete().eq("id", id);
    setBusy(false);
    if (result.error) setError(result.error.message);
    else { setDraft(null); setNotice("Record deleted."); await loadRows(); }
  };

  return <main className={`h-full min-w-0 overflow-y-auto bg-background p-5 text-gray-900 dark:bg-darkthemebg dark:text-white ${collapsed ? "w-[calc(100vw-70px)]" : "w-[calc(100vw-240px)]"}`}>
    <div className="mx-auto max-w-5xl space-y-5">
      <header><h1 className="text-2xl font-bold">Homepage sections</h1><p className="text-sm text-gray-500">Manage the content tables created in Settings → Headings.</p></header>
      {loading ? <p role="status" className="flex gap-2"><Loader2 className="animate-spin"/>Loading sections…</p> :
        <div className="flex flex-wrap gap-2">{sections.map(s => <Link key={s.section_key} to={`/dashboard/sections/${s.section_key}`}
          className={`rounded-lg border px-3 py-2 text-sm ${sectionKey === s.section_key ? "border-primary text-primary" : "border-gray-300"}`}>
          {s.section_key.replaceAll("_", " ")}{s.enabled ? " · Live" : " · Draft"}</Link>)}</div>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      {!section && !loading && <p className="rounded-xl border p-6 text-sm">Choose a created section, or create one in <Link className="text-primary underline" to="/dashboard/settings/headings">Settings</Link>.</p>}
      {section && <>
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold capitalize">{section.section_key.replaceAll("_", " ")}</h2>
          <button type="button" onClick={() => setDraft({ display_order: rows.length, is_visible: false })} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white"><Plus size={16}/>Add record</button></div>
        <p className="text-sm text-gray-500">Publish individual records here, then assign a template and enable this section in Settings. Only visible records appear on the homepage.</p>
        <div className="grid gap-3">{rows.map(row => <article key={String(row.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 dark:bg-gray-800">
          <div><strong>{String(row[section.data_schema.fields.find(f => f.type === "string")?.key || "id"] ?? row.id)}</strong><p className="text-xs text-gray-500">Order {String(row.display_order)} · {row.is_visible ? "Visible" : "Hidden"}</p></div>
          <div className="flex gap-2"><button type="button" onClick={() => setDraft({ ...row })} className="rounded-lg border px-3 py-2 text-sm">Edit</button>
            <button type="button" disabled={busy} aria-label={`Delete record ${String(row.id)}`} onClick={() => void remove(row.id)} className="rounded-lg border border-red-300 px-3 py-2 text-red-600"><Trash2 size={16}/></button></div>
        </article>)}</div>
        {draft && <section className="space-y-4 rounded-xl border bg-white p-5 dark:bg-gray-800"><h3 className="text-lg font-semibold">{draft.id ? "Edit record" : "New record"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">{section.data_schema.fields.filter(f => f.editable !== false && !f.generated && !["id","display_order","is_visible","created_at","updated_at"].includes(f.key)).map(f =>
            <FieldEditor key={f.key} field={f} value={draft[f.key]} onChange={value => setDraft(current => ({ ...current, [f.key]: value }))}/>)}
            <label className="text-sm">Display order<input className={input} type="number" min={0} value={String(draft.display_order ?? 0)} onChange={e => setDraft(current => ({ ...current, display_order: Number(e.target.value) }))}/></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_visible === true} onChange={e => setDraft(current => ({ ...current, is_visible: e.target.checked }))}/>Visible after section is enabled</label>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setDraft(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm text-white">{busy ? "Saving…" : "Save record"}</button></div>
        </section>}
      </>}
    </div>
  </main>;
}

function FieldEditor({ field, value, onChange }: { field: SectionDataField; value: unknown; onChange: (value: unknown) => void }) {
  const label = <span>{field.label}{field.required ? " *" : ""}</span>;
  if (field.type === "boolean") return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value === true} onChange={e => onChange(e.target.checked)}/>{label}</label>;
  if (field.type === "text" || field.type === "rich_text" || field.type === "string_array")
    return <label className="text-sm sm:col-span-2">{label}<textarea className={input} rows={3} value={field.type === "string_array" ? Array.isArray(value) ? value.join("\n") : "" : String(value ?? "")}
      onChange={e => onChange(field.type === "string_array" ? e.target.value.split("\n").map(s => s.trim()).filter(Boolean) : e.target.value)}/>
      {field.type === "string_array" && <small className="text-gray-500">One value per line</small>}</label>;
  const type = field.type === "integer" || field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : field.type === "url" ? "url" : "text";
  return <label className="text-sm">{label}<input className={input} type={type} step={field.type === "number" ? "any" : undefined} value={String(value ?? "")}
    onChange={e => onChange(type === "number" ? e.target.value === "" ? null : Number(e.target.value) : e.target.value)}/></label>;
}
