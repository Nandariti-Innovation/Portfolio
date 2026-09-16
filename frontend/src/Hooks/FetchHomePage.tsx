import { AppDispatch } from "@/StateManagement/Redux/reduxStore";
import { setExperienceData } from "@/StateManagement/Redux/slices/experience";
import { updateFooterSection } from "@/StateManagement/Redux/slices/footer";
import { updateHeroSection } from "@/StateManagement/Redux/slices/herosection";
import { setMentorshipData } from "@/StateManagement/Redux/slices/mentorship";
import { setNavbarData } from "@/StateManagement/Redux/slices/navbar";
import { setFeatureProjectdata } from "@/StateManagement/Redux/slices/projects";
import { updateServices } from "@/StateManagement/Redux/slices/services";
import { addSkills } from "@/StateManagement/Redux/slices/skills";
import { updateSocialList } from "@/StateManagement/Redux/slices/socials";
import { setSettingData } from "@/StateManagement/Redux/slices/settings";
import { setHomepageBlogs, type HomepageBlog } from "@/StateManagement/Redux/slices/homepageBlogs";
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
      dispatch(setExperienceData(responseData.work_experience || []));
      if (responseData.mentorship?.[0]) dispatch(setMentorshipData(responseData.mentorship[0]));
      dispatch(setFeatureProjectdata(responseData.projects || []));
      dispatch(setSettingData(responseData.settings || []));
      dispatch(setHomepageBlogs(responseData.blogs || []));
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
  work_experience?: unknown[];
  mentorship?: unknown[];
  projects?: unknown[];
  settings?: unknown[];
  skills?: unknown[];
  blogs?: HomepageBlog[];
};
