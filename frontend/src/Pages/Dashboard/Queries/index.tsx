import { useEffect, useState } from 'react';
import { Inbox, Loader2, RefreshCw, Search } from 'lucide-react';
import { useDashboardUi } from '@/features/dashboardUi/DashboardUi';
import supabase from '@/Superbase/client';

type Query = { id: string; created_at: string; resend_id: string | null; payload: { name?: string; email?: string; company?: string; type?: string; message?: string } };
const control = 'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';
const pageSize = 20;

export default function Queries() {
  const { collapsed } = useDashboardUi();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [rows, setRows] = useState<Query[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => { setTerm(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    async function load() {
      try {
        let query = supabase.from('portfolio_contact_requests')
          .select('id, created_at, payload, resend_id', { count: 'exact' })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false });
        if (type !== 'all') query = query.eq('payload->>type', type);
        if (term) {
          // Quote filter values so punctuation cannot change the PostgREST filter.
          const pattern = JSON.stringify('%' + term.replace(/[\\%_]/g, '\\$&') + '%');
          query = query.or(['name', 'email', 'company', 'message']
            .map(field => `payload->>${field}.ilike.${pattern}`).join(','));
        }
        const { data, count: matched, error: failure } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
        if (cancelled) return;
        if (failure) throw new Error('Unable to load enquiries. Please check your login and try again.');
        const count = matched || 0;
        if (page > 0 && page * pageSize >= count) { setPage(Math.max(0, Math.ceil(count / pageSize) - 1)); return; }
        setRows(Array.isArray(data) ? data as Query[] : []);
        setTotal(count);
      } catch (failure) {
        if (!cancelled) { setRows([]); setError(failure instanceof Error ? failure.message : 'Unable to load enquiries.'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [page, term, type, refresh]);

  return (
    <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-800 dark:bg-darkthemebg dark:text-gray-100 ${collapsed ? 'w-[calc(100vw-70px)]' : 'w-[calc(100vw-240px)]'}`}>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-3xl font-bold">Queries</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Hiring, freelance projects, and messages received through your portfolio.</p></div>
          <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)} className="flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>
        </header>
        <div className="mb-5 flex flex-wrap gap-3">
          <label className="relative min-w-0 flex-1"><span className="sr-only">Search enquiries</span><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="search" value={search} maxLength={200} onChange={event => setSearch(event.target.value)} placeholder="Search name, email, company, or message…" className={`${control} w-full min-w-[180px] !pl-9`} /></label>
          <label><span className="sr-only">Enquiry type</span><select value={type} onChange={event => { setType(event.target.value); setPage(0); }} className={control}><option value="all">All enquiries</option><option value="hiring">Hiring</option><option value="freelancing">Freelancing</option><option value="other">Other</option></select></label>
        </div>
        <div aria-live="polite" aria-busy={loading}>
          {loading ? <div className="flex justify-center gap-3 py-20 text-gray-500"><Loader2 className="animate-spin" size={20} />Loading enquiries…</div> : error ? <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-5 text-sm leading-6 text-red-800">{error}<button type="button" onClick={() => setRefresh(value => value + 1)} className="ml-3 cursor-pointer underline">Retry</button></div> : rows.length === 0 ? <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-600"><Inbox className="mx-auto mb-4 text-gray-400" size={32} /><h2 className="text-lg font-medium">{term || type !== 'all' ? 'No matching enquiries' : 'No enquiries yet'}</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{term || type !== 'all' ? 'Try another search or enquiry type.' : 'Contact form submissions will appear here once they are saved.'}</p></div> : <>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-300">{total} {total === 1 ? 'enquiry' : 'enquiries'} · Newest first · Times shown in your local timezone</p>
            <div className="space-y-3">{rows.map(row => <QueryCard key={row.id} query={row} />)}</div>
            <nav aria-label="Enquiry pages" className="mt-5 flex items-center justify-between gap-3 text-sm"><button disabled={page === 0} onClick={() => setPage(value => value - 1)} className={`${control} cursor-pointer disabled:opacity-40`}>Previous</button><span>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span><button disabled={(page + 1) * pageSize >= total} onClick={() => setPage(value => value + 1)} className={`${control} cursor-pointer disabled:opacity-40`}>Next</button></nav>
          </>}
        </div>
      </div>
    </main>
  );
}

function QueryCard({ query }: { query: Query }) {
  const payload = query.payload || {};
  const date = new Date(query.created_at);
  const email = payload.email || '';
  const canReply = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-800">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="break-words text-base font-semibold">{payload.name || 'Unnamed sender'}</h2><p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-300">{email}</p>{payload.company && <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{payload.company}</p>}</div>
      <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-3 py-1 capitalize text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">{payload.type || 'Other'}</span><span className={`rounded-full px-3 py-1 ${query.resend_id ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'}`}>{query.resend_id ? 'Email accepted by Resend' : 'Saved · Email unconfirmed'}</span></div>
    </div>
    <details className="mt-4"><summary className="cursor-pointer text-sm font-medium text-primary">View message</summary><p className="mt-3 whitespace-pre-wrap break-words rounded-md bg-gray-50 p-4 text-sm leading-7 dark:bg-gray-900/50">{payload.message || 'No message provided.'}</p></details>
    <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-gray-100 pt-3 text-xs dark:border-gray-700"><time dateTime={query.created_at} className="text-gray-500 dark:text-gray-300">{Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString()}</time>{canReply && <a href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: Portfolio enquiry — ${payload.type || 'Other'}`)}`} className="font-medium text-primary hover:underline">Reply by email ↗</a>}</div>
  </article>;
}
