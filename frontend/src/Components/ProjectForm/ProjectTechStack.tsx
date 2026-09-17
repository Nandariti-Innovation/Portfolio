import { tailwindMerge } from "@/Utils/tailwindMerge";
import { BicepsFlexed, BookAlert, CircleX, Dumbbell, Image, Loader2, Plus, TextCursorInput } from "lucide-react";
import { Dialog } from "radix-ui";
import React, { useEffect, useRef, useState } from "react";
import { ProjectFormInput } from "./ProjectFormInput";
import { ProjectFormSelect } from "./ProjectFormSelect";
import { IconNameList } from "../Icons/IconsComponents";
import supabase from "@/Superbase/client";
import { useDispatch } from "react-redux";
import { fetchSkills } from "@/StateManagement/Redux/slices/skills";
import { AppDispatch } from "@/StateManagement/Redux/reduxStore";

export const ProjectTechStack: React.FC<ProjectTechStackProps> = ({ skillsList, selectedSkills, updateTechStack }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [newSkill, setNewSkill] = useState<SkillItem>({ skill_name: "", skill_image: "", skill_level: "beginner" });
  const selected = selectedSkills;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const toggle = (name: string) => updateTechStack(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
  const saveSkill = async () => {
    if (!newSkill.skill_name.trim() || !newSkill.skill_image) { setError("Add a skill name and choose an icon."); return; }
    setSaving(true); setError("");
    const result = await supabase.from("skills").insert(newSkill);
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    dispatch(fetchSkills());
    setNewSkill({ skill_name: "", skill_image: "", skill_level: "beginner" });
    closeRef.current?.click();
  };

  useEffect(() => { dispatch(fetchSkills()); }, [dispatch]);

  return <div className="space-y-2">
    <div className="flex items-center justify-between"><label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tech stack</label><span className="text-xs text-gray-400">{selected.length} selected</span></div>
    <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60">
      {skillsList.map((skill) => <button key={skill.skill_id} type="button" onClick={() => toggle(skill.skill_name)} className={tailwindMerge("inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition", selected.includes(skill.skill_name) ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300")}>
        {skill.skill_level === "expert" ? <BicepsFlexed size={14}/> : skill.skill_level === "intermediate" ? <Dumbbell size={14}/> : <BookAlert size={14}/>} {skill.skill_name}
      </button>)}
      <Dialog.Root>
        <Dialog.Trigger asChild><button type="button" className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300"><Plus size={14}/> Add skill</button></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm"/>
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] w-[min(500px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl outline-none dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700"><Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">Add a new skill</Dialog.Title><Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a reusable skill for projects and experience entries.</Dialog.Description></div>
            <div className="space-y-4 p-6">
              <ProjectFormInput heading="Skill name" placeholder="React, Three.js, Node.js…" icon={<TextCursorInput size={18}/>} inputName="skill_name" projectTitle={newSkill.skill_name} updateTitle={(value) => setNewSkill((current) => ({...current, skill_name:value}))} isRequired />
              <ProjectFormSelect heading="Skill level" icon={<TextCursorInput size={18}/>} inputName="skill_level" selectedValue={newSkill.skill_level} updateSelect={(value) => setNewSkill((current) => ({...current, skill_level:value as SkillItem["skill_level"]}))} list={["beginner","intermediate","expert"]} isRequired />
              <ProjectFormSelect heading="Icon" inputName="skill_image" icon={<Image size={18}/>} list={IconNameList} selectedValue={newSkill.skill_image} updateSelect={(value) => setNewSkill((current) => ({...current, skill_image:value}))} isRequired />
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
              <div className="flex justify-end gap-3 pt-2"><Dialog.Close asChild><button ref={closeRef} type="button" disabled={saving} className="h-10 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Cancel</button></Dialog.Close><button type="button" onClick={saveSkill} disabled={saving} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin"/>}Add skill</button></div>
            </div>
            <Dialog.Close asChild><button aria-label="Close" className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><CircleX size={20}/></button></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  </div>;
};

interface SkillItem { skill_id?: number; skill_name: string; skill_image: string; skill_level: "beginner" | "intermediate" | "expert"; }
interface ProjectTechStackProps { skillsList: SkillItem[]; updateTechStack: (value: string[]) => void; selectedSkills: string[]; }
