import React, { useContext, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { tailwindMerge } from "../Utils/tailwindMerge";
import {
  BookOpenText,
  Inbox,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Image,
  LayoutDashboard,
  LogOut,
  LucideProps,
  Rocket,
  Layers3,
  LayoutTemplate,
  Settings,
  ShieldCheck,
  Users,
  User,
  X,
} from "lucide-react";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";
import { PAGE_PERMISSIONS, useDashboardAccess } from "@/features/dashboardAccess/DashboardAccess";
import supabase from "@/Superbase/client";

const navItems: NavItemsTypes[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, permission: PAGE_PERMISSIONS.overview },
  { name: "Queries", path: "/dashboard/queries", icon: Inbox, permission: PAGE_PERMISSIONS.queries },
  { name: "Storage", path: "/dashboard/media", icon: Image, permission: PAGE_PERMISSIONS.media },
  { name: "Projects", path: "/dashboard/projects", icon: Rocket, permission: PAGE_PERMISSIONS.projects },
  { name: "Case study templates", path: "/dashboard/case-study-templates", icon: LayoutTemplate, permission: PAGE_PERMISSIONS.templates },
  {
    name: "Experience",
    path: "/dashboard/experience",
    icon: BriefcaseBusiness,
    permission: PAGE_PERMISSIONS.experience,
  },
  { name: "Blogs", path: "/dashboard/blogs", icon: BookOpenText, permission: PAGE_PERMISSIONS.blogs },
  { name: "Sections", path: "/dashboard/sections", icon: Layers3, permission: PAGE_PERMISSIONS.sections },
  { name: "Settings", path: "/dashboard/setting", icon: Settings, permission: PAGE_PERMISSIONS.settings },
  { name: "User management", path: "/dashboard/users", icon: Users, permission: PAGE_PERMISSIONS.users },
  { name: "My security", path: "/dashboard/security", icon: ShieldCheck },
];

export const Sidebar: React.FC = () => {
  const { hasPermission, name, role } = useDashboardAccess();
  const location = useLocation();
  const { collapsed, handleCollapsed, mobileOpen, handleMobileOpen } = useContext(settingContext);

  useEffect(() => {
    handleMobileOpen(false);
  }, [location.pathname, handleMobileOpen]);

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close dashboard navigation" onClick={() => handleMobileOpen(false)} className="fixed inset-0 z-40 cursor-default bg-slate-950/55 backdrop-blur-[2px] lg:hidden" />}
      <aside
      className={tailwindMerge(
        "fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-white shadow-2xl transition-transform duration-300 ease-out lg:relative lg:inset-auto lg:z-auto lg:h-full lg:translate-x-0 lg:shadow-none lg:transition-[width]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-[70px]" : "lg:w-[240px]"
      )}
    >
      <div className="flex h-navbar items-center justify-between border-b border-sidebar-border px-4 lg:h-auto lg:min-h-16">
        <div
          className={tailwindMerge(
            "flex items-center",
            collapsed && "lg:justify-center lg:w-full"
          )}
        >
          {collapsed ? (
            <div className="flex items-center"><div className="mr-3 grid size-9 place-items-center rounded-xl bg-primary text-xs font-bold lg:mr-0">DG</div><span className="lg:hidden"><span className="block whitespace-nowrap text-sm font-semibold text-sidebar-foreground">Deepanshu Gulia</span><span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">Portfolio admin</span></span></div>
          ) : (
            <div className="flex items-center">
              <div className="mr-3 grid size-9 place-items-center rounded-xl bg-primary/20 text-primary">
                <User size={18} />
              </div>
              <span><span className="block whitespace-nowrap text-sm font-semibold text-sidebar-foreground">{name || "Dashboard user"}</span><span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">{role}</span></span>
            </div>
          )}
        </div>
        <button
          onClick={() => handleCollapsed(!collapsed)}
          className="hidden cursor-pointer rounded-lg p-1.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent lg:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button type="button" onClick={() => handleMobileOpen(false)} aria-label="Close dashboard navigation" className="grid size-9 cursor-pointer place-items-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"><X size={20} /></button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4" aria-label="Dashboard navigation">
        <ul className="space-y-1 px-2">
          {navItems.filter(item => !item.permission || hasPermission(item.permission) || (item.name === "Settings" && hasPermission(PAGE_PERMISSIONS.templates))).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  tailwindMerge(
                    "flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    collapsed ? "lg:justify-center" : "",
                    isActive
                      ? "bg-sidebar-accent text-primary bg-gradient-to-r from-primary/20 to-transparent"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )
                }
              >
                <item.icon
                  size={20}
                  className={tailwindMerge(
                    "flex-shrink-0",
                    collapsed ? "mr-3 lg:mr-0" : "mr-3"
                  )}
                />
                <span className={tailwindMerge(collapsed && "lg:hidden")}>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          className={tailwindMerge(
            "flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-red-500/10 hover:text-red-300",
            collapsed ? "lg:justify-center" : ""
          )}
        >
          <LogOut
            size={16}
            className={tailwindMerge(
              "text-red-400 flex-shrink-0",
              collapsed ? "mr-3 lg:mr-0" : "mr-3"
            )}
          />
          <span className={tailwindMerge(collapsed && "lg:hidden")}>Log out</span>
        </button>
      </div>
    </aside>
    </>
  );
};

interface NavItemsTypes {
  name: string;
  path: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  permission?: string;
}
