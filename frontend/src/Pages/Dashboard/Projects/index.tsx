import { useContext, useEffect, useMemo, useState } from 'react';
import { CircleCheck, Loader2, RefreshCw, Rocket, Search, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { settingContext } from '@/StateManagement/ContextAPI/SettingContext/SettingContext';
import type { AppDispatch, RootState } from '@/StateManagement/Redux/reduxStore';
import { fetchProjectsList } from '@/StateManagement/Redux/slices/projects';
import { PorjectCard } from './Components/PorjectCard';
import { NewProjectCard } from './Components/newProjectCard';

export default function Projects() {
  const dispatch=useDispatch<AppDispatch>(); const { collapsed }=useContext(settingContext);
  const { projects,loading,error }=useSelector((state:RootState)=>state.projects);
  const [search,setSearch]=useState(''); const [type,setType]=useState('all');
  useEffect(()=>{ if(!projects.length) void dispatch(fetchProjectsList()); },[dispatch,projects.length]);
  const visible=useMemo(()=>projects.filter(project=>{ const term=search.trim().toLowerCase(); const match=!term||[project.project_name,project.project_company_name,project.project_role,...project.project_tech_stack].some(value=>String(value||'').toLowerCase().includes(term)); return match&&(type==='all'||project.project_type===type); }),[projects,search,type]);
  const width=collapsed?'w-[calc(100vw-70px)]':'w-[calc(100vw-240px)]';
  return <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-800 transition-all dark:bg-darkthemebg dark:text-gray-100 ${width}`}><div className="mx-auto max-w-7xl p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Projects</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Manage portfolio case studies, status, and featured work.</p></div><div className="flex gap-2"><button disabled={loading} onClick={()=>void dispatch(fetchProjectsList())} className="grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800" aria-label="Refresh projects"><RefreshCw size={17} className={loading?'animate-spin':''}/></button><NewProjectCard/></div></header>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total projects" value={projects.length} icon={Rocket}/><Stat label="Featured" value={projects.filter(x=>x.project_priority!=null).length} icon={Star}/><Stat label="Professional" value={projects.filter(x=>x.project_type==='professional').length} icon={CircleCheck}/><Stat label="Completed" value={projects.filter(x=>x.project_status==='completed').length} icon={CircleCheck}/></section>
    <section className="mt-5 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><label className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, company, role, or technology…" className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-900"/></label><select value={type} onChange={e=>setType(e.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"><option value="all">All project types</option><option value="professional">Professional</option><option value="personal">Personal</option><option value="other">Other</option></select></section>
    {loading?<State icon={<Loader2 className="animate-spin"/>} text="Loading projects…"/>:error?<div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-800">Unable to load projects. {error}</div>:visible.length?<div className="mt-5 grid gap-5 lg:grid-cols-2">{visible.map((project,index)=><PorjectCard data={project} projectIndex={index} key={`${project.project_id}_${project.project_name}`}/>)}</div>:<State icon={<Rocket/>} text="No matching projects"/>}
  </div></main>;
}
function Stat({label,value,icon:Icon}:{label:string;value:number;icon:typeof Rocket}){return <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div><span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon size={20}/></span></div></article>}
function State({icon,text}:{icon:React.ReactNode;text:string}){return <div className="mt-5 flex justify-center gap-3 rounded-xl border border-dashed border-gray-300 py-20 text-gray-500 dark:border-gray-600">{icon}{text}</div>}
