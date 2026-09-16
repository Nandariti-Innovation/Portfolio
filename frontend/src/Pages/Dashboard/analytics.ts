export type VisitorRow = {
  created_at: string;
  action: string | null;
  page: string | null;
  visitor_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  referrer_host: string | null;
  utm_source: string | null;
  device_type: string | null;
  browser: string | null;
  metadata: Record<string, unknown> | null;
};

export type EnquiryRow = {
  id: string;
  created_at: string;
  resend_id: string | null;
  payload: {
    name?: string;
    email?: string;
    company?: string;
    type?: string;
    message?: string;
  } | null;
};

export type BreakdownItem = { label: string; value: number };
export type DailyPoint = { key: string; label: string; views: number; visitors: number };

export type DashboardAnalytics = {
  uniqueVisitors: number;
  sessions: number;
  pageViews: number;
  resumeViews: number;
  daily: DailyPoint[];
  pages: BreakdownItem[];
  countries: BreakdownItem[];
  sources: BreakdownItem[];
  devices: BreakdownItem[];
  networks: BreakdownItem[];
};

const topItems = (values: string[], limit = 5): BreakdownItem[] => {
  const counts = new Map<string, number>();
  values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
};

const validDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function buildDashboardAnalytics(rows: VisitorRow[]): DashboardAnalytics {
  const pageRows = rows.filter(row => row.action === 'page_view');
  const resumeViews = rows.filter(row => row.action === 'resume_view').length;
  const visitorKeys = rows.map(row => row.visitor_id || row.ip_address).filter((value): value is string => Boolean(value));
  const sessionKeys = rows.map(row => row.session_id).filter((value): value is string => Boolean(value));

  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      views: 0,
      visitors: new Set<string>(),
    };
  });
  const dailyMap = new Map(daily.map(item => [item.key, item]));
  pageRows.forEach(row => {
    const date = validDate(row.created_at);
    if (!date) return;
    const item = dailyMap.get(date.toISOString().slice(0, 10));
    if (!item) return;
    item.views += 1;
    const visitor = row.visitor_id || row.ip_address;
    if (visitor) item.visitors.add(visitor);
  });

  const network = (row: VisitorRow) => {
    const value = row.metadata?.network_org;
    return typeof value === 'string' && value.trim() ? value : 'Unknown network';
  };

  return {
    uniqueVisitors: new Set(visitorKeys).size,
    sessions: new Set(sessionKeys).size,
    pageViews: pageRows.length,
    resumeViews,
    daily: daily.map(item => ({ key: item.key, label: item.label, views: item.views, visitors: item.visitors.size })),
    pages: topItems(pageRows.map(row => row.page || 'Unknown page')),
    countries: topItems(pageRows.map(row => row.country || 'Unknown country')),
    sources: topItems(pageRows.map(row => row.utm_source || row.referrer_host || 'Direct')),
    devices: topItems(pageRows.map(row => row.device_type || 'Unknown device'), 4),
    networks: topItems(pageRows.map(network)),
  };
}
