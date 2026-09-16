import { ProjectDescription } from "@/Components/ProjectForm/ProjectDescription";
import { ProjectFeatures } from "@/Components/ProjectForm/ProjectFeatures";
import { ProjectFormInput } from "@/Components/ProjectForm/ProjectFormInput";
import { ProjectFormSelect } from "@/Components/ProjectForm/ProjectFormSelect";
import { ProjectTechStack } from "@/Components/ProjectForm/ProjectTechStack";
import { ExperienceType } from "@/StateManagement/Redux/@types";
import { AppDispatch, RootState } from "@/StateManagement/Redux/reduxStore";
import { fetchExperienceData } from "@/StateManagement/Redux/slices/experience";
import supabase from "@/Superbase/client";
import { formatDate } from "@/Utils/helperFunc";
import { AlertTriangle, AlignLeft, BookType, BriefcaseBusiness, CircleX, Clock, Loader2, MapPin, Pen } from "lucide-react";
import { AlertDialog, Dialog } from "radix-ui";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const emptyExperience: ExperienceType = { work_company_name: "", work_start_date: formatDate(new Date()), work_end_date: formatDate(new Date()), work_location: "", work_designation: "", work_roles_responsibility: [""], work_tech_stack: [], work_type: "full-time", work_short_description: "" };

export const NewExperienceModal: React.FC<NewExperienceModalProps> = ({ initialData = emptyExperience, isUpdating = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { skills } = useSelector((state: RootState) => state.skills);
  const [data, setData] = useState<ExperienceType>(initialData);
  const [currentRole, setCurrentRole] = useState(!initialData.work_end_date);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const finish = () => { dispatch(fetchExperienceData()); closeRef.current?.click(); };
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    const query = isUpdating ? supabase.from("work_experience").update(data).eq("work_id", initialData.work_id) : supabase.from("work_experience").insert(data);
    const result = await query; setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    finish();
  };
  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    const result = await supabase.from("work_experience").delete().eq("work_id", initialData.work_id); setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    finish();
  };

  useEffect(() => setData((current) => ({ ...current, work_end_date: currentRole ? null : current.work_end_date || formatDate(new Date()) })), [currentRole]);
  return <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm data-[state=open]:animate-overlayShow"/>
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(820px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl outline-none dark:border-gray-700 dark:bg-gray-800 data-[state=open]:animate-contentShow">
      <header className="flex items-start gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-700"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><BriefcaseBusiness size={22}/></div><div><Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">{isUpdating ? "Edit experience" : "Add experience"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">Keep your role details, dates, responsibilities, and tools up to date.</Dialog.Description></div></header>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="grid gap-4 md:grid-cols-2"><ProjectFormInput heading="Company" placeholder="Company name" icon={<BriefcaseBusiness size={18}/>} inputName="work_company_name" projectTitle={data.work_company_name} updateTitle={(value) => setData((current) => ({...current,work_company_name:value}))} isRequired/><ProjectFormInput heading="Job title" placeholder="Your role" icon={<Pen size={18}/>} inputName="work_designation" projectTitle={data.work_designation} updateTitle={(value) => setData((current) => ({...current,work_designation:value}))} isRequired/><ProjectFormSelect selectedValue={data.work_type} heading="Employment type" list={["full-time","part-time","freelance"]} inputName="work_type" updateSelect={(value) => setData((current) => ({...current,work_type:value as ExperienceType["work_type"]}))} icon={<BookType size={18}/>} isRequired/><ProjectFormInput heading="Location" placeholder="City or remote" icon={<MapPin size={18}/>} inputName="work_location" projectTitle={data.work_location} updateTitle={(value) => setData((current) => ({...current,work_location:value}))} isRequired/></section>
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"><label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200"><input type="checkbox" checked={currentRole} onChange={(e) => setCurrentRole(e.target.checked)} className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>I currently work here</label><div className="mt-4 grid gap-4 sm:grid-cols-2"><ProjectFormInput heading="Start date" placeholder="Start date" inputName="work_start_date" projectTitle={data.work_start_date} icon={<Clock size={18}/>} isRequired updateTitle={(value) => setData((current) => ({...current,work_start_date:value}))} inputType="date"/>{!currentRole && <ProjectFormInput heading="End date" placeholder="End date" inputName="work_end_date" projectTitle={data.work_end_date || formatDate(new Date())} icon={<Clock size={18}/>} isRequired updateTitle={(value) => setData((current) => ({...current,work_end_date:value}))} inputType="date"/>}</div></section>
          <ProjectDescription heading="Short description" placeholder="A short summary of this role" icon={<AlignLeft size={18}/>} projectdescription={data.work_short_description || ""} updatedescription={(value) => setData((current) => ({...current,work_short_description:value}))}/>
          <ProjectFeatures heading="Roles and responsibilities" list={data.work_roles_responsibility} updateFeatures={(value) => setData((current) => ({...current,work_roles_responsibility:value}))}/>
          <ProjectTechStack skillsList={skills} selectedSkills={data.work_tech_stack} updateTechStack={(value) => setData((current) => ({...current,work_tech_stack:value}))}/>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/50"><div>{isUpdating && <AlertDialog.Root><AlertDialog.Trigger asChild><button type="button" disabled={busy} className="h-10 cursor-pointer rounded-lg border border-red-200 px-4 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30">Delete experience</button></AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm"/><AlertDialog.Content className="fixed left-1/2 top-1/2 z-[80] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl outline-none dark:border-gray-700 dark:bg-gray-800"><div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40"><AlertTriangle size={22}/></div><AlertDialog.Title className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Delete this experience?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">This permanently removes the {data.work_designation || "experience"} entry from your portfolio.</AlertDialog.Description><div className="mt-6 flex justify-end gap-3"><AlertDialog.Cancel asChild><button type="button" className="h-10 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200">Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button type="button" onClick={handleDelete} disabled={busy} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700">{busy && <Loader2 size={16} className="animate-spin"/>}Delete</button></AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>}</div><div className="flex gap-3"><Dialog.Close asChild><button ref={closeRef} type="button" disabled={busy} className="h-10 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Cancel</button></Dialog.Close><button type="submit" disabled={busy} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70">{busy && <Loader2 size={16} className="animate-spin"/>}{isUpdating ? "Save changes" : "Add experience"}</button></div></footer>
      </form>
      <Dialog.Close asChild><button aria-label="Close" disabled={busy} className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"><CircleX size={20}/></button></Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>;
};

interface NewExperienceModalProps { initialData?: ExperienceType; isUpdating?: boolean; }
