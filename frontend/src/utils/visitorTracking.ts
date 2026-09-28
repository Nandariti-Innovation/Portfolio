type Metadata = Record<string, string | number | boolean | null>;
type LocationData = { ip_address: string | null; country: string | null; country_code: string | null; region: string | null; geo_details: Metadata };
const emptyLocation: LocationData = { ip_address: null, country: null, country_code: null, region: null, geo_details: { geo_status: 'unavailable' } };
const sessionTimeout = 30 * 60 * 1000;
let enabled = false;
let visitorId = '';
let session: { id: string; last: number } | null = null;
let current: { page: string; id: string; campaign: Record<string, string | null> } | null = null;
let geo: Promise<LocationData> | null = null;
let geoRetryAt = 0;
let geoSessionId = '';
let budget: { sessionId: string; keys: string[] } = { sessionId: '', keys: [] };

export const isDashboardRoute = (path: string) => /^\/dashboard(?:\/|$)/i.test(path);
const uuid = () => crypto.randomUUID();
const read = (storage: Storage, key: string) => { try { return storage.getItem(key); } catch { return null; } };
const write = (storage: Storage, key: string, value: string) => { try { storage.setItem(key, value); } catch { /* Memory-only tracking when storage is unavailable. */ } };

function identity() {
  if (!visitorId) {
    visitorId = read(localStorage, 'portfolio_visitor_id') || uuid();
    write(localStorage, 'portfolio_visitor_id', visitorId);
  }
  if (!session) {
    try { session = JSON.parse(read(sessionStorage, 'portfolio_visit') || 'null'); } catch { session = null; }
  }
  if (!session || Date.now() - session.last > sessionTimeout) session = { id: uuid(), last: Date.now() };
  session.last = Date.now();
  write(sessionStorage, 'portfolio_visit', JSON.stringify(session));
  return { visitor_id: visitorId, session_id: session.id };
}

// Reserve before network work: repeated clicks and failed requests cannot flood inserts.
function reserveEvent(sessionId: string, action: 'page_view' | 'resume_view', page: string) {
  if (budget.sessionId !== sessionId) {
    try {
      const saved = JSON.parse(read(sessionStorage, 'portfolio_tracking_budget') || 'null');
      budget = saved?.sessionId === sessionId && Array.isArray(saved.keys)
        ? { sessionId, keys: saved.keys.filter((key: unknown) => typeof key === 'string') }
        : { sessionId, keys: [] };
    } catch { budget = { sessionId, keys: [] }; }
  }
  const key = action === 'resume_view' ? 'resume_view' : `page_view:${page}`;
  if (budget.keys.includes(key)) return false;
  budget.keys.push(key);
  write(sessionStorage, 'portfolio_tracking_budget', JSON.stringify(budget));
  return true;
}

