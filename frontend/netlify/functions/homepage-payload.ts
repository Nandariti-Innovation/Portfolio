const browserCache = "public, max-age=60, stale-while-revalidate=300";
const cdnCache = "public, durable, s-maxage=60, stale-while-revalidate=300";

export default async function homepagePayload(request: Request) {
  if (request.method !== "GET") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store" } },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !publicKey) {
    return Response.json(
      { error: "Homepage data source is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/rest/v1/rpc/get_homepage_payload`, {
      method: "POST",
      headers: {
        apikey: publicKey,
        Authorization: `Bearer ${publicKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      return Response.json(
        { error: "Homepage data is temporarily unavailable" },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return new Response(await upstream.text(), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": browserCache,
        "Netlify-CDN-Cache-Control": cdnCache,
        "Cache-Tag": "homepage-payload",
      },
    });
  } catch {
    return Response.json(
      { error: "Homepage data is temporarily unavailable" },
      { status: 504, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const config = { path: "/api/homepage" };
