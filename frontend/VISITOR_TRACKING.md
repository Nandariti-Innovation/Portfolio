# Visitor page views

Source: src/utils/visitorTracking.ts, mounted through VisitorTracker in the router.

Only page_view and resume_view rows are inserted in the existing visitor_logs table. Each public pathname navigation records a view; rerenders, Strict Mode effect replay, query-string-only changes, and hash changes do not create additional views. Reloading a page records a new view. Resume links are recognized by their text, accessible label, title (resume/résumé), or data-track="resume". A resume_view means a link click, not proof the document loaded. Unrelated PDF links are not counted. There are no duration timers, engagement, project-click, model-loading, or contact-submission events. Existing historical rows are unchanged.

Dashboard routes (including login), Redux-authenticated users, and existing Supabase Auth sessions are excluded. Tracking waits for initial auth state. Development tracking requires VITE_TRACK_VISITORS_IN_DEV=true.

Page views contain browser/session identifiers, pathname, campaign tags, browser/device/OS, language, viewport, referrer hostname, and timestamp. When VITE_VISITOR_GEO_URL is configured, a successful lookup adds public IP, country, country code, region, and selected location details in metadata. Failed lookups log a category without private data and retry on a subsequent page view after 60 seconds. No periodic retries run.

Uses the existing visitor_logs table and its existing insert permissions; no new tables or database functions. Network failures do not interrupt the page. Historical rows are not backfilled.

Checks: node --test tests/visitor-tracking.test.cjs

## Deduplicated page views

Each public pathname creates at most one page_view insert attempt per tab session. Staying on / produces no more rows. Refreshing or revisiting / in that session is skipped. A different public pathname can create its own page_view. Resume clicks produce at most one resume_view per session. No duration, engagement timers, background polling, or other events exist.

Session bookkeeping is persisted in sessionStorage with a 30-minute inactivity timeout based on tracked activity. Separate tabs, expired sessions, or cleared storage may create new entries. Failed inserts count as attempts and are not automatically retried. When storage is unavailable, deduplication lasts only until reload.

Successful geolocation is cached across refreshes for the same session and provider URL. These metrics represent unique page visits per session, not all refreshes. Existing historical rows are preserved. Reduced writes do not guarantee that storage can grow indefinitely on a free plan.
