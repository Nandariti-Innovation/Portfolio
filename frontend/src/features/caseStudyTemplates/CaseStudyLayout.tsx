import { createElement, type ComponentType, type ReactNode } from 'react';
import { ArrowUpRight, Code2 } from 'lucide-react';
import type { ProjectItem } from '@/StateManagement/Redux/@types';
import { fieldValue, type CaseBlock, type CaseLayout } from './model';

const small = "font-['DM_Mono',monospace] text-xs uppercase tracking-widest text-[#ff6b24]";
const heading = "font-['Playfair_Display',Georgia,serif] font-medium tracking-tight";
const storage = 'https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/';
const str = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const imageSource = (value: unknown) => {
  const raw = str(value).trim();
  if (!raw) return '';
  try { const url = new URL(raw); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch { return !raw.startsWith('/') && !/^[a-z]+:/i.test(raw) ? storage + raw.split('/').map(encodeURIComponent).join('/') : ''; }
};
const safeLink = (value: unknown) => {
  try { const url = new URL(str(value)); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
};
const date = (value: unknown) => {
  const parsed = new Date(str(value));
  return !value || Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};

export function CaseStudyBlock({ type, props, project, editing = false, children = {} }: {
  type: CaseBlock; props: Record<string, unknown>; project: ProjectItem; editing?: boolean;
  children?: { left?: ReactNode; right?: ReactNode; content?: ReactNode };
}) {
  const pick = (field: unknown) => fieldValue(project, str(field));
  const empty = (content: ReactNode) => content || (editing ? <span className="text-[#827b74]">Add project data to preview this block.</span> : null);
  switch (type) {
    case 'Hero': {
      const title = str(pick(props.titleField));
      const description = str(pick(props.descriptionField));
      const image = imageSource(pick(props.imageField));
      return <header className="grid items-center gap-10 py-12 md:grid-cols-[1.2fr_.8fr] md:gap-16 md:py-20"><div className="min-w-0"><p className={small}>PROJECT CASE STUDY</p><h1 className={`${heading} mt-6 break-words text-[clamp(2.8rem,5.5vw,5.5rem)] leading-[1.08]`}>{title}</h1><p className="mt-7 max-w-2xl whitespace-pre-line text-base leading-8 text-[#b6b1aa]">{description}</p></div><div className="mx-auto aspect-[4/5] w-full max-w-[400px] overflow-hidden rounded-lg border border-white/10 bg-[#302117]">{image ? <img src={image} alt={`${title} project preview`} className="h-full w-full object-contain"/> : <div className="grid h-full place-items-center"><Code2 size={42}/></div>}</div></header>;
    }
    case 'Facts': {
      const facts = [['Role', project.project_role], ['Company', project.project_company_name], ['Platform', project.project_platform], ['Timeline', [date(project.project_start_date), date(project.project_end_date) || (project.project_status === 'ongoing' ? 'Present' : '')].filter(Boolean).join(' — ')], ['Team', project.project_team_size > 1 ? `${project.project_team_size} people` : 'Solo project'], ['Status', project.project_status]].filter(([, value]) => Boolean(value));
      return <dl className="my-8 grid grid-cols-2 gap-7 border-y border-white/15 py-8 md:grid-cols-3 lg:grid-cols-6">{facts.map(([label, value]) => <div key={label}><dt className={small}>{label}</dt><dd className="mt-3 break-words text-sm capitalize">{value}</dd></div>)}</dl>;
    }
    case 'Technologies': return <section className="py-8"><h2 className={small}>Built with</h2><ul className="mt-5 flex flex-wrap gap-2">{(project.project_tech_stack || []).filter(Boolean).map(tech => <li key={tech} className="rounded border border-white/20 px-4 py-2 text-sm">{tech}</li>)}</ul></section>;
    case 'Features': return (project.project_features?.length || editing) ? <section className="border-t border-white/10 py-12"><h2 className={`${heading} text-3xl md:text-4xl`}>{str(props.title) || 'Features'}</h2><ol className="mt-8 grid gap-5 md:grid-cols-2">{(project.project_features || []).filter(Boolean).map((feature, index) => <li key={`${index}-${feature}`} className="border-b border-white/10 pb-4 text-sm leading-7"><span className={`${small} mr-4`}>{String(index + 1).padStart(2, '0')}</span>{feature}</li>)}</ol></section> : null;
    case 'Story': { const content = str(pick(props.field)); return (content || editing) ? <section className="grid gap-8 border-t border-white/10 py-12 md:grid-cols-[.65fr_1.35fr]"><h2 className={`${heading} text-3xl md:text-4xl`}>{str(props.title) || 'Project story'}</h2><p className="whitespace-pre-line text-[15px] leading-8 text-[#b6b1aa]">{empty(content)}</p></section> : null; }
    case 'Image': { const image = imageSource(pick(props.field)); const shape = props.shape === 'square' ? 'aspect-square' : props.shape === 'portrait' ? 'aspect-[4/5]' : 'aspect-video'; return image || editing ? <figure className={`${shape} my-8 overflow-hidden rounded-lg bg-[#302117]`}>{image && <img src={image} alt={`${project.project_name} illustration`} className="h-full w-full object-contain"/>}</figure> : null; }
    case 'Text': { const value = pick(props.field); const content = props.field === 'project_start_date' || props.field === 'project_end_date' ? date(value) : str(value); return <p className={`${props.style === 'heading' ? `${heading} text-3xl md:text-4xl` : props.style === 'eyebrow' ? small : 'whitespace-pre-line text-base leading-8 text-[#b6b1aa]'} my-5`}>{empty(content)}</p>; }
    case 'StaticText': return <p className={`${props.style === 'heading' ? `${heading} text-3xl md:text-4xl` : props.style === 'eyebrow' ? small : 'whitespace-pre-line text-base leading-8 text-[#b6b1aa]'} my-5`}>{str(props.text)}</p>;
    case 'Links': { const links = [['Visit live project', safeLink(project.project_link)], ['View source code', safeLink(project.project_github)], ['Company website', safeLink(project.project_company_website)]].filter(([, url]) => url); return links.length || editing ? <nav className="flex flex-wrap gap-6 border-t border-white/10 py-10" aria-label="Project links">{links.map(([label, url]) => editing ? <span key={label} className="inline-flex items-center gap-2 border-b border-[#ff6b24] py-2 text-sm">{label}<ArrowUpRight size={15}/></span> : <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border-b border-[#ff6b24] py-2 text-sm">{label}<ArrowUpRight size={15}/></a>)}</nav> : null; }
    case 'Columns': return <div className={`grid gap-6 py-4 md:gap-10 ${props.balance === 'wide-left' ? 'md:grid-cols-[2fr_1fr]' : props.balance === 'wide-right' ? 'md:grid-cols-[1fr_2fr]' : 'md:grid-cols-2'}`}><div className="min-w-0">{children.left}</div><div className="min-w-0">{children.right}</div></div>;
    case 'Panel': return <div className={`my-8 rounded-xl p-6 md:p-10 ${props.tone === 'warm' ? 'border border-[#ff6b24]/30 bg-[#302117]/70' : props.tone === 'outline' ? 'border border-white/20' : 'bg-[#181818]'}`}>{children.content}</div>;
    case 'Divider': return <hr className="my-10 border-white/20"/>;
    case 'Spacer': return <div aria-hidden="true" className={props.size === 'large' ? 'h-20' : props.size === 'small' ? 'h-5' : 'h-10'}/>;
  }
}

// Public pages use this small, constrained renderer instead of loading Puck's editor.
export function CaseStudyLayout({ data, project }: { data: CaseLayout; project: ProjectItem }) {
  const render = (nodes: CaseLayout['content']): ReactNode => nodes.map((node, index) => {
    const item = node as { type: CaseBlock; props: Record<string, unknown> };
    if (!item.props || typeof item.props !== 'object') return null;
    const slots: { left?: ReactNode; right?: ReactNode; content?: ReactNode } = {};
    for (const name of ['left', 'right', 'content'] as const) if (Array.isArray(item.props[name])) slots[name] = render(item.props[name] as CaseLayout['content']);
    return createElement(CaseStudyBlock as ComponentType<Parameters<typeof CaseStudyBlock>[0]>, { key: str(item.props.id) || String(index), type: item.type, props: item.props, project, children: slots });
  });
  return <article>{render(data.content)}</article>;
}
