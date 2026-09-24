# Homepage performance and cleanup

Date: 2026-09-23

## What changed

The public and dashboard applications now have separate lazy route boundaries.
`DashboardAccessProvider`, Supabase Auth, membership checks, permission checks,
MFA checks, dashboard reducers, and dashboard editors are loaded only for
`/dashboard/*`. Project data is similarly isolated behind the project routes.

The homepage owns its data hook, so `get_homepage_payload()` runs only when `/`
is mounted. A module-level in-flight promise deduplicates Strict Mode and remount
requests. The browser applies a valid local cache immediately and refreshes it in
the background.

Visitor analytics no longer creates a Supabase client or Auth subscription.
Tracking begins after the first render using `requestIdleCallback` (with a timer
fallback), skips dashboard routes, and writes through the anonymous REST API.

The contact modal, Three.js scene, About, dynamic sections, and Contact section
are lazy-loaded. The original 59 MB character-model fallback was removed; the
optimized model remains the only model source.

## Homepage data path

Production uses `GET /api/homepage`, implemented by
`frontend/netlify/functions/homepage-payload.ts`. Development calls the same
Supabase RPC directly unless `VITE_HOMEPAGE_API_URL` is provided.

The endpoint requires these Netlify environment variables:

- `SUPABASE_URL` (or the existing `VITE_SUPABASE_URL` fallback)
- `SUPABASE_PUBLISHABLE_KEY` (or the existing `VITE_SUPABASE_ANON_KEY` fallback)

The public RPC now returns only:

- `navbar`
- `home_hero`
- `skills`
- `footer`
- `social`
- `dynamic_sections`

The production verification payload was 15,164 bytes at migration time. Legacy
services, mentorship, settings, projects, experience, testimonials, blogs, and
legacy section properties are no longer part of this response.

## Cache layers

| Layer | Policy | Purpose |
| --- | --- | --- |
| Netlify durable CDN | 60 seconds fresh, 300 seconds stale-while-revalidate | Keep Supabase latency away from most visitor requests |
| Browser HTTP cache | 60 seconds fresh, 300 seconds stale-while-revalidate | Reuse recent endpoint responses |
| In-memory request cache | 60 seconds | Avoid same-session remount requests |
| Local storage payload | Up to 24 hours, refreshed in background | Render returning visits immediately |
| Hashed assets and fonts | 1 year, immutable | Long-term caching for versioned static assets |

The browser cache key is versioned as `portfolio-homepage-payload-v2`; increment
it when the payload shape changes incompatibly. Deploying a new hashed asset URL
automatically invalidates the immutable asset cache.

## Fonts and static assets

DM Mono, Manrope, and Playfair Display are self-hosted as WOFF2 files with
`font-display: swap`. Only the weights used by the reachable application are
included. Google Fonts is no longer contacted during page startup.

`public/Images/` and `public/threejsobjects/person/model.glb` were removed because
the reachable application uses Supabase Storage content and the optimized model.
`frontend/public/netlify.toml` was intentionally preserved. The active Netlify
build configuration is also present at `frontend/netlify.toml`.

## Database migration

The applied migrations are:

- `20260923072119_homepage_performance_cleanup.sql`
- `20260923074443_rls_template_policy_cleanup.sql`

They:

- remove the retired `mentorship` table and unused legacy `homepage_data` view;
- add the `services.services_id` primary key;
- add indexes for `dashboard_role_permissions.permission_key` and
  `dashboard_users.role_key`;
- replace `get_homepage_payload()` with the reduced contract;
- wrap Auth calls in RLS policies as statement initplans;
- consolidate authenticated/public template reads without changing which rows
  each role can read.

After migration, the Supabase performance advisor reported zero RLS initplan or
multiple-permissive-policy warnings. Remaining informational notices identify
indexes that have not yet accumulated usage statistics and should not be removed
immediately.

## Verification

From `frontend/`:

```sh
npm run typecheck
npm run lint:ci
npm run build
```

The production `dist/index.html` should preload only the framework and Vite
runtime chunks. It must not preload `supabase-vendor`, `three-vendor`, or a
dashboard chunk. Those assets should appear only in lazy dependency maps.

For browser verification, load `/` with an empty cache and confirm:

1. exactly one `/api/homepage` request;
2. no Auth user, membership, permission, or MFA requests;
3. no dashboard or Supabase vendor download;
4. analytics starts after the initial render;
5. a repeat visit renders cached content before the background refresh finishes.
