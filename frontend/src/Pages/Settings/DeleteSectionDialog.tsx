import { useEffect, useState } from "react";
import { AlertCircle, Check, Database, FileText, LayoutTemplate, Loader2, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import supabase from "@/Superbase/client";
import type { HomepageSectionConfiguration } from "@/features/homepageSections/manifest";

type Impact = {
  section_key: string;
  table_name: string;
  row_count: number;
  templates: { template_key: string; display_name: string; is_builtin: boolean }[];
  blocked_by_sections: string[];
  has_builtin_template: boolean;
  can_delete: boolean;
};

type Props = {
  open: boolean;
  section: HomepageSectionConfiguration;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => Promise<void>;
};

const pause = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function DeleteSectionDialog({ open, section, onOpenChange, onDeleted }: Props) {
  const [impact, setImpact] = useState<Impact | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [completedStep, setCompletedStep] = useState(0);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setImpact(null); setLoading(true); setDeleting(false); setCompletedStep(0); setConfirmation(""); setError("");
    const load = async () => {
      const { data, error: failure } = await supabase.rpc("get_homepage_section_deletion_impact", { p_section_key: section.section_key });
      if (cancelled) return;
      if (failure) setError(failure.code === "42501" ? "Your account cannot delete sections. Sign out and back in to refresh your portfolio-owner session." : failure.message);
      else setImpact(data as Impact);
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [open, section.section_key]);

  const close = () => { if (!deleting) onOpenChange(false); };
  const remove = async () => {
    if (!impact?.can_delete || confirmation !== section.section_key || deleting) return;
    setDeleting(true); setError(""); setCompletedStep(2);
    const { error: failure } = await supabase.rpc("delete_homepage_section", {
      p_section_key: section.section_key,
      p_confirmation: confirmation,
    });
    if (failure) {
      setError(failure.code === "42501" ? "Your account cannot delete sections. Sign out and back in to refresh your portfolio-owner session." : failure.message);
      setDeleting(false); setCompletedStep(0); return;
    }
    setCompletedStep(3); await pause(250);
    setCompletedStep(4); await pause(250);
    setCompletedStep(5);
    setDeleting(false);
  };
  const proceed = async () => {
    await onDeleted();
    onOpenChange(false);
  };
  const steps = [
    { label: "Connections checked", detail: `${impact?.templates.length || 0} connected template${impact?.templates.length === 1 ? "" : "s"}`, icon: LayoutTemplate },
    { label: "Table entries counted", detail: `${impact?.row_count || 0} row${impact?.row_count === 1 ? "" : "s"} will be deleted`, icon: FileText },
    { label: "Connected templates deleted", detail: impact?.templates.map((template) => template.display_name).join(", ") || "No connected template", icon: LayoutTemplate },
    { label: "Section heading removed", detail: "Removed from Homepage headings", icon: FileText },
    { label: "Section table deleted", detail: `public.${impact?.table_name || section.table_name}`, icon: Database },
  ];

  return <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/75"/>
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] flex max-h-[calc(100dvh-2rem)] w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-red-200 bg-white shadow-2xl dark:border-red-900 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <div><Dialog.Title className="flex items-center gap-2 text-xl font-semibold text-red-600"><Trash2 size={20}/>Delete {section.section_key.replaceAll("_", " ")}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review every connected resource before permanently deleting this custom section.</Dialog.Description></div>
          {completedStep < 5 && <button type="button" onClick={close} aria-label="Close" disabled={deleting} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700"><X size={19}/></button>}
        </div>
        <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6">
          {loading ? <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500"><Loader2 size={18} className="animate-spin"/>Checking section connections and entries…</div> : <>
            <div className="space-y-2">{steps.map((step, index) => {
              const Icon = step.icon;
              const checked = index < 2 || completedStep > index;
              const active = deleting && completedStep === index;
              return <div key={step.label} className={`flex items-start gap-3 rounded-xl border p-3 ${checked ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : active ? "border-primary/40 bg-primary/5" : "border-gray-200 dark:border-gray-700"}`}>
                <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${checked ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>{checked ? <Check size={15}/> : active ? <Loader2 size={15} className="animate-spin"/> : <Icon size={15}/>}</span>
                <div><p className="text-sm font-medium">{step.label}</p><p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{step.detail}</p></div>
              </div>;
            })}</div>

            {impact && !impact.can_delete && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              <p className="font-semibold">Deletion is blocked.</p>
              {impact.has_builtin_template && <p className="mt-1">A built-in template depends on this section.</p>}
              {impact.blocked_by_sections.length > 0 && <p className="mt-1">Connected templates are also assigned to: {impact.blocked_by_sections.join(", ")}.</p>}
            </div>}

            {impact?.can_delete && completedStep < 5 && !deleting && <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">This cannot be undone.</p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Type <strong>{section.section_key}</strong> to confirm permanent deletion.</p>
              <input className="mt-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 dark:border-red-800 dark:bg-gray-900" value={confirmation} disabled={deleting} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off"/>
            </div>}

            {completedStep === 5 && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">Section deletion completed successfully. Its templates, heading configuration, content rows, and table have been removed.</p>}
          </>}
          {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          {completedStep === 5 ? <button type="button" onClick={() => void proceed()} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white">Proceed</button> : <>
            <button type="button" disabled={deleting} onClick={close} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-gray-600">Cancel</button>
            <button type="button" disabled={loading || deleting || !impact?.can_delete || confirmation !== section.section_key} onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{deleting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}Delete permanently</button>
          </>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
