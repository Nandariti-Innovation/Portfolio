import { DropedFile } from "../Types/Files";
import { AppDispatch } from "@/StateManagement/Redux/reduxStore";
import { fetchFiles } from "@/StateManagement/Redux/slices/storageslices";
import supabase from "@/Superbase/client";
import { CircleX, CloudUpload, FileUp, FileX, ImageUp, Loader2 } from "lucide-react";
import { Dialog } from "radix-ui";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";

export const FileFormModal = ({ newUpload = true }: { newUpload?: true | string }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedFile, setSelectedFile] = useState<DropedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const selectFile = (file?: File) => {
    if (!file) return;
    setError(null);
    setSelectedFile({ data: file, fileName: file.name, size: file.size, type: file.type });
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    const bucket = supabase.storage.from("portfolio");
    const result = newUpload === true
      ? await bucket.upload(selectedFile.fileName, selectedFile.data, { cacheControl: "3600", upsert: false })
      : await bucket.update(newUpload, selectedFile.data, { cacheControl: "3600", upsert: false });
    setUploading(false);
    if (result.error) { setError(result.error); return; }
    setSelectedFile(null);
    dispatch(fetchFiles());
    closeRef.current?.click();
  };

  const stateClasses = error ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : selectedFile ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/20" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-blue-600";
  return <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm data-[state=open]:animate-overlayShow" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl outline-none dark:border-gray-700 dark:bg-gray-800 data-[state=open]:animate-contentShow">
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">{newUpload === true ? "Upload media" : "Replace media"}</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose one file. It will be stored in your portfolio media library.</Dialog.Description>
      </div>
      <div className="p-6">
        <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!uploading) selectFile(e.dataTransfer.files[0]); }}
          className={`flex min-h-60 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition disabled:cursor-wait ${stateClasses}`}>
          {uploading ? <><Loader2 size={42} className="mb-4 animate-spin text-blue-600"/><strong className="text-gray-900 dark:text-white">Uploading media…</strong><span className="mt-1 text-sm text-gray-500">Please keep this dialog open.</span></>
          : error ? <><FileX size={42} className="mb-4 text-red-500"/><strong className="text-red-700 dark:text-red-300">Upload failed</strong><span className="mt-1 max-w-sm text-sm text-red-600 dark:text-red-400">{error.message}</span><span className="mt-3 text-xs text-gray-500">Click or drop a file to try again</span></>
          : selectedFile ? <>{selectedFile.type.startsWith("image/") ? <ImageUp size={42} className="mb-4 text-blue-600"/> : <FileUp size={42} className="mb-4 text-blue-600"/>}<strong className="max-w-full truncate text-gray-900 dark:text-white">{selectedFile.fileName}</strong><span className="mt-1 text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to choose another</span></>
          : <><CloudUpload size={42} className="mb-4 text-blue-600"/><strong className="text-gray-900 dark:text-white">Drop a file here</strong><span className="mt-1 text-sm text-gray-500">or click to browse your device</span></>}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => selectFile(e.target.files?.[0])}/>
        <div className="mt-6 flex justify-end gap-3">
          <Dialog.Close asChild><button ref={closeRef} type="button" disabled={uploading} className="h-10 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Cancel</button></Dialog.Close>
          <button type="button" onClick={handleSubmit} disabled={!selectedFile || uploading} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{uploading && <Loader2 size={16} className="animate-spin"/>}{newUpload === true ? "Upload file" : "Replace file"}</button>
        </div>
      </div>
      <Dialog.Close asChild><button aria-label="Close" disabled={uploading} className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-white"><CircleX size={20}/></button></Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>;
};
