import { useState, type ReactNode } from 'react';
import { ArrowUpRight, Code2 } from 'lucide-react';
import type { ProjectItem } from '@/StateManagement/Redux/@types';

const label = "font-['DM_Mono',monospace] text-[10px] uppercase tracking-[.18em] text-[#aaa7a2]";
const heading = "font-['Playfair_Display',Georgia,serif] font-medium tracking-tight";
const storage = 'https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/';
const externalURL = (value?: string) => {
  try { const url = new URL(value || ''); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
};
const dateLabel = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};

function StorySection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <section className="grid gap-8 border-t border-white/10 py-12 md:grid-cols-[.65fr_1.35fr] md:gap-16 md:py-16">
    <div><p className={`${label} mb-4 text-[#ff6b24]`}>{number} / THE PROCESS</p><h2 className={`${heading} text-3xl sm:text-4xl`}>{title}</h2></div>
    <div className="min-w-0 whitespace-pre-line text-[15px] leading-8 text-[#b6b1aa]">{children}</div>
  </section>;
}

export function CaseStudyContent({ project: p }: { project: ProjectItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = externalURL(p.project_image) || (p.project_image && !/^[a-z]+:/i.test(p.project_image) ? storage + p.project_image.split('/').map(encodeURIComponent).join('/') : null);
  const features = Array.isArray(p.project_features) ? p.project_features.filter(item => typeof item === 'string' && item.trim()) : [];
  const technologies = Array.isArray(p.project_tech_stack) ? [...new Set(p.project_tech_stack.filter(item => typeof item === 'string' && item.trim()))] : [];
  const start = dateLabel(p.project_start_date);
  const end = dateLabel(p.project_end_date);
  const timeline = start ? `${start}${end ? ` — ${end}` : p.project_status === 'ongoing' ? ' — Present' : ''}` : end;
  const facts = [ ['Role', p.project_role], ['Company', p.project_company_name], ['Platform', p.project_platform], ['Timeline', timeline], ['Team', p.project_team_size > 0 ? p.project_team_size === 1 ? 'Solo project' : `${p.project_team_size} people` : null], ['Status', p.project_status] ].filter(([, value]) => value);
  const links = [ ['Visit live project', externalURL(p.project_link)], ['View source code', externalURL(p.project_github)], ['Company website', externalURL(p.project_company_website)] ].filter(([, url]) => url);
  return <article>
    <div className="grid items-start gap-10 pb-4 pt-5 sm:pt-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:gap-16 xl:gap-24">
    <header className="min-w-0 lg:py-6">
      <p className={`${label} mb-6 flex flex-wrap items-center gap-3`}><span className="h-px w-7 bg-[#ff6b24]" />CASE STUDY {p.project_type && <span className="text-[#ff6b24]">/ {p.project_type}</span>}</p>
      <h1 className={`${heading} break-words text-[clamp(2.8rem,5.5vw,5.5rem)] leading-[1.06]`}>{p.project_name}</h1>
      <div className="mt-7 flex flex-col items-start gap-7">
        {p.project_description && <p className="max-w-3xl whitespace-pre-line text-base leading-8 text-[#aaa7a2]">{p.project_description}</p>}
        {links.length > 0 && <div className="flex flex-wrap gap-x-6 gap-y-3">{links.slice(0, 2).map(([text, url]) => <a key={text} href={url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border-b border-[#ff6b24]/60 py-2 text-xs text-[#f2efe9] hover:text-[#ff6b24]">{text}<ArrowUpRight size={16} /></a>)}</div>}
      </div>
    </header>
    <figure className="mx-auto w-full max-w-[400px] aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-[#131313] lg:ml-auto lg:mr-0">
      {image && !imageFailed ? <img src={image} alt={`${p.project_name} project preview`} onError={() => setImageFailed(true)} width={400} height={500} className="block h-full w-full object-contain" fetchPriority="high" /> : <div className="flex aspect-[4/5] flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,#302117,#13100e_80%)] p-8 text-center text-[#b5a79b]"><Code2 size={36} /><span className={`${heading} text-3xl`}>{p.project_name}</span><span className={label}>Project preview unavailable</span></div>}
    </figure>
    </div>
    {facts.length > 0 && <dl className="my-10 grid grid-cols-2 gap-x-8 gap-y-7 border-y border-white/10 py-8 md:grid-cols-3 lg:grid-cols-6">{facts.map(([name, value]) => <div key={name}><dt className={`${label} mb-3`}>{name}</dt><dd className="break-words text-sm capitalize leading-6">{value}</dd></div>)}</dl>}
    {technologies.length > 0 && <section className="pb-12 pt-2"><h2 className={`${label} mb-5`}>Built with</h2><ul className="flex flex-wrap gap-2.5">{technologies.map(tech => <li key={tech} className="rounded border border-white/10 bg-white/[.025] px-4 py-2.5 text-xs text-[#d0c9c1]">{tech}</li>)}</ul></section>}
    {features.length > 0 && <StorySection number="01" title="What I built"><ol className="grid gap-5">{features.map((feature, index) => <li key={`${index}-${feature}`} className="flex items-start gap-5 border-b border-white/10 pb-5 last:border-0"><span className="pt-1 font-['DM_Mono',monospace] text-xs text-[#ff6b24]">{String(index + 1).padStart(2, '0')}</span><span>{feature}</span></li>)}</ol></StorySection>}
    {p.project_problem_faced?.trim() && <StorySection number="02" title="The challenges"><p>{p.project_problem_faced}</p></StorySection>}
    {p.project_learning?.trim() && <StorySection number="03" title="What I learned"><div className="border-l-2 border-[#ff6b24] bg-[#ff6b24]/[.035] p-6 sm:p-8"><p>{p.project_learning}</p></div></StorySection>}
    {links.length > 0 && <section className="flex flex-wrap items-center justify-between gap-6 border-t border-white/10 py-10"><h2 className={`${heading} text-3xl`}>Explore the project<span className="text-[#ff6b24]">.</span></h2><div className="flex flex-wrap gap-5">{links.map(([text, url]) => <a key={text} href={url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border-b border-white/20 py-2 text-xs hover:border-[#ff6b24] hover:text-[#ff6b24]">{text}<ArrowUpRight size={16} /></a>)}</div></section>}
  </article>;
}
