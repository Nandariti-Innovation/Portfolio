import React, { lazy, Suspense } from "react";
import { VisitorTracker } from "@/components/VisitorTracker";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { PAGE_PERMISSIONS, useDashboardAccess } from "@/features/dashboardAccess/DashboardAccess";
import supabase from "@/Superbase/client";
import { Header } from "@/Layouts/Header";
import { Sidebar } from "@/Layouts/Sidebar";
import { useContactModal } from "@/hooks/useContactModal";

const HomePage = lazy(() => import("@/Pages/Home"));
const ProjectPage = lazy(() => import("@/Pages/ProjectPage"));
const CaseStudy = lazy(() => import("@/Pages/CaseStudy"));
const Sitemap = lazy(() => import("@/Pages/Sitemap"));
const Auth = lazy(() => import("@/Pages/Auth"));
const Dashboard = lazy(() => import("@/Pages/Dashboard"));
const DashboardStorage = lazy(() => import("@/Pages/Dashboard/Storage"));
const DashboardProjects = lazy(() => import("@/Pages/Dashboard/Projects"));
const DashboardCaseStudyTemplates = lazy(() => import("@/Pages/Dashboard/CaseStudyTemplates"));
const DashboardExperience = lazy(() => import("@/Pages/Dashboard/Experience"));
const DashboardQueries = lazy(() => import("@/Pages/Dashboard/Queries"));
const DashboardBlogs = lazy(() => import("@/Pages/Dashboard/Blogs"));
const BlogEditor = lazy(() => import("@/Pages/Dashboard/Blogs/BlogEditor"));
const BlogPreview = lazy(() => import("@/Pages/Dashboard/Blogs/BlogPreview"));
const Settings = lazy(() =>
  import("@/Pages/Settings").then((module) => ({ default: module.Settings })),
);
const DashboardSections = lazy(() => import("@/Pages/Dashboard/Sections"));
const DashboardSecurity = lazy(() => import("@/Pages/Dashboard/Security"));
const DashboardUsers = lazy(() => import("@/Pages/Dashboard/UserManagement"));

export const Router = ({ pageDataLoading }: { pageDataLoading: boolean }) => {
  const location = useLocation();

  return (
    <>
      <VisitorTracker />
      <RouteErrorBoundary key={location.pathname.startsWith("/dashboard") ? "dashboard" : location.pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          <Route index element={<HomePage pageDataLoading={pageDataLoading} />} />
          <Route path="project" element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<ProjectPage />} />
          <Route path="project/:projectID" element={<CaseStudy />} />
          <Route path="sitemap" element={<Sitemap />} />
          <Route path="contact" element={<ContactModalRoute />} />
          <Route path="dashboard/auth" element={<Auth />} />
          <Route path="dashboard" element={<PrivateRouter />}>
            <Route index element={<RequirePermission permission={PAGE_PERMISSIONS.overview}><Dashboard /></RequirePermission>} />
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
            <Route path="setting" element={<RequireAnyPermission permissions={[PAGE_PERMISSIONS.settings, PAGE_PERMISSIONS.templates]}><Settings /></RequireAnyPermission>} />
            <Route path="users" element={<RequirePermission permission={PAGE_PERMISSIONS.users}><DashboardUsers /></RequirePermission>} />
            <Route path="security" element={<DashboardSecurity />} />
          </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </>
  );
};

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface RouteErrorBoundaryState {
  error: Error | null;
}

class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Route rendering failed", error, info);
  }

  render() {
    if (this.state.error) return this.props.fallback ?? <RouteErrorFallback />;
    return this.props.children;
  }
}

const RouteFallback = () => (
  <div
    className="grid min-h-screen place-items-center bg-background text-primary dark:bg-darkthemebg"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-4">
      <span className="size-9 animate-spin rounded-full border-4 border-current border-r-transparent" />
      <span className="text-sm font-medium">Loading page…</span>
    </div>
  </div>
);

const DashboardRouteFallback = () => (
  <main className="grid h-full min-w-0 flex-1 place-items-center bg-background text-primary dark:bg-darkthemebg" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-3">
      <span className="size-8 animate-spin rounded-full border-4 border-current border-r-transparent motion-reduce:animate-none" />
      <span className="text-sm font-medium">Loading page…</span>
    </div>
  </main>
);

const DashboardRouteErrorFallback = () => (
  <main className="grid h-full min-w-0 flex-1 place-items-center bg-background px-6 text-center text-gray-900 dark:bg-darkthemebg dark:text-white">
    <div className="max-w-md">
      <h1 className="text-xl font-semibold">This dashboard page could not be loaded.</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Please try again.</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Reload page</button>
    </div>
  </main>
);

const RouteErrorFallback = () => (
  <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-gray-900 dark:bg-darkthemebg dark:text-white">
    <div className="max-w-md">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        Something went wrong
      </p>
      <h1 className="mt-3 text-3xl font-bold">This page could not be loaded.</h1>
      <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-300">
        The connection may have been interrupted while loading this page. Try
        again, or return to the homepage.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold dark:border-gray-600"
        >
          Go home
        </button>
      </div>
    </div>
  </main>
);

const NotFound = () => (
  <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-gray-900 dark:bg-darkthemebg dark:text-white">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
        The page you requested does not exist.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
      >
        Return home
      </a>
    </div>
  </main>
);

const ContactModalRoute = () => {
  const navigate = useNavigate();
  const { openContact } = useContactModal();

  React.useEffect(() => {
    openContact();
    navigate("/", { replace: true });
  }, [navigate, openContact]);

  return null;
};

const PrivateRouter = () => {
  const { user, active, role, aal, loading, error } = useDashboardAccess();
  const location = useLocation();

  if (loading) return <RouteFallback />;
  if (!user) return <Navigate to="/dashboard/auth" replace />;
  if (error) return <main role="alert" className="p-8">Unable to check dashboard access: {error}</main>;
  const securityRoute = location.pathname === "/dashboard/security";
  if (!securityRoute && active && role !== "blank" && aal !== "aal2") return <Navigate to="/dashboard/security" replace />;
  if (!securityRoute && (!active || role === "blank")) return <DashboardPending />;
  return (
    <div className="w-screen h-dvh overflow-hidden">
      <Header />
      <div className="dashboard-content flex w-full items-center h-[calc(100vh-var(--spacing-navbar))]">
        <Sidebar />
        <RouteErrorBoundary key={location.pathname} fallback={<DashboardRouteErrorFallback />}>
          <Suspense fallback={<DashboardRouteFallback />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </div>
    </div>
  );
};

const RequirePermission = ({ permission, children }: { permission: string; children: React.ReactNode }) => {
  const { can } = useDashboardAccess();
  return can(permission) ? children : <main className="p-8" role="alert">You do not have access to this dashboard page.</main>;
};

const RequireAnyPermission = ({ permissions, children }: { permissions: string[]; children: React.ReactNode }) => {
  const { can } = useDashboardAccess();
  return permissions.some(can) ? children : <main className="p-8" role="alert">You do not have access to this dashboard page.</main>;
};

const DashboardPending = () => <main className="grid min-h-screen place-items-center p-8 text-center">
  <div><h1 className="text-xl font-bold">Dashboard access pending</h1>
    <p className="mt-2">An administrator must assign you a role before you can enter the dashboard.</p>
    <a href="/dashboard/security" className="mt-4 inline-block text-primary underline">My security settings</a>
    <button type="button" className="ml-4 text-primary underline" onClick={() => void supabase.auth.signOut()}>Sign out</button>
  </div>
</main>;
