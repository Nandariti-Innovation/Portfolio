import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { TemplateDefinition } from "@/features/homepageSections/templates";

export type TemplateDetails = {
  template_key: string;
  display_name: string;
  description: string;
  is_published: boolean;
};

type Props = {
  open: boolean;
  original: TemplateDefinition | null;
  onOpenChange: (open: boolean) => void;
  onProceed: (details: TemplateDetails) => void;
};

const input = "mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:disabled:bg-gray-800";
const identifier = /^[a-z][a-z0-9_]{0,63}$/;

export function TemplateDetailsDialog({ open, original, onOpenChange, onProceed }: Props) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setKey(original?.template_key || "");
    setName(original?.display_name || "");
    setDescription(original?.description || "");
    setPublished(original?.is_published ?? true);
    setError("");
  }, [open, original]);

  const proceed = () => {
    if (!identifier.test(key.trim())) { setError("Template key must start with a lowercase letter and contain only lowercase letters, numbers, or underscores."); return; }
    if (!name.trim() || name.trim().length > 120) { setError("Display name is required and must be 120 characters or fewer."); return; }
    if (!description.trim() || description.trim().length > 500) { setError("Description is required and must be 500 characters or fewer."); return; }
    onProceed({ template_key: key.trim(), display_name: name.trim(), description: description.trim(), is_published: published });
  };

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/75"/>
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[min(920px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1c293c]">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <div><Dialog.Title className="text-xl font-semibold">{original ? `Edit ${original.display_name}` : "Create a reusable template"}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">Set the template details first, then continue to the full-page visual editor.</Dialog.Description></div>
          <Dialog.Close className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close"><X size={19}/></Dialog.Close>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
            <label className="text-sm font-medium">Template key<input className={input} value={key} disabled={!!original} maxLength={64} onChange={(event) => { setKey(event.target.value); setError(""); }}/></label>
            <label className="text-sm font-medium">Display name<input className={input} value={name} maxLength={120} onChange={(event) => { setName(event.target.value); setError(""); }}/></label>
            <label className="text-sm font-medium">Description<textarea className={`${input} min-h-24 resize-y`} value={description} maxLength={500} onChange={(event) => { setDescription(event.target.value); setError(""); }}/></label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-xs text-gray-500">Dynamic fields and visual design are configured inside the editor.</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)}/>Available on homepage</label>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <Dialog.Close className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600">Cancel</Dialog.Close>
          <button type="button" onClick={proceed} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white">Proceed to editor<ArrowRight size={16}/></button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
