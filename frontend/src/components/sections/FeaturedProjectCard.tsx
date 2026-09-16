import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Code2 } from 'lucide-react';
import type { ProjectItem } from '@/StateManagement/Redux/@types';

const storage = 'https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/';
const mono = "font-['DM_Mono',monospace]";

function previewURL(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return /^[a-z]+:/i.test(value) ? null : storage + value.split('/').map(encodeURIComponent).join('/');
  }
}

export function FeaturedProjectCard({ project, index }: { project: ProjectItem; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = previewURL(project.project_image);
  const technologies = Array.isArray(project.project_tech_stack)
    ? [...new Set(project.project_tech_stack.filter(item => typeof item === 'string' && item.trim()))] : [];

  return (
    <Link to={`/project/${project.project_id}`} className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-white/15 bg-[#101010]/95 text-[#f2efe9] !no-underline transition-colors hover:border-[#ff6b24]/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff6b24] motion-reduce:transition-none">
      <div className="relative aspect-[4/5] overflow-hidden border-b border-white/10 bg-[#171717]">
        {image && !imageFailed ? (
          <img src={image} width={400} height={500} loading="lazy" decoding="async" alt={`${project.project_name} preview`} onError={() => setImageFailed(true)} className="block size-full object-contain" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,#302117,#13100e_80%)] px-8 text-center text-[#b5a79b]">
            <Code2 size={32} aria-hidden="true" /><span className="font-['Playfair_Display',Georgia,serif] text-3xl">{project.project_name}</span>
          </div>
        )}
        <span className={`${mono} absolute left-4 top-4 border border-white/20 bg-[#080808]/90 px-3 py-2 text-[10px] text-[#ff6b24]`}>{String(index + 1).padStart(2, '0')}</span>
        {project.project_status && <span className={`${mono} absolute right-4 top-4 rounded-full border border-white/20 bg-[#080808]/90 px-3 py-2 text-[9px] capitalize`}>{project.project_status}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5 xl:p-7">
        <p className={`${mono} m-0 flex flex-wrap gap-x-2 text-[9px] uppercase leading-5 tracking-wider text-[#a39b92]`}>
          <span className="text-[#ff6b24]">{project.project_type}</span>{project.project_company_name && <span> / {project.project_company_name}</span>}
        </p>
        <h3 className="mb-3 mt-3 break-words font-['Playfair_Display',Georgia,serif] text-[clamp(1.6rem,2.3vw,2.25rem)] font-medium leading-[1.2] tracking-tight group-hover:text-[#ff6b24]">{project.project_name}</h3>
        {project.project_description && <p className="mb-5 line-clamp-3 text-[13px] leading-6 text-[#aaa7a2]">{project.project_description}</p>}
        {technologies.length > 0 && <ul className="mb-6 flex flex-wrap gap-2" aria-label="Technologies">
          {technologies.slice(0, 4).map(tech => <li key={tech} className={`${mono} rounded border border-white/10 px-2.5 py-1.5 text-[9px] text-[#c2bdb6]`}>{tech}</li>)}
          {technologies.length > 4 && <li className={`${mono} px-1 py-1.5 text-[9px] text-[#aaa7a2]`}>+{technologies.length - 4} more</li>}
        </ul>}
        <div className={`${mono} mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-[10px] tracking-wide`}>
          <span>Read case study</span><span className="grid size-8 place-items-center rounded-full border border-white/20 text-[#ff6b24] transition-colors group-hover:bg-[#ff6b24] group-hover:text-[#080808] motion-reduce:transition-none"><ArrowUpRight size={17} aria-hidden="true" /></span>
        </div>
      </div>
    </Link>
  );
}
