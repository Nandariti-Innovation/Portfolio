import { AppDispatch } from "@/StateManagement/Redux/reduxStore";
import { fetchFiles } from "@/StateManagement/Redux/slices/storageslices";
import supabase from "@/Superbase/client";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AlertDialog } from "radix-ui";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

export const DeleteConfirm: React.FC<DeleteConfirmProps> = ({ filename }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const handleFileDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDeleting(true); setError("");
    const result = await supabase.storage.from("portfolio").remove([filename]);
    setDeleting(false);
    if (result.error) { setError(result.error.message); return; }
    dispatch(fetchFiles());
    event.currentTarget.closest("[role='alertdialog']")?.querySelector<HTMLButtonElement>("[data-close-delete]")?.click();
  };
  return <AlertDialog.Portal>
    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" />
    <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl outline-none dark:border-gray-700 dark:bg-gray-800">
      <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"><AlertTriangle size={22}/></div>
      <AlertDialog.Title className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Delete this file?</AlertDialog.Title>
      <AlertDialog.Description className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">This permanently removes <span className="font-medium text-gray-700 dark:text-gray-200">{filename}</span> from portfolio storage. This action cannot be undone.</AlertDialog.Description>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <AlertDialog.Cancel asChild><button data-close-delete type="button" disabled={deleting} className="h-10 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Keep file</button></AlertDialog.Cancel>
        <AlertDialog.Action asChild><button type="button" disabled={deleting} onClick={handleFileDelete} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70">{deleting && <Loader2 size={16} className="animate-spin"/>}Delete file</button></AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>;
};

interface DeleteConfirmProps { filename: string; }
