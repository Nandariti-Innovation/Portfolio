import { AppDispatch } from "@/StateManagement/Redux/reduxStore";
import { updateFooterSection } from "@/StateManagement/Redux/slices/footer";
import { updateHeroSection } from "@/StateManagement/Redux/slices/herosection";
import { setMentorshipData } from "@/StateManagement/Redux/slices/mentorship";
import { setNavbarData } from "@/StateManagement/Redux/slices/navbar";
import { updateServices } from "@/StateManagement/Redux/slices/services";
import { addSkills } from "@/StateManagement/Redux/slices/skills";
import { updateSocialList } from "@/StateManagement/Redux/slices/socials";
import { setSettingData } from "@/StateManagement/Redux/slices/settings";
import { setHomepageSections } from "@/StateManagement/Redux/slices/homepageSections";
import type { DynamicHomepage } from "@/features/homepageSections/templates";
import type { SettingsType } from "@/StateManagement/Redux/@types";
import supabase from "@/Superbase/client";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

export const useFetchHomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [pageDataLoading, setPageDataLoading] = useState(true);

  const fetchHomePageData = useCallback(async () => {
    setPageDataLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_homepage_payload");
      if (error) throw error;

      const responseData = data as HomepagePayload | null;
      if (!responseData) throw new Error("No homepage data returned.");

      dispatch(addSkills(responseData.skills || []));
      dispatch(setNavbarData(responseData.navbar || []));
      if (responseData.home_hero?.[0]) dispatch(updateHeroSection(responseData.home_hero[0]));
      dispatch(updateServices(responseData.services || []));
      if (responseData.footer?.[0]) dispatch(updateFooterSection(responseData.footer[0]));
      dispatch(updateSocialList(responseData.social || []));
      if (responseData.mentorship?.[0]) dispatch(setMentorshipData(responseData.mentorship[0]));
      dispatch(setSettingData(responseData.settings || []));
      dispatch(setHomepageSections(responseData.dynamic_sections || { sections: [], templates: {} }));
    } catch (error) {
      console.error("Error fetching homepage data:", error);
    } finally {
      setPageDataLoading(false);
    }
  }, [dispatch]);

  return { fetchHomePageData, pageDataLoading };
};

type HomepagePayload = {
  navbar?: unknown[];
  home_hero?: unknown[];
  services?: unknown[];
  footer?: unknown[];
  social?: unknown[];
  mentorship?: unknown[];
  settings?: SettingsType[];
  skills?: unknown[];
  dynamic_sections?: DynamicHomepage;
};
