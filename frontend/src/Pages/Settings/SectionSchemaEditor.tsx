import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import supabase from "@/Superbase/client";
import type { HomepageSectionConfiguration, SectionFieldType } from "@/features/homepageSections/manifest";
import type { TemplateDefinition } from "@/features/homepageSections/templates";

export type SchemaEditorTemplate = TemplateDefinition & {
  reference_section_key?: string | null;
  display_fields?: string[];
};

type FieldDraft = {
  original_key: string | null;
  key: string;
  label: string;
  type: SectionFieldType;
  required: boolean;
};

type Props = {
  open: boolean;
  section: HomepageSectionConfiguration;
  templates: SchemaEditorTemplate[];
  onOpenChange: (open: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onUpdated: () => Promise<void>;
};

const identifier = /^[a-z][a-z0-9_]{0,39}$/;
const reservedColumns = new Set(["id", "display_order", "is_visible", "created_at", "updated_at"]);
const types: { value: SectionFieldType; label: string }[] = [
  { value: "string", label: "Short text" }, { value: "text", label: "Long text" },
  { value: "integer", label: "Whole number" }, { value: "number", label: "Decimal number" },
  { value: "boolean", label: "Yes / no" }, { value: "url", label: "URL" },
  { value: "date", label: "Date" }, { value: "datetime", label: "Date and time" },
  { value: "image", label: "Image URL" }, { value: "string_array", label: "List of text" },
];
const input = "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:disabled:bg-gray-800";

const editableFields = (section: HomepageSectionConfiguration): FieldDraft[] => section.data_schema.fields
  .filter((field) => !reservedColumns.has(field.key) && !field.generated)
  .map((field) => ({ original_key: field.key, key: field.key, label: field.label, type: field.type, required: field.required }));

const emptyField = (): FieldDraft => ({ original_key: null, key: "", label: "", type: "string", required: false });

const dependencyNames = (templates: SchemaEditorTemplate[], sectionKey: string, fieldKey: string) => templates.flatMap((template) => {
  const layout = template.layout_definition;
  const v2Fields = layout.variant === "puck" && "schema_version" in layout && layout.schema_version === 2
    && layout.dependencies.section_key === sectionKey ? layout.dependencies.fields.map((field) => field.field) : [];
  const legacyFields = template.reference_section_key === sectionKey ? template.display_fields || [] : [];
  return v2Fields.includes(fieldKey) || legacyFields.includes(fieldKey) ? [template.display_name] : [];
});

export function SectionSchemaEditor({ open, section, templates, onOpenChange, onDirtyChange, onUpdated }: Props) {
  const initial = useMemo(() => editableFields(section), [section]);
  const [fields, setFields] = useState<FieldDraft[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(fields) !== JSON.stringify(initial);

  useEffect(() => { if (open) { setFields(initial); setError(""); } }, [initial, open]);
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);

  const update = (index: number, patch: Partial<FieldDraft>) => {
    setFields((current) => current.map((field, position) => position === index ? { ...field, ...patch } : field));
    setError("");
  };
  const close = () => {
    if (busy) return;
    if (dirty && !window.confirm("Discard unsaved table-field changes?")) return;
    onDirtyChange(false);
    onOpenChange(false);
  };
  const validate = () => {
    if (!fields.length || fields.length > 20) return "Keep between 1 and 20 custom fields.";
    if (fields.some((field) => !identifier.test(field.key.trim()) || reservedColumns.has(field.key.trim()) || !field.label.trim() || field.label.trim().length > 80)) {
      return "Every field needs a lowercase column key and a label of up to 80 characters.";
    }
    if (new Set(fields.map((field) => field.key.trim())).size !== fields.length) return "Each column key must be unique.";
    return "";
  };
  const save = async () => {
    const failure = validate();
    if (failure || !dirty || busy) { if (failure) setError(failure); return; }
    const removed = initial.filter((oldField) => !fields.some((field) => field.original_key === oldField.original_key));
    const renamed = fields.filter((field) => field.original_key && field.original_key !== field.key);
    const retyped = fields.filter((field) => field.original_key && initial.find((oldField) => oldField.original_key === field.original_key)?.type !== field.type);
    const destructive = [
      ...removed.map((field) => `remove ${field.key}`),
      ...renamed.map((field) => `rename ${field.original_key} to ${field.key}`),
      ...retyped.map((field) => `change ${field.key} to ${field.type}`),
    ];
    if (destructive.length && !window.confirm(`Apply these table changes?\n\n${destructive.join("\n")}\n\nRemoved-column data cannot be recovered without a database backup.`)) return;

    setBusy(true);
    setError("");
    const { error: resultError } = await supabase.rpc("alter_homepage_section_schema", {
      p_section_key: section.section_key,
      p_fields: fields.map((field) => ({
        original_key: field.original_key,
        key: field.key.trim(),
        label: field.label.trim(),
        type: field.type,
        required: field.required,
      })),
    });
    if (resultError) setError(resultError.code === "42501" ? "Your account cannot alter section tables. Sign out and back in to refresh your portfolio-owner session." : resultError.message);
    else {
      onDirtyChange(false);
      onOpenChange(false);
      await onUpdated();
    }
    setBusy(false);
  };

  return <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/70"/>
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] flex max-h-[calc(100dvh-2rem)] w-[min(860px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <div><Dialog.Title className="text-xl font-semibold">Manage {section.section_key.replaceAll("_", " ")} fields</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">Alter columns in <strong>public.{section.table_name}</strong>. Heading and template settings are unchanged.</Dialog.Description></div>
          <button type="button" onClick={close} aria-label="Close" disabled={busy} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={19}/></button>
        </div>
        <div className="min-h-0 space-y-4 overflow-y-auto p-5 sm:p-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">Column changes affect real content. Fields used by a template can only have their label and required status changed until that template is rebound.</p>
          {fields.map((field, index) => {
            const dependencies = field.original_key ? dependencyNames(templates, section.section_key, field.original_key) : [];
            const structurallyLocked = dependencies.length > 0;
            return <div key={field.original_key || `new-${index}`} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-sm font-semibold">{field.original_key ? field.label || field.original_key : `New field ${index + 1}`}</h3>
                  {dependencies.length > 0 && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Used by {dependencies.join(", ")}</p>}</div>
                <button type="button" disabled={fields.length === 1 || structurallyLocked || busy} onClick={() => setFields((current) => current.filter((_, position) => position !== index))} aria-label={`Remove ${field.key || `field ${index + 1}`}`} title={structurallyLocked ? "Rebind the template before removing this field" : "Remove field"} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900"><Trash2 size={14}/>Remove</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">Column key<input className={input} disabled={structurallyLocked || busy} maxLength={40} value={field.key} onChange={(event) => update(index, { key: event.target.value })}/></label>
                <label className="text-sm">Dashboard label<input className={input} disabled={busy} maxLength={80} value={field.label} onChange={(event) => update(index, { label: event.target.value })}/></label>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <label className="min-w-48 flex-1 text-sm">Field type<select className={input} disabled={structurallyLocked || busy} value={field.type} onChange={(event) => update(index, { type: event.target.value as SectionFieldType })}>{types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
                <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" disabled={busy} checked={field.required} onChange={(event) => update(index, { required: event.target.checked })}/>Required for every row</label>
              </div>
            </div>;
          })}
          <button type="button" disabled={fields.length >= 20 || busy} onClick={() => setFields((current) => [...current, emptyField()])} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-gray-600"><Plus size={16}/>Add field</button>
          <p className="text-xs text-gray-500">On a table that already contains content, add new fields as optional. After entering values for existing rows, you can return and mark the field required.</p>
          {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <button type="button" disabled={busy} onClick={close} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600">Cancel</button>
          <button type="button" disabled={!dirty || busy} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{busy && <Loader2 size={16} className="animate-spin"/>}Save table changes</button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
