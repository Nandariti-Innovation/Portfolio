import type { AppDispatch } from "@/StateManagement/Redux/reduxStore";
import { updateFooterSection } from "@/StateManagement/Redux/slices/footer";
import { updateHeroSection } from "@/StateManagement/Redux/slices/herosection";
import { setHomepageSections } from "@/StateManagement/Redux/slices/homepageSections";
import { setNavbarData } from "@/StateManagement/Redux/slices/navbar";
import { addSkills } from "@/StateManagement/Redux/slices/skills";
import { updateSocialList } from "@/StateManagement/Redux/slices/socials";
import type { DynamicHomepage } from "@/features/homepageSections/templates";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

const CACHE_KEY = "portfolio-homepage-payload-v2";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const MEMORY_FRESHNESS = 60 * 1000;

type CachedPayload = {
  cachedAt: number;
  payload: HomepagePayload;
};

let memoryCache: CachedPayload | null = null;
let homepageRequest: Promise<HomepagePayload> | null = null;

function readBrowserCache(): CachedPayload | null {
  if (memoryCache && Date.now() - memoryCache.cachedAt <= CACHE_MAX_AGE) return memoryCache;
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as CachedPayload | null;
    if (!parsed?.payload || Date.now() - parsed.cachedAt > CACHE_MAX_AGE) return null;
    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function writeBrowserCache(payload: HomepagePayload) {
  memoryCache = { cachedAt: Date.now(), payload };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
  } catch {
    // The in-memory cache still protects this session when storage is unavailable.
  }
}

async function requestHomepagePayload(): Promise<HomepagePayload> {
  if (memoryCache && Date.now() - memoryCache.cachedAt <= MEMORY_FRESHNESS) {
    return memoryCache.payload;
  }
  if (homepageRequest) return homepageRequest;

  homepageRequest = (async () => {
    const configuredEndpoint = import.meta.env.VITE_HOMEPAGE_API_URL?.trim();
    const directSupabase = !configuredEndpoint && import.meta.env.DEV;
    const endpoint = configuredEndpoint || (directSupabase
      ? `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_homepage_payload`
      : "/api/homepage");
    const headers = new Headers({ Accept: "application/json" });
    if (directSupabase) {
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      headers.set("apikey", key);
      headers.set("Authorization", `Bearer ${key}`);
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(endpoint, {
      method: directSupabase ? "POST" : "GET",
      headers,
      body: directSupabase ? "{}" : undefined,
      credentials: "omit",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`Homepage request failed with HTTP ${response.status}`);
    const payload = await response.json() as HomepagePayload | null;
    if (!payload || typeof payload !== "object") throw new Error("No homepage data returned.");
    writeBrowserCache(payload);
    return payload;
  })().finally(() => {
    homepageRequest = null;
  });

  return homepageRequest;
}

function applyHomepagePayload(dispatch: AppDispatch, payload: HomepagePayload) {
  dispatch(addSkills(payload.skills || []));
  dispatch(setNavbarData(payload.navbar || []));
  if (payload.home_hero?.[0]) dispatch(updateHeroSection(payload.home_hero[0]));
  if (payload.footer?.[0]) dispatch(updateFooterSection(payload.footer[0]));
  dispatch(updateSocialList(payload.social || []));
  dispatch(setHomepageSections(payload.dynamic_sections || { sections: [], templates: {} }));
}

export const useFetchHomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cached = useRef(readBrowserCache());
  const [pageDataLoading, setPageDataLoading] = useState(!cached.current);

  useEffect(() => {
    let active = true;
    if (cached.current) applyHomepagePayload(dispatch, cached.current.payload);

    void requestHomepagePayload()
      .then((payload) => {
        if (active) applyHomepagePayload(dispatch, payload);
      })
      .catch((error: unknown) => {
        if (!cached.current) console.error("Error fetching homepage data:", error);
      })
      .finally(() => {
        if (active) setPageDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  return { pageDataLoading };
};

type HomepagePayload = {
  navbar?: unknown[];
  home_hero?: unknown[];
  footer?: unknown[];
  social?: unknown[];
  skills?: unknown[];
  dynamic_sections?: DynamicHomepage;
};
