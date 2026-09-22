import { lazy, Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutTemplate, Loader2, Plus, RefreshCw } from 'lucide-react';
import supabase from '@/Superbase/client';
import { CaseStudyLayout } from '@/features/caseStudyTemplates/CaseStudyLayout';
import { validateCaseLayout, type CaseStudyTemplate } from '@/features/caseStudyTemplates/model';
import type { ProjectItem } from '@/StateManagement/Redux/@types';

const Designer = lazy(() => import('./Designer'));
const sample: ProjectItem = { project_name: 'Sample project', project_image: '', project_features: ['A useful feature'], project_tech_stack: ['React'], project_description: 'A brief example of the project.', project_problem_faced: 'A real challenge.', project_learning: 'What we learned.', project_type: 'personal', project_company_name: '', project_priority: null, project_start_date: '2025-01-01', project_end_date: null, project_status: 'completed', project_role: 'Developer', project_team_size: 1, project_platform: 'Web', project_github: '', project_link: '', project_company_website: '' };

export default function CaseStudyTemplates() {
  const [templates, setTemplates] = useState<CaseStudyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<CaseStudyTemplate | 'new' | null>(null);
  useEffect(() => {
    let cancelled = false;
    void supabase.from('case_study_templates').select('template_key,display_name,description,layout,is_published,updated_at').order('template_key')
      .then(({ data, error: requestError }) => {
        if (cancelled) return;
        if (requestError) { setTemplates([]); setError(requestError.message); }
        else { setTemplates((data || []) as CaseStudyTemplate[]); setError(''); }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [version]);
  const refresh = () => { setLoading(true); setVersion(value => value + 1); };
  return <main className="h-full min-w-0 flex-1 overflow-y-auto bg-background p-4 text-gray-900 dark:bg-darkthemebg dark:text-white sm:p-6"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Case study templates</h1><p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-300">Create reusable page designs, map their blocks to project columns, then assign a published design when editing a project.</p></div><div className="flex gap-2"><button type="button" onClick={refresh} disabled={loading} aria-label="Refresh templates" className="rounded-lg border p-2"><RefreshCw size={19}/></button><button type="button" onClick={() => setEditing('new')} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white"><Plus size={17}/>New template</button></div></header>
    {loading ? <p role="status" className="mt-12 flex items-center gap-2"><Loader2 className="animate-spin"/>Loading templates…</p> : error ? <p role="alert" className="mt-8 text-red-500">Unable to load templates: {error}</p> : <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{templates.map(template => {
      let valid = true;
      try { validateCaseLayout(template.layout); } catch { valid = false; }
      return <article key={template.template_key} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"><div className="h-48 overflow-hidden bg-[#0d0d0d] p-4 text-white"><div className="pointer-events-none w-[240%] origin-top-left scale-[.4]">{valid ? <CaseStudyLayout project={sample} data={template.layout}/> : <LayoutTemplate size={42}/>}</div></div><div className="p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{template.display_name}</h2><span className={`rounded-full px-2 py-1 text-xs ${template.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{template.is_published ? 'Published' : 'Draft'}</span></div><p className="mt-1 font-mono text-xs text-gray-500">{template.template_key}</p><p className="mt-3 min-h-10 text-sm text-gray-500 dark:text-gray-300">{template.description}</p><button type="button" onClick={() => setEditing(template)} className="mt-4 rounded-lg border px-3 py-2 text-sm">Edit design</button></div></article>;
    })}{!templates.length && <p>No case study templates yet. Create one to start designing.</p>}</div>}
  </div>{editing && createPortal(<div className="fixed inset-0 z-[100] overflow-y-auto bg-white dark:bg-gray-800"><Suspense fallback={<p className="p-8">Loading designer…</p>}><Designer key={editing === 'new' ? 'new' : editing.template_key} original={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }}/></Suspense></div>, document.body)}</main>;
}
