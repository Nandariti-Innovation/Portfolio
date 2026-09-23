import { useContext, useMemo } from "react";
import { BookOpenText, BriefcaseBusiness, ExternalLink, FilePenLine, Image, Inbox, LayoutDashboard, Menu, Moon, Rocket, Settings, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";
import { useDashboardAccess } from "@/features/dashboardAccess/DashboardAccess";

const sections = [
  { test: (path: string) => /^\/dashboard\/blogs\/new\/?$/.test(path), title: "New story", section: "Blogs", icon: FilePenLine },
  { test: (path: string) => /^\/dashboard\/blogs\/[^/]+\/edit\/?$/.test(path), title: "Edit story", section: "Blogs", icon: FilePenLine },
  { test: (path: string) => /^\/dashboard\/blogs\/[^/]+\/preview\/?$/.test(path), title: "Story preview", section: "Blogs", icon: BookOpenText },
  { test: (path: string) => /^\/dashboard\/queries\/?$/.test(path), title: "Queries", section: "Inbox", icon: Inbox },
  { test: (path: string) => /^\/dashboard\/media\/?$/.test(path), title: "Media library", section: "Content", icon: Image },
  { test: (path: string) => /^\/dashboard\/projects\/?$/.test(path), title: "Projects", section: "Content", icon: Rocket },
  { test: (path: string) => /^\/dashboard\/experience\/?$/.test(path), title: "Experience", section: "Content", icon: BriefcaseBusiness },
  { test: (path: string) => /^\/dashboard\/blogs\/?$/.test(path), title: "Blogs", section: "Content", icon: BookOpenText },
  { test: (path: string) => /^\/dashboard\/settings\/headings\/?$/.test(path), title: "Homepage headings", section: "Settings", icon: Settings },
  { test: (path: string) => /^\/dashboard\/settings\/templates\/?$/.test(path), title: "Section templates", section: "Settings", icon: Settings },
  { test: (path: string) => /^\/dashboard\/settings\/security\/?$/.test(path), title: "My security", section: "Settings", icon: Settings },
  { test: (path: string) => /^\/dashboard\/settings\/users\/?$/.test(path), title: "User management", section: "Settings", icon: Settings },
  { test: (path: string) => /^\/dashboard\/settings\/?$/.test(path), title: "Settings", section: "Account", icon: Settings },
  { test: (path: string) => /^\/dashboard\/?$/.test(path), title: "Overview", section: "Dashboard", icon: LayoutDashboard },
];

export const Header = () => {
  const { name, user } = useDashboardAccess();
  const location = useLocation();
  const { darkTheme, handleDarkTheme, mobileOpen, handleMobileOpen } = useContext(settingContext);
  const page = useMemo(() => sections.find((item) => item.test(location.pathname)) || sections[sections.length - 1], [location.pathname]);
  const Icon = page.icon;

  return <header className="relative z-40 flex h-navbar shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <button type="button" onClick={() => handleMobileOpen(!mobileOpen)} aria-label="Open dashboard navigation" aria-expanded={mobileOpen} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 lg:hidden dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"><Menu size={20} /></button>
      <span className="hidden size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:grid"><Icon size={18} /></span>
      <div className="min-w-0"><p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 sm:block">{page.section}</p><h1 className="truncate text-base font-bold sm:text-lg">{page.title}</h1></div>
    </div>
    <div className="flex items-center gap-2">
      <Link to="/" className="hidden h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 hover:border-primary/40 hover:text-primary sm:inline-flex dark:border-gray-700 dark:text-gray-300"><ExternalLink size={14} />View portfolio</Link>
      <button type="button" onClick={() => handleDarkTheme(!darkTheme)} aria-label={darkTheme ? "Use light theme" : "Use dark theme"} title={darkTheme ? "Use light theme" : "Use dark theme"} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{darkTheme ? <Sun size={17} /> : <Moon size={17} />}</button>
      <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-xs font-bold text-white" title={name || user?.email || "Account"}>{(name || user?.email || "U").slice(0, 2).toUpperCase()}</div>
    </div>
  </header>;
};
