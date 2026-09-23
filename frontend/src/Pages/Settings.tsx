import { lazy, Suspense, useContext, useState } from "react";
import { FileText, LayoutTemplate, Settings2, ShieldCheck, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";
import { HeadingsEditor } from "./Settings/HeadingsEditor";
import { PAGE_PERMISSIONS, useDashboardAccess } from "@/features/dashboardAccess/DashboardAccess";

const TemplatesPanel = lazy(() => import("./Settings/TemplatesPanel").then(module => ({ default: module.TemplatesPanel })));
const UserManagement = lazy(() => import("./Dashboard/UserManagement"));
const Security = lazy(() => import("./Dashboard/Security"));

type Panel = "headings" | "templates" | "users" | "security";

const panels = [
  { key: "headings", label: "Homepage headings", description: "Review and edit section headings and homepage visibility.", icon: FileText },
  { key: "templates", label: "Section templates", description: "Create and manage reusable homepage layouts.", icon: LayoutTemplate },
  { key: "users", label: "User management", description: "Invite dashboard users and manage roles and access.", icon: Users },
  { key: "security", label: "My security", description: "Manage MFA, authenticators, and passkeys.", icon: ShieldCheck },
] as const;

export const Settings = () => {
  const { collapsed } = useContext(settingContext);
  const { hasPermission } = useDashboardAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const [unsaved, setUnsaved] = useState(false);
  const segment = location.pathname.split("/").filter(Boolean).at(-1);
  const panel: Panel | null = panels.some(item => item.key === segment) ? segment as Panel : null;
  const width = collapsed ? "w-[calc(100vw-70px)]" : "w-[calc(100vw-240px)]";
  const isAllowed = (key: Panel) => key === "security" ||
    (key === "headings" && hasPermission(PAGE_PERMISSIONS.settings)) ||
    (key === "templates" && hasPermission(PAGE_PERMISSIONS.templates)) ||
    (key === "users" && hasPermission(PAGE_PERMISSIONS.users));
  const visiblePanels = panels.filter(item => isAllowed(item.key));

  const selectPanel = (next: Panel | null) => {
    if (panel === next) return;
    if (unsaved && !window.confirm("Discard unsaved heading changes?")) return;
    setUnsaved(false);
    navigate(next ? `/dashboard/settings/${next}` : "/dashboard/settings");
  };

  return (
    <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-900 dark:bg-darkthemebg dark:text-gray-100 ${width}`}>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <header className="mb-6 flex items-start gap-3">
          <button type="button" onClick={() => selectPanel(null)} className="rounded-xl bg-primary/10 p-3 text-primary" aria-label="Settings home"><Settings2 size={22}/></button>
          <div><h1 className="text-3xl font-bold">Settings</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage homepage configuration, dashboard users, and account security.</p></div>
        </header>

        {!panel ? <section aria-label="Settings sections" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visiblePanels.map(item => <button key={item.key} type="button" onClick={() => selectPanel(item.key)} className="rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><item.icon size={21}/></span>
            <strong className="mt-4 block text-base">{item.label}</strong><span className="mt-2 block text-sm leading-6 text-gray-500 dark:text-gray-400">{item.description}</span>
          </button>)}
        </section> : !isAllowed(panel) ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">You do not have access to this settings section.</p> :
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:flex-col">
            <button type="button" onClick={() => selectPanel(null)} className="shrink-0 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">All settings</button>
            {visiblePanels.map(item => <button key={item.key} type="button" aria-current={panel === item.key ? "page" : undefined} onClick={() => selectPanel(item.key)} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${panel === item.key ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"}`}>
              <item.icon size={18}/>{item.label}{item.key === "headings" && unsaved && <span className="ml-auto size-2 rounded-full bg-amber-400" title="Unsaved changes" aria-label="Unsaved changes"/>}
            </button>)}
          </nav>
          <div className="min-w-0">
            {panel === "headings" && <HeadingsEditor onUnsavedChange={setUnsaved}/>} 
            {panel === "templates" && <Suspense fallback={<p role="status" className="p-8 text-sm">Loading templates…</p>}><TemplatesPanel/></Suspense>}
            {panel === "users" && <Suspense fallback={<p role="status" className="p-8 text-sm">Loading users…</p>}><UserManagement embedded/></Suspense>}
            {panel === "security" && <Suspense fallback={<p role="status" className="p-8 text-sm">Loading security settings…</p>}><Security embedded/></Suspense>}
          </div>
        </div>}
      </div>
    </main>
  );
};
