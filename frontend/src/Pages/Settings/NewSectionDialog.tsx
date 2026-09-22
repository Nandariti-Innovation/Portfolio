import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import supabase from "@/Superbase/client";
import type { SectionFieldType, SectionHeading } from "@/features/homepageSections/manifest";

type FieldDraft = { key: string; label: string; type: SectionFieldType; required: boolean };
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCreated: (key: string) => Promise<void>;
  existingKeys: string[];
  blockedByEdits: boolean;
};

const identifier = /^[a-z][a-z0-9_]{0,39}$/;
const reservedSections = new Set(["about", "footer", "hero", "settings", "users", "profiles"]);
const reservedColumns = new Set(["id", "display_order", "is_visible", "created_at", "updated_at"]);
const types: { value: SectionFieldType; label: string }[] = [
  { value: "string", label: "Short text" }, { value: "text", label: "Long text" },
  { value: "integer", label: "Whole number" }, { value: "number", label: "Decimal number" },
  { value: "boolean", label: "Yes / no" }, { value: "url", label: "URL" },
  { value: "date", label: "Date" }, { value: "datetime", label: "Date and time" },
  { value: "image", label: "Image URL" }, { value: "string_array", label: "List of text" },
];
const input = "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-600 dark:bg-gray-900";
const emptyField = (): FieldDraft => ({ key: "", label: "", type: "string", required: false });

