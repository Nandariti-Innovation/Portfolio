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
  Settings,
  User,
  X,
} from "lucide-react";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/StateManagement/Redux/reduxStore";
import { logout } from "@/StateManagement/Redux/slices/authentication";

const navItems: NavItemsTypes[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Queries", path: "/dashboard/queries", icon: Inbox },
  { name: "Storage", path: "/dashboard/media", icon: Image },
  { name: "Projects", path: "/dashboard/projects", icon: Rocket },
  {
    name: "Experience",
    path: "/dashboard/experience",
    icon: BriefcaseBusiness,
  },
  { name: "Blogs", path: "/dashboard/blogs", icon: BookOpenText },
  { name: "Sections", path: "/dashboard/sections", icon: Layers3 },
  { name: "Settings", path: "/dashboard/setting", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
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
              <span><span className="block whitespace-nowrap text-sm font-semibold text-sidebar-foreground">Deepanshu Gulia</span><span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">Portfolio admin</span></span>
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
          {navItems.map((item) => (
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
          onClick={() => dispatch(logout())}
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
}
