import { useMemo, useState } from 'react';
import { Puck, type Config } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import supabase from '@/Superbase/client';
import type { ProjectItem } from '@/StateManagement/Redux/@types';
import { CaseStudyBlock } from '@/features/caseStudyTemplates/CaseStudyLayout';
import { newCaseLayout, PROJECT_FIELDS, textFields, validateCaseLayout, type CaseBlockProps, type CaseStudyTemplate } from '@/features/caseStudyTemplates/model';

const options = (fields: ReadonlyArray<{ key: string; label: string }>) => fields.map(field => ({ label: field.label, value: field.key }));
const textOptions = options(textFields);
const imageOptions = options(PROJECT_FIELDS.filter(field => field.type === 'image'));
const preview: ProjectItem = {
  project_id: 1, project_name: 'A sample project', project_description: 'A project story with a clear purpose and useful results.',
  project_image: '', project_type: 'professional', project_company_name: 'Example company', project_priority: null,
  project_features: ['Designed a useful experience', 'Built and shipped the solution'], project_tech_stack: ['React', 'TypeScript'],
  project_problem_faced: 'The main challenge was making a complex workflow feel simple.', project_learning: 'Test the real workflow early.',
  project_start_date: '2025-01-01', project_end_date: null, project_status: 'completed', project_role: 'Developer',
  project_team_size: 3, project_platform: 'Web', project_github: 'https://github.com/', project_link: 'https://example.com/', project_company_website: '',
};

function config(): Config<CaseBlockProps> {
  const render = (type: keyof CaseBlockProps) => (props: Record<string, unknown>) => <CaseStudyBlock type={type} props={props} project={preview} editing/>;
  const styleField = { type: 'select' as const, options: [{ label: 'Heading', value: 'heading' }, { label: 'Body', value: 'body' }, { label: 'Eyebrow', value: 'eyebrow' }] };
  return { root: { render: ({ children }) => <div className="min-h-screen bg-[#0c0c0c] px-4 text-[#f2efe9] sm:px-8">{children}</div> }, components: {
    Hero: { label: 'Project hero', fields: {
      titleField: { type: 'select', label: 'Title field', options: textOptions },
      descriptionField: { type: 'select', label: 'Description field', options: textOptions },
      imageField: { type: 'select', label: 'Cover image field', options: imageOptions },
    }, defaultProps: { titleField: 'project_name', descriptionField: 'project_description', imageField: 'project_image' }, render: render('Hero') },
    Facts: { label: 'Project facts', render: render('Facts') },
    Technologies: { label: 'Technology tags', render: render('Technologies') },
    Features: { label: 'Feature list', fields: { title: { type: 'text' } }, defaultProps: { title: 'What I built' }, render: render('Features') },
    Story: { label: 'Story section', fields: { title: { type: 'text' }, field: { type: 'select', label: 'Project field', options: textOptions } },
      defaultProps: { title: 'Project story', field: 'project_problem_faced' }, render: render('Story') },
    Image: { label: 'Project image', fields: { field: { type: 'select', options: imageOptions }, shape: { type: 'select', options: [{ label: 'Wide', value: 'wide' }, { label: 'Square', value: 'square' }, { label: 'Portrait', value: 'portrait' }] } },
      defaultProps: { field: 'project_image', shape: 'wide' }, render: render('Image') },
    Text: { label: 'Project data text', fields: { field: { type: 'select', options: textOptions }, style: styleField },
      defaultProps: { field: 'project_description', style: 'body' }, render: render('Text') },
    StaticText: { label: 'Custom text', fields: { text: { type: 'textarea' }, style: styleField },
      defaultProps: { text: 'A custom label or introduction', style: 'body' }, render: render('StaticText') },
    Links: { label: 'Project links', render: render('Links') },
    Columns: { label: 'Responsive columns', fields: { balance: { type: 'select', options: [{ label: 'Even', value: 'even' }, { label: 'Wide left', value: 'wide-left' }, { label: 'Wide right', value: 'wide-right' }] },
      left: { type: 'slot', disallow: ['Columns'] }, right: { type: 'slot', disallow: ['Columns'] } }, defaultProps: { balance: 'even', left: [], right: [] },
      render: ({ left: Left, right: Right, balance }) => <CaseStudyBlock type="Columns" props={{ balance }} project={preview} editing children={{ left: <Left minEmptyHeight={100}/>, right: <Right minEmptyHeight={100}/> }}/> },
    Panel: { label: 'Content panel', fields: { tone: { type: 'select', options: [{ label: 'Dark', value: 'dark' }, { label: 'Warm', value: 'warm' }, { label: 'Outline', value: 'outline' }] }, content: { type: 'slot' } },
      defaultProps: { tone: 'dark', content: [] }, render: ({ content: Content, tone }) => <CaseStudyBlock type="Panel" props={{ tone }} project={preview} editing children={{ content: <Content minEmptyHeight={100}/> }}/> },
    Divider: { label: 'Divider', render: render('Divider') },
    Spacer: { label: 'Spacing', fields: { size: { type: 'select', options: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }] } },
      defaultProps: { size: 'medium' }, render: render('Spacer') },
  } };
}

