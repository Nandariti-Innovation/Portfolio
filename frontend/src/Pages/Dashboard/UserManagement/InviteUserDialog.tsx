import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { Loader2, Mail, UserPlus, X } from "lucide-react";
import type { Role } from "@/features/dashboardUsers/api";

type Props = { open: boolean; roles: Role[]; busy: boolean; onOpenChange: (open: boolean) => void; onSubmit: (email: string, role: string) => Promise<void> };
export function InviteUserDialog({ open, roles, busy, onOpenChange, onSubmit }: Props) {
  const [email, setEmail] = useState(""); const [role, setRole] = useState("blank");
  useEffect(() => { if (open) { setEmail(""); setRole("blank"); } }, [open]);
  async function submit(event: FormEvent) { event.preventDefault(); await onSubmit(email.trim(), role); }
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm"/>
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[min(500px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1c293c]">
      <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-700"><div><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><UserPlus size={21}/></span><Dialog.Title className="mt-4 text-xl font-semibold">Invite user</Dialog.Title><Dialog.Description className="mt-1 text-sm text-gray-500">Send an invitation to join your portfolio dashboard.</Dialog.Description></div><Dialog.Close className="rounded-lg p-1 text-gray-500"><X size={19}/></Dialog.Close></div>
      <form onSubmit={event => void submit(event)}><div className="space-y-4 p-6">
        <label className="block text-sm font-medium">Email address<div className="relative mt-2"><Mail className="absolute left-3 top-3 text-gray-400" size={17}/><input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="colleague@example.com" className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 dark:border-gray-600 dark:bg-gray-900"/></div></label>
        <label className="block text-sm font-medium">Initial role<select value={role} onChange={event => setRole(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900"><option value="blank">Pending assignment</option>{roles.filter(item => !["blank","superadmin"].includes(item.role_key)).map(item => <option key={item.role_key} value={item.role_key}>{item.display_name}</option>)}</select><span className="mt-2 block text-xs text-gray-500">A pending user can finish setup but cannot enter dashboard sections.</span></label>
      </div><footer className="flex justify-end gap-3 border-t border-gray-200 p-5 dark:border-gray-700"><Dialog.Close className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600">Cancel</Dialog.Close><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin"/> : <UserPlus size={16}/>}Send invitation</button></footer></form>
    </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
