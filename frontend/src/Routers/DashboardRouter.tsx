import React, { lazy, Suspense } from "react";
import { Provider } from "react-redux";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "@/Layouts/Header";
import { Sidebar } from "@/Layouts/Sidebar";
import supabase from "@/Superbase/client";
import {
  DashboardAccessProvider,
  PAGE_PERMISSIONS,
  useDashboardAccess,
} from "@/features/dashboardAccess/DashboardAccess";
import { DashboardUiProvider } from "@/features/dashboardUi/DashboardUi";
import { dashboardStore } from "@/StateManagement/Redux/dashboardStore";

const Auth = lazy(() => import("@/Pages/Auth"));
const Dashboard = lazy(() => import("@/Pages/Dashboard"));
const DashboardStorage = lazy(() => import("@/Pages/Dashboard/Storage"));
const DashboardProjects = lazy(() => import("@/Pages/Dashboard/Projects"));
const DashboardCaseStudyTemplates = lazy(
  () => import("@/Pages/Dashboard/CaseStudyTemplates"),
);
const DashboardExperience = lazy(() => import("@/Pages/Dashboard/Experience"));
const DashboardQueries = lazy(() => import("@/Pages/Dashboard/Queries"));
const DashboardBlogs = lazy(() => import("@/Pages/Dashboard/Blogs"));
const BlogEditor = lazy(() => import("@/Pages/Dashboard/Blogs/BlogEditor"));
const BlogPreview = lazy(() => import("@/Pages/Dashboard/Blogs/BlogPreview"));
const Settings = lazy(() =>
  import("@/Pages/Settings").then((module) => ({ default: module.Settings })),
);
const DashboardSections = lazy(() => import("@/Pages/Dashboard/Sections"));

export default function DashboardRouter() {
  return (
    <Provider store={dashboardStore}>
      <DashboardAccessProvider>
        <DashboardUiProvider>
        <Suspense fallback={<DashboardPageFallback />}>
          <Routes>
            <Route path="auth" element={<Auth />} />
            <Route element={<PrivateRouter />}>
              <Route
                index
                element={
                  <RequirePermission permission={PAGE_PERMISSIONS.overview}>
                    <Dashboard />
                  </RequirePermission>
                }
              />
              <Route path="queries" element={<RequirePermission permission={PAGE_PERMISSIONS.queries}><DashboardQueries /></RequirePermission>} />
              <Route path="media" element={<RequirePermission permission={PAGE_PERMISSIONS.media}><DashboardStorage /></RequirePermission>} />
              <Route path="projects" element={<RequirePermission permission={PAGE_PERMISSIONS.projects}><DashboardProjects /></RequirePermission>} />
              <Route path="case-study-templates" element={<RequirePermission permission={PAGE_PERMISSIONS.templates}><DashboardCaseStudyTemplates /></RequirePermission>} />
              <Route path="experience" element={<RequirePermission permission={PAGE_PERMISSIONS.experience}><DashboardExperience /></RequirePermission>} />
              <Route path="sections" element={<RequirePermission permission={PAGE_PERMISSIONS.sections}><DashboardSections /></RequirePermission>} />
              <Route path="sections/:sectionKey" element={<RequirePermission permission={PAGE_PERMISSIONS.sections}><DashboardSections /></RequirePermission>} />
              <Route path="blogs" element={<RequirePermission permission={PAGE_PERMISSIONS.blogs}><DashboardBlogs /></RequirePermission>} />
              <Route path="blogs/new" element={<RequirePermission permission={PAGE_PERMISSIONS.blogs}><BlogEditor /></RequirePermission>} />
              <Route path="blogs/:blogId/edit" element={<RequirePermission permission={PAGE_PERMISSIONS.blogs}><BlogEditor /></RequirePermission>} />
              <Route path="blogs/:blogId/preview" element={<RequirePermission permission={PAGE_PERMISSIONS.blogs}><BlogPreview /></RequirePermission>} />
              <Route path="settings/*" element={<Settings />} />
              <Route path="setting" element={<Navigate to="/dashboard/settings" replace />} />
              <Route path="users" element={<Navigate to="/dashboard/settings/users" replace />} />
              <Route path="security" element={<Navigate to="/dashboard/settings/security" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
        </DashboardUiProvider>
      </DashboardAccessProvider>
    </Provider>
  );
}

const DashboardPageFallback = () => (
  <main className="grid min-h-screen place-items-center bg-background text-primary dark:bg-darkthemebg" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-3">
      <span className="size-8 animate-spin rounded-full border-4 border-current border-r-transparent motion-reduce:animate-none" />
      <span className="text-sm font-medium">Loading page…</span>
    </div>
  </main>
);

const DashboardRouteFallback = () => (
  <main className="grid h-full min-w-0 flex-1 place-items-center bg-background text-primary dark:bg-darkthemebg" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-3">
      <span className="size-8 animate-spin rounded-full border-4 border-current border-r-transparent motion-reduce:animate-none" />
      <span className="text-sm font-medium">Loading page…</span>
    </div>
  </main>
);

const PrivateRouter = () => {
  const { user, active, role, isMfaSatisfied, loading, error } = useDashboardAccess();
  const location = useLocation();

  if (loading) return <DashboardPageFallback />;
  if (!user) return <Navigate to="/dashboard/auth" replace />;
  if (error) return <main role="alert" className="p-8">Unable to check dashboard access: {error}</main>;
  const securityRoute = location.pathname === "/dashboard/settings/security" || location.pathname === "/dashboard/security";
  if (!securityRoute && active && role !== "blank" && !isMfaSatisfied) return <Navigate to="/dashboard/settings/security" replace />;
  if (!securityRoute && (!active || role === "blank")) return <DashboardPending />;

  return (
    <div className="dashboard-shell h-dvh w-screen overflow-hidden">
      <Header />
      <div className="dashboard-content flex h-[calc(100vh-var(--spacing-navbar))] w-full items-center">
        <Sidebar />
        <Suspense fallback={<DashboardRouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

const RequirePermission = ({ permission, children }: { permission: string; children: React.ReactNode }) => {
  const { hasPermission, isMfaSatisfied } = useDashboardAccess();
  return isMfaSatisfied && hasPermission(permission)
    ? children
    : <main className="p-8" role="alert">You do not have access to this dashboard page.</main>;
};

const DashboardPending = () => (
  <main className="grid min-h-screen place-items-center p-8 text-center">
    <div>
      <h1 className="text-xl font-bold">Dashboard access pending</h1>
      <p className="mt-2">An administrator must assign you a role before you can enter the dashboard.</p>
      <a href="/dashboard/settings/security" className="mt-4 inline-block text-primary underline">My security settings</a>
      <button type="button" className="ml-4 text-primary underline" onClick={() => void supabase.auth.signOut()}>Sign out</button>
    </div>
  </main>
);
