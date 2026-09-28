import { Provider } from "react-redux";
import ProjectPage from "@/Pages/ProjectPage";
import Sitemap from "@/Pages/Sitemap";
import { projectStore } from "@/StateManagement/Redux/projectStore";

export function ProjectArchiveRoute() {
  return <Provider store={projectStore}><ProjectPage /></Provider>;
}

export function SitemapRoute() {
  return <Provider store={projectStore}><Sitemap /></Provider>;
}
