import { useEffect, useMemo, useState } from 'react';
import { Activity, Eye, FileText, Loader2, MessageSquare, RefreshCw, Users } from 'lucide-react';
import { useDashboardUi } from '@/features/dashboardUi/DashboardUi';
import supabase from '@/Superbase/client';
import { buildDashboardAnalytics, type EnquiryRow, type VisitorRow } from './analytics';
import { BreakdownCard, DailyChart, DeviceCard, MetricCard, RecentEnquiries } from './OverviewComponents';

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export default function Dashboard() {
  const { collapsed } = useDashboardUi();
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [enquiryTotal, setEnquiryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const [visitorResult, enquiryResult] = await Promise.all([
          supabase.from('visitor_logs')
            .select('created_at, action, page, visitor_id, session_id, ip_address, country, country_code, region, referrer_host, utm_source, device_type, browser, metadata')
            .gte('created_at', thirtyDaysAgo())
            .order('created_at', { ascending: false })
            .limit(2000),
          supabase.from('portfolio_contact_requests')
            .select('id, created_at, resend_id, payload', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(100),
        ]);
        if (visitorResult.error) throw new Error('Unable to read visitor analytics.');
        if (enquiryResult.error) throw new Error('Unable to read portfolio enquiries.');
        if (cancelled) return;
        setVisitors((visitorResult.data || []) as unknown as VisitorRow[]);
        setEnquiries((enquiryResult.data || []) as unknown as EnquiryRow[]);
        setEnquiryTotal(enquiryResult.count || 0);
      } catch (failure) {
        if (!cancelled) setError(failure instanceof Error ? failure.message : 'Unable to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadDashboard();
    return () => { cancelled = true; };
  }, [refresh]);

  const analytics = useMemo(() => buildDashboardAnalytics(visitors), [visitors]);
  const width = collapsed ? 'w-[calc(100vw-70px)]' : 'w-[calc(100vw-240px)]';

  return <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-800 dark:bg-darkthemebg dark:text-gray-100 ${width}`}>
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Portfolio traffic from the last 30 days and your latest enquiries.</p></div>
        <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)} className="flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>
      </header>

      {loading ? <div className="flex items-center justify-center gap-3 py-28 text-gray-500 dark:text-gray-300"><Loader2 size={22} className="animate-spin" />Loading analytics…</div> : error ? <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}<button type="button" onClick={() => setRefresh(value => value + 1)} className="ml-3 cursor-pointer underline">Retry</button></div> : <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Visitors" value={analytics.uniqueVisitors} detail="Unique visitors" icon={Users} />
          <MetricCard label="Sessions" value={analytics.sessions} detail="30-minute sessions" icon={Activity} />
          <MetricCard label="Page views" value={analytics.pageViews} detail="One entry per route and session" icon={Eye} />
          <MetricCard label="Résumé views" value={analytics.resumeViews} detail="Unique résumé clicks per session" icon={FileText} />
          <MetricCard label="Enquiries" value={enquiryTotal} detail="All saved contact requests" icon={MessageSquare} />
        </section>

        {visitors.length === 2000 && <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">Analytics reached the 2,000-row display limit. The charts show the newest records in the selected period.</p>}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <DailyChart points={analytics.daily} />
          <BreakdownCard title="Top pages" subtitle="Most viewed public routes" items={analytics.pages} />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <BreakdownCard title="Traffic sources" subtitle="Campaign source, referring site, or direct visit" items={analytics.sources} />
          <BreakdownCard title="Countries" subtitle="Page views grouped by visitor country" items={analytics.countries} />
          <DeviceCard items={analytics.devices} />
          <BreakdownCard title="Networks" subtitle="Internet providers reported by IPWHOIS" items={analytics.networks} />
          <div className="md:col-span-2"><RecentEnquiries rows={enquiries} /></div>
        </div>
      </>}
    </div>
  </main>;
}