function locationData(): Promise<LocationData> {
  const sessionId = session?.id || '';
  if (geoSessionId !== sessionId) { geo = null; geoRetryAt = 0; geoSessionId = sessionId; }
  if (geo) return geo;
  const url = import.meta.env.VITE_VISITOR_GEO_URL?.trim();
  if (!url) return Promise.resolve({ ...emptyLocation, geo_details: { geo_status: 'not_configured' } });
  try {
    const cached = JSON.parse(read(sessionStorage, 'portfolio_geo') || 'null');
    if (cached?.sessionId === sessionId && cached.url === url && cached.data?.geo_details?.geo_status === 'resolved') {
      geo = Promise.resolve(cached.data as LocationData);
      return geo;
    }
  } catch { /* Ignore invalid cached data. */ }
  if (Date.now() < geoRetryAt) return Promise.resolve(emptyLocation);
  let succeeded = false;
  geo = fetch(url, { signal: AbortSignal.timeout(8000), credentials: 'omit' })
    .then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || typeof data !== 'object' || data.error || data.success === false) throw new Error('Provider returned an error');
      const value = (...paths: string[]) => {
        for (const path of paths) {
          let currentValue: unknown = data;
          for (const key of path.split('.')) {
            if (!currentValue || typeof currentValue !== 'object') { currentValue = null; break; }
            currentValue = (currentValue as Record<string, unknown>)[key];
          }
          if (typeof currentValue === 'string' || typeof currentValue === 'number') return String(currentValue).slice(0, 150);
        }
        return null;
      };
      const ip = value('ip', 'ipAddress');
      const country = value('country_name', 'country', 'countryName');
      const code = value('country_code', 'countryCode');
      if (!ip && !country && !code) throw new Error('Provider response has no IP or country fields');
      succeeded = true;
      const result: LocationData = { ip_address: ip, country, country_code: code, region: value('region', 'regionName'),
        geo_details: {
          geo_status: 'resolved',
          continent: value('continent'),
          continent_code: value('continent_code'),
          region_code: value('region_code'),
          city: value('city', 'cityName'),
          latitude: value('latitude'),
          longitude: value('longitude'),
          postal_code: value('postal'),
          timezone: value('timezone.id', 'timezone'),
          timezone_abbr: value('timezone.abbr'),
          timezone_utc: value('timezone.utc'),
          network_org: value('connection.org', 'org', 'asnOrganization'),
          isp: value('connection.isp'),
          network_domain: value('connection.domain'),
          asn: value('connection.asn', 'asn'),
          flag_emoji: value('flag.emoji'),
        } };
      write(sessionStorage, 'portfolio_geo', JSON.stringify({ sessionId, url, data: result }));
      return result;
    })
    .catch((error: unknown) => {
      geoRetryAt = Date.now() + 60000;
      // Report the category, never the visitor's IP or the provider URL/key.
      const reason = error instanceof Error && /^HTTP \d{3}$/.test(error.message) ? error.message
        : error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network or provider response';
      console.warn('Visitor geolocation unavailable:', reason, '— retrying on an event after 60 seconds.');
      return emptyLocation;
    })
    .finally(() => { if (!succeeded) geo = null; });
  return geo;
}

export function getVisitorData() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const tablet = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua));
  let referrer: string | null = null;
  try { const url = new URL(document.referrer); if (url.origin !== location.origin) referrer = url.hostname; } catch { /* Direct or unavailable referrer. */ }
  return { ...identity(), browser, os, device_type: tablet ? 'tablet' : /Mobi|iPhone/.test(ua) ? 'mobile' : 'desktop', language: navigator.language,
    viewport_width: window.innerWidth, viewport_height: window.innerHeight, referrer_host: referrer };
}

async function trackEvent(action: 'page_view' | 'resume_view') {
  if (!enabled || !current || isDashboardRoute(location.pathname)) return;
  try {
    const visitor = getVisitorData();
    if (!reserveEvent(visitor.session_id, action, current.page)) return;
    const record = { ...visitor, ...current.campaign, event_id: uuid(), page_view_id: current.id, page: current.page,
      action, created_at: new Date().toISOString() };
    const locationInfo = await locationData();
    // Dashboard navigation or login can happen during geolocation. Discard in that case.
    if (!enabled || isDashboardRoute(location.pathname)) return;
    const { geo_details, ...locationColumns } = locationInfo;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const response = await fetch(`${supabaseUrl}/rest/v1/visitor_logs`, {
      method: 'POST',
      credentials: 'omit',
      keepalive: true,
      headers: {
        apikey: publicKey,
        Authorization: `Bearer ${publicKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ ...record, ...locationColumns, metadata: geo_details }),
    });
    if (!response.ok) console.warn('Visitor tracking failed:', response.status); // Never log visitor details.
  } catch { /* Analytics must never interrupt the website. */ }
}

export function setVisitorRoute(path: string, search: string) {
  const permitted = !isDashboardRoute(path)
    && (!import.meta.env.DEV || import.meta.env.VITE_TRACK_VISITORS_IN_DEV === 'true');
  if (!permitted) { enabled = false; current = null; return; }
  enabled = true;
  if (current?.page === path) return; // Strict Mode and hash changes do not duplicate page views.
  const params = new URLSearchParams(search);
  current = { page: path, id: uuid(), campaign: Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign'].map(key => [key, params.get(key)?.slice(0, 150) || null])) };
  void trackEvent('page_view');
}

export function attachResumeTracking() {
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a');
    if (!anchor || !anchor.hasAttribute('href')) return;
    const label = [anchor.textContent, anchor.getAttribute('aria-label'), anchor.getAttribute('title')].filter(Boolean).join(' ');
    if (anchor.dataset.track === 'resume' || /\bresume\b|résumé/i.test(label)) {
      void trackEvent('resume_view');
    }
  };
  document.addEventListener('click', click, true);
  return () => document.removeEventListener('click', click, true);
}
