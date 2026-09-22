import { lazy, Suspense, useContext, useState } from "react";
import { FileText, LayoutTemplate, Settings2 } from "lucide-react";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";
import { HeadingsEditor } from "./Settings/HeadingsEditor";
import { PAGE_PERMISSIONS, useDashboardAccess } from "@/features/dashboardAccess/DashboardAccess";
const TemplatesPanel = lazy(() => import("./Settings/TemplatesPanel").then(module => ({ default: module.TemplatesPanel })));

type Panel = "headings" | "templates";

export const Settings = () => {
  const { collapsed } = useContext(settingContext);
  const { hasPermission } = useDashboardAccess();
  const [panel, setPanel] = useState<Panel>(() => hasPermission(PAGE_PERMISSIONS.settings) ? "headings" : "templates");
  const [unsaved, setUnsaved] = useState(false);
  const width = collapsed ? "w-[calc(100vw-70px)]" : "w-[calc(100vw-240px)]";
  const selectPanel = (next: Panel) => {
    if (panel === next) return;
    if (unsaved && !window.confirm("Discard unsaved heading changes?")) return;
    setPanel(next);
    setUnsaved(false);
  };

  return (
    <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-900 dark:bg-darkthemebg dark:text-gray-100 ${width}`}>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <header className="mb-6 flex items-start gap-3">
          <span className="rounded-xl bg-primary/10 p-3 text-primary"><Settings2 size={22} /></span>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage the sections that make up your homepage.</p>
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Settings panels" className="flex gap-2 overflow-x-auto lg:flex-col">
            {hasPermission(PAGE_PERMISSIONS.settings) && <button type="button" aria-current={panel === "headings" ? "page" : undefined}
              onClick={() => selectPanel("headings")}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${panel === "headings" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"}`}>
              <FileText size={18} />Headings{unsaved && <span className="ml-auto size-2 rounded-full bg-amber-400" title="Unsaved changes" aria-label="Unsaved changes"/>}
            </button>}
            {hasPermission(PAGE_PERMISSIONS.templates) && <button type="button" aria-current={panel === "templates" ? "page" : undefined}
              onClick={() => selectPanel("templates")}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${panel === "templates" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"}`}>
              <LayoutTemplate size={18} />Templates
            </button>}
          </nav>
          <div className="min-w-0">
            {panel === "headings" && hasPermission(PAGE_PERMISSIONS.settings) && <HeadingsEditor onUnsavedChange={setUnsaved} />}
            {panel === "templates" && hasPermission(PAGE_PERMISSIONS.templates) && <Suspense fallback={<p role="status" className="p-8 text-sm">Loading templates…</p>}><TemplatesPanel /></Suspense>}
          </div>
        </div>
      </div>
    </main>
  );
};
