import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { ArrowUpRight, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BreakdownItem, DailyPoint, EnquiryRow } from './analytics';

const card = 'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';
const palette = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981'];

export function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: ComponentType<LucideProps> }) {
  return <article className={`${card} p-5`}>
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{value.toLocaleString()}</p></div>
      <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon size={20} /></span>
    </div>
    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
  </article>;
}

export function BreakdownCard({ title, subtitle, items }: { title: string; subtitle: string; items: BreakdownItem[] }) {
  const max = Math.max(1, ...items.map(item => item.value));
  return <section className={`${card} p-5`}>
    <div className="mb-5"><h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p></div>
    <div className="space-y-4">{items.length ? items.map(item => <div key={item.label}>
      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm"><span className="truncate text-gray-700 dark:text-gray-200" title={item.label}>{item.label}</span><span className="font-semibold tabular-nums text-gray-900 dark:text-white">{item.value}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, item.value / max * 100)}%` }} /></div>
    </div>) : <EmptyData />}</div>
  </section>;
}

export function DailyChart({ points }: { points: DailyPoint[] }) {
  const max = Math.max(1, ...points.map(point => point.views));
  return <section className={`${card} p-5 sm:p-6`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900 dark:text-white">Traffic trend</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Page views and unique visitors over the last 14 days</p></div><div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-primary" />Views</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-violet-500" />Visitors</span></div></div>
    <div className="mt-6 flex h-52 items-end gap-1.5 border-b border-gray-200 dark:border-gray-700">{points.map((point, index) => <div key={point.key} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
      <div className="relative mx-auto flex h-[170px] w-full max-w-8 items-end justify-center gap-0.5"><span title={`${point.views} page views`} className="w-1/2 rounded-t bg-primary transition-opacity group-hover:opacity-75" style={{ height: point.views ? `${Math.max(5, point.views / max * 100)}%` : 0 }} /><span title={`${point.visitors} visitors`} className="w-1/2 rounded-t bg-violet-500/80 transition-opacity group-hover:opacity-75" style={{ height: point.visitors ? `${Math.max(5, point.visitors / max * 100)}%` : 0 }} /></div>
      <span className="h-7 pt-2 text-center text-[9px] text-gray-400">{index % 2 === 0 ? point.label : ''}</span>
    </div>)}</div>
  </section>;
}

export function DeviceCard({ items }: { items: BreakdownItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const stops = items.map((item, index) => {
    const start = cursor;
    cursor += total ? item.value / total * 100 : 0;
    return `${palette[index]} ${start}% ${cursor}%`;
  }).join(', ');
  return <section className={`${card} p-5`}>
    <h2 className="font-semibold text-gray-900 dark:text-white">Devices</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Page views by device type</p>
    {total ? <div className="mt-6 flex items-center gap-6"><div className="grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${stops})` }}><div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center dark:bg-gray-800"><span className="text-lg font-bold text-gray-900 dark:text-white">{total}</span></div></div><div className="min-w-0 flex-1 space-y-2.5">{items.map((item, index) => <div key={item.label} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-300"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette[index] }} /><span className="truncate capitalize">{item.label}</span></span><strong className="tabular-nums text-gray-900 dark:text-white">{Math.round(item.value / total * 100)}%</strong></div>)}</div></div> : <div className="pt-8"><EmptyData /></div>}
  </section>;
}

export function RecentEnquiries({ rows }: { rows: EnquiryRow[] }) {
  return <section className={`${card} p-5`}>
    <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="font-semibold text-gray-900 dark:text-white">Recent enquiries</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Latest contact form submissions</p></div><Link to="/dashboard/queries" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowUpRight size={14} /></Link></div>
    {rows.length ? <div className="divide-y divide-gray-100 dark:divide-gray-700">{rows.slice(0, 5).map(row => {
      const payload = row.payload || {};
      const date = new Date(row.created_at);
      return <article key={row.id} className="flex items-center gap-3 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">{(payload.name || '?').slice(0, 1)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900 dark:text-white">{payload.name || 'Unnamed sender'}</p><p className="truncate text-xs text-gray-500 dark:text-gray-400">{payload.company || payload.email || 'No company supplied'}</p></div><div className="text-right"><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-200">{payload.type || 'other'}</span><time className="mt-1 block text-[10px] text-gray-400">{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString()}</time></div></article>;
    })}</div> : <EmptyData label="No enquiries yet" />}
  </section>;
}

function EmptyData({ label = 'No data in this period' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400"><Inbox size={17} />{label}</div>;
}
