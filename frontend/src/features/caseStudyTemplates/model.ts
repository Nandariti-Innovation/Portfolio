import type { Data, Slot } from '@puckeditor/core';
import type { ProjectItem } from '@/StateManagement/Redux/@types';

export type CaseBlockProps = {
  Hero: { titleField: string; descriptionField: string; imageField: string };
  Facts: Record<string, never>;
  Technologies: Record<string, never>;
  Features: { title: string };
  Story: { title: string; field: string };
  Image: { field: string; shape: 'wide' | 'square' | 'portrait' };
  Text: { field: string; style: 'heading' | 'body' | 'eyebrow' };
  StaticText: { text: string; style: 'heading' | 'body' | 'eyebrow' };
  Links: Record<string, never>;
  Columns: { left: Slot; right: Slot; balance: 'even' | 'wide-left' | 'wide-right' };
  Panel: { content: Slot; tone: 'dark' | 'warm' | 'outline' };
  Divider: Record<string, never>;
  Spacer: { size: 'small' | 'medium' | 'large' };
};
export type CaseBlock = keyof CaseBlockProps;
export type CaseLayout = Data<CaseBlockProps> & { schema_version: 1 };
export type CaseStudyTemplate = { template_key: string; display_name: string; description: string; layout: CaseLayout; is_published: boolean; updated_at?: string };

// These are the project columns available to a case study. The editor and the
// public renderer share this allowlist, never arbitrary property paths or HTML.
export const PROJECT_FIELDS = [
  { key: 'project_name', label: 'Project name', type: 'text' },
  { key: 'project_description', label: 'Description', type: 'text' },
  { key: 'project_problem_faced', label: 'Challenges', type: 'text' },
  { key: 'project_learning', label: 'Learning', type: 'text' },
  { key: 'project_role', label: 'Role', type: 'text' },
  { key: 'project_company_name', label: 'Company', type: 'text' },
  { key: 'project_platform', label: 'Platform', type: 'text' },
  { key: 'project_type', label: 'Project type', type: 'text' },
  { key: 'project_status', label: 'Status', type: 'text' },
  { key: 'project_start_date', label: 'Start date', type: 'date' },
  { key: 'project_end_date', label: 'End date', type: 'date' },
  { key: 'project_team_size', label: 'Team size', type: 'number' },
  { key: 'project_image', label: 'Cover image', type: 'image' },
  { key: 'project_features', label: 'Features', type: 'list' },
  { key: 'project_tech_stack', label: 'Tech stack', type: 'list' },
  { key: 'project_link', label: 'Live project', type: 'url' },
  { key: 'project_github', label: 'GitHub', type: 'url' },
  { key: 'project_company_website', label: 'Company website', type: 'url' },
] as const satisfies ReadonlyArray<{ key: keyof ProjectItem; label: string; type: string }>;
export const textFields = PROJECT_FIELDS.filter(field => ['text', 'date', 'number'].includes(field.type));
export const fieldValue = (project: ProjectItem, field: string): unknown =>
  PROJECT_FIELDS.some(item => item.key === field) ? project[field as keyof ProjectItem] : null;

const block = (type: CaseBlock, props: Record<string, unknown>) => ({ type, props: { id: `${type}-${crypto.randomUUID()}`, ...props } });
export function newCaseLayout(): CaseLayout {
  return { schema_version: 1, root: {}, content: [
    block('Hero', { titleField: 'project_name', descriptionField: 'project_description', imageField: 'project_image' }),
    block('Facts', {}), block('Technologies', {}), block('Features', { title: 'What I built' }),
    block('Story', { title: 'The challenges', field: 'project_problem_faced' }),
    block('Story', { title: 'What I learned', field: 'project_learning' }), block('Links', {}),
  ] } as CaseLayout;
}

const supported = new Set<CaseBlock>(['Hero', 'Facts', 'Technologies', 'Features', 'Story', 'Image', 'Text', 'StaticText', 'Links', 'Columns', 'Panel', 'Divider', 'Spacer']);
export function validateCaseLayout(value: unknown): asserts value is CaseLayout {
  if (!value || typeof value !== 'object' || JSON.stringify(value).length > 60000) throw new Error('The layout is too large.');
  const data = value as Partial<CaseLayout>;
  if (data.schema_version !== 1 || !Array.isArray(data.content) || data.content.length < 1 || data.content.length > 60)
    throw new Error('Add at least one block to the case study layout.');
  let count = 0;
  const ids = new Set<string>();
  const visit = (nodes: unknown, depth: number) => {
    if (!Array.isArray(nodes) || depth > 6) throw new Error('Too many nested blocks.');
    for (const node of nodes) {
      count++;
      if (count > 100 || !node || typeof node !== 'object') throw new Error('Too many layout blocks.');
      const item = node as { type: CaseBlock; props: Record<string, unknown> };
      if (!supported.has(item.type) || !item.props || typeof item.props !== 'object') throw new Error('Unsupported layout block.');
      if (typeof item.props.id !== 'string' || ids.has(item.props.id)) throw new Error('Invalid or duplicate block ID.');
      ids.add(item.props.id);
      const props = item.props;
      for (const key of ['field', 'titleField', 'descriptionField', 'imageField']) {
        if (props[key] !== undefined && !PROJECT_FIELDS.some(field => field.key === props[key]))
          throw new Error(`Unknown project data field in ${item.type}.`);
      }
      if (['Story', 'Features', 'StaticText'].includes(item.type)) {
        for (const key of ['title', 'text']) if (typeof props[key] === 'string' && props[key].length > 500)
          throw new Error('Block text is too long.');
      }
      if (item.type === 'Columns') { visit(props.left, depth + 1); visit(props.right, depth + 1); }
      if (item.type === 'Panel') visit(props.content, depth + 1);
    }
  };
  visit(data.content, 0);
}