const input = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white';
export default function Designer({ original, onClose, onSaved }: { original: CaseStudyTemplate | null; onClose: () => void; onSaved: () => void }) {
  const [key, setKey] = useState(original?.template_key || '');
  const [name, setName] = useState(original?.display_name || '');
  const [description, setDescription] = useState(original?.description || '');
  const [published, setPublished] = useState(original?.is_published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editorConfig = useMemo(config, []);
  const initial = useMemo(() => original?.layout ?? newCaseLayout(), [original]);
  const save = async (data: Omit<typeof initial, 'schema_version'>) => {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(key) || !name.trim() || name.length > 120 || description.length > 500) {
      setError('Enter a lowercase template key, a name, and a short description.'); return;
    }
    const layout = { ...data, schema_version: 1 as const };
    try { validateCaseLayout(layout); } catch (issue) { setError(issue instanceof Error ? issue.message : 'Invalid layout.'); return; }
    setSaving(true); setError('');
    const patch = { display_name: name.trim(), description: description.trim(), layout, is_published: published, updated_at: new Date().toISOString() };
    const result = original ? await supabase.from('case_study_templates').update(patch).eq('template_key', original.template_key).select('template_key').single() :
      await supabase.from('case_study_templates').insert({ ...patch, template_key: key }).select('template_key').single();
    setSaving(false);
    if (result.error) setError(result.error.message); else onSaved();
  };
  return <div className="mx-auto max-w-[1600px] p-4 text-gray-900 dark:text-white">
    <div className="flex items-start justify-between gap-5"><div><h1 className="text-xl font-semibold">{original ? `Edit ${original.display_name}` : 'New case study template'}</h1><p className="mt-1 text-sm text-gray-500">Arrange blocks, choose project fields, and preview mobile and desktop widths. Changes to a published template affect every assigned project.</p></div><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Close designer</button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-sm">Template key<input value={key} onChange={e => setKey(e.target.value)} disabled={!!original} maxLength={64} className={input}/></label><label className="text-sm">Name<input value={name} onChange={e => setName(e.target.value)} maxLength={120} className={input}/></label><label className="text-sm">Description<input value={description} onChange={e => setDescription(e.target.value)} maxLength={500} className={input}/></label></div>
    <label className="my-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}/>Published and available for projects</label>
    {error && <p role="alert" className="my-3 text-sm text-red-500">{error}</p>}
    <div className="overflow-hidden rounded-xl border border-gray-300 text-gray-900 dark:border-gray-600"><Puck config={editorConfig} data={initial} height="max(460px, calc(100dvh - 245px))" onPublish={data => { if (!saving) void save(data); }}/></div>
  </div>;
}