export const NewSectionDialog = ({ open, onOpenChange, onDirtyChange, onCreated, existingKeys, blockedByEdits }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [key, setKey] = useState("");
  const [heading, setHeading] = useState<SectionHeading>({ index: "", eyebrow: "", title: "" });
  const [fields, setFields] = useState<FieldDraft[]>([emptyField()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = !!key || Object.values(heading).some(Boolean) || fields.some((field) => !!field.key || !!field.label || field.required || field.type !== "string");

  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);

  const close = () => {
    if (busy) return;
    if (dirty && !window.confirm("Discard this new section draft?")) return;
    onDirtyChange(false);
    onOpenChange(false);
  };
  const updateField = (index: number, patch: Partial<FieldDraft>) => {
    setFields((current) => current.map((field, position) => position === index ? { ...field, ...patch } : field));
    setError("");
  };
  const validateHeading = () => {
    if (!identifier.test(key.trim()) || reservedSections.has(key.trim()) || existingKeys.includes(key.trim())) return "Choose a unique lowercase section key, up to 40 characters. It will also name the table.";
    const values = Object.values(heading).map((part) => part.trim());
    if (!values[0] || values[0].length > 3 || !values[1] || values[1].length > 40 || !values[2] || values[2].length > 160) return "Enter an index (1–3 characters), eyebrow (1–40), and title (1–160).";
    if (values.some((value) => /<[^>]*>/.test(value))) return "Headings must be plain text without HTML.";
    return "";
  };
  const validateFields = () => {
    if (!fields.length || fields.length > 20) return "Add between 1 and 20 data fields.";
    if (fields.some((field) => !identifier.test(field.key.trim()) || reservedColumns.has(field.key.trim()) || !field.label.trim() || field.label.trim().length > 80)) return "Every field needs a unique lowercase column key and a label of up to 80 characters. System columns are reserved.";
    if (new Set(fields.map((field) => field.key.trim())).size !== fields.length) return "Each column key must be unique.";
    return "";
  };
  const next = () => {
    const failure = step === 1 ? validateHeading() : validateFields();
    if (failure) { setError(failure); return; }
    setError("");
    setStep(step === 1 ? 2 : 3);
  };
  const create = async () => {
    const failure = validateHeading() || validateFields();
    if (failure || blockedByEdits) { setError(failure || "Save or discard your existing heading edits first."); return; }
    setBusy(true);
    setError("");
    const { error: resultError } = await supabase.rpc("create_homepage_section", {
      p_section_key: key.trim(),
      p_heading: Object.fromEntries(Object.entries(heading).map(([name, value]) => [name, value.trim()])),
      p_fields: fields.map((field) => ({ ...field, key: field.key.trim(), label: field.label.trim() })),
    });
    if (resultError) {
      setError(resultError.code === "42501" ? "Your account cannot create sections. Sign out and back in to refresh your portfolio-owner session." : resultError.message);
    } else {
      onDirtyChange(false);
      onOpenChange(false);
      await onCreated(key.trim());
    }
    setBusy(false);
  };

  return <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/70"/>
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] flex max-h-[calc(100dvh-2rem)] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <div><Dialog.Title className="text-xl font-semibold">Create a homepage section</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a heading, define its table fields, then review. It will start inactive.</Dialog.Description></div>
          <button type="button" onClick={close} aria-label="Close" disabled={busy} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={19}/></button>
        </div>
        <div className="flex gap-2 px-5 pt-4 sm:px-6" aria-label={`Step ${step} of 3`}>
          {([1, 2, 3] as const).map((number) => <span key={number} className={`h-1.5 flex-1 rounded-full ${number <= step ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}/>)}
        </div>
        <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6">
          {step === 1 && <div className="space-y-4"><div><h3 className="font-semibold">1. Section identity and heading</h3><p className="mt-1 text-sm text-gray-500">Choose a permanent key and the text shown on the homepage.</p></div>
            <label className="block text-sm font-medium">Section key and table name<input className={input} autoFocus placeholder="awards" maxLength={40} value={key} onChange={(event) => { setKey(event.target.value); setError(""); }}/><span className="mt-1 block text-xs font-normal text-gray-500">Lowercase letters, numbers and underscores. Cannot be changed after creation.</span></label>
            <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
              <label className="block text-sm font-medium">Index<input className={input} maxLength={3} value={heading.index} onChange={(event) => { setHeading({ ...heading, index: event.target.value }); setError(""); }}/></label>
              <label className="block text-sm font-medium">Eyebrow<input className={input} maxLength={40} value={heading.eyebrow} onChange={(event) => { setHeading({ ...heading, eyebrow: event.target.value }); setError(""); }}/></label>
            </div>
            <label className="block text-sm font-medium">Title<input className={input} maxLength={160} value={heading.title} onChange={(event) => { setHeading({ ...heading, title: event.target.value }); setError(""); }}/></label>
          </div>}
          {step === 2 && <div className="space-y-4"><div><h3 className="font-semibold">2. Define the data fields</h3><p className="mt-1 text-sm text-gray-500">Each field becomes a column in the new table. ID, visibility, order and timestamps are added automatically.</p></div>
            {fields.map((field, index) => <div key={index} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex justify-between"><h4 className="text-sm font-semibold">Field {index + 1}</h4><button type="button" disabled={fields.length === 1} onClick={() => setFields((current) => current.filter((_, position) => position !== index))} aria-label={`Remove field ${index + 1}`} className="text-red-600 disabled:opacity-40"><Trash2 size={17}/></button></div>
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Column key<input className={input} placeholder="name" maxLength={40} value={field.key} onChange={(event) => updateField(index, { key: event.target.value })}/></label>
                <label className="text-sm">Dashboard label<input className={input} placeholder="Name" maxLength={80} value={field.label} onChange={(event) => updateField(index, { label: event.target.value })}/></label></div>
              <div className="mt-3 flex flex-wrap items-end gap-4"><label className="min-w-44 flex-1 text-sm">Field type<select className={input} value={field.type} onChange={(event) => updateField(index, { type: event.target.value as SectionFieldType })}>{types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
                <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })}/>Required for each row</label></div>
            </div>)}
            <button type="button" disabled={fields.length >= 20} onClick={() => setFields((current) => [...current, emptyField()])} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-gray-600"><Plus size={16}/>Add a field</button>
          </div>}
          {step === 3 && <div className="space-y-4"><div><h3 className="font-semibold">3. Review your section</h3><p className="mt-1 text-sm text-gray-500">Creating it adds a real database table. The homepage section stays inactive until a template is assigned.</p></div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><p className="text-xs uppercase tracking-wider text-gray-500">Heading</p><p className="mt-2 text-xs text-primary">{heading.index} / {heading.eyebrow}</p><p className="mt-1 text-lg font-semibold">{heading.title}</p></div>
            <div className="rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-700"><p><strong>Table:</strong> public.{key}</p><p className="mt-2"><strong>Fields:</strong> {fields.map((field) => field.key).join(", ")}</p><p className="mt-2"><strong>Initial status:</strong> Inactive; no template assigned</p></div>
            {blockedByEdits && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">Save or discard edits to existing headings before creating this section.</p>}
          </div>}
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        </div>
        <div className="flex justify-between gap-3 border-t border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          {step === 1 ? <span/> : <button type="button" disabled={busy} onClick={() => { setError(""); setStep(step === 3 ? 2 : 1); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"><ArrowLeft size={16}/>Back</button>}
          {step === 3 ? <button type="button" disabled={busy || blockedByEdits} onClick={() => void create()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin"/>}Create inactive section</button>
            : <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Continue<ArrowRight size={16}/></button>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
};
