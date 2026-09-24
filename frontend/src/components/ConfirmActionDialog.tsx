import { AlertDialog } from "radix-ui";
import { AlertTriangle, Loader2 } from "lucide-react";

type Props = {
  open: boolean; title: string; description: string; action: string;
  busy?: boolean; danger?: boolean; confirmation?: string; value?: string;
  onValueChange?: (value: string) => void; onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ConfirmActionDialog({ open, title, description, action, busy, danger, confirmation, value = "", onValueChange, onOpenChange, onConfirm }: Props) {
  const blocked = Boolean(confirmation && value !== confirmation);
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm"/>
      <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[min(460px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl outline-none dark:border-gray-700 dark:bg-[#1c293c]">
        <span className={`grid size-11 place-items-center rounded-xl ${danger ? "bg-red-50 text-red-600 dark:bg-red-950/40" : "bg-primary/10 text-primary"}`}><AlertTriangle size={21}/></span>
        <AlertDialog.Title className="mt-4 text-xl font-semibold">{title}</AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</AlertDialog.Description>
        {confirmation && <label className="mt-4 block text-sm font-medium">Type <strong>{confirmation}</strong> to confirm
          <input autoComplete="off" value={value} onChange={event => onValueChange?.(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-900"/>
        </label>}
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialog.Cancel asChild><button type="button" disabled={busy} className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium disabled:opacity-50 dark:border-gray-600">Cancel</button></AlertDialog.Cancel>
          <button type="button" disabled={busy || blocked} onClick={onConfirm} className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-40 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-blue-600"}`}>{busy && <Loader2 size={15} className="animate-spin"/>}{action}</button>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}
