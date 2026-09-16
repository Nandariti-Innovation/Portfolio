import React, { lazy, Suspense } from "react";
import { VisitorTracker } from "@/components/VisitorTracker";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/StateManagement/Redux/reduxStore";
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
const DashboardExperience = lazy(() => import("@/Pages/Dashboard/Experience"));
const DashboardQueries = lazy(() => import("@/Pages/Dashboard/Queries"));
const DashboardBlogs = lazy(() => import("@/Pages/Dashboard/Blogs"));
const BlogEditor = lazy(() => import("@/Pages/Dashboard/Blogs/BlogEditor"));
const BlogPreview = lazy(() => import("@/Pages/Dashboard/Blogs/BlogPreview"));
const Settings = lazy(() =>
  import("@/Pages/Settings").then((module) => ({ default: module.Settings })),
);

export const Router = ({ pageDataLoading }: { pageDataLoading: boolean }) => {
  const location = useLocation();

  return (
    <>
      <VisitorTracker />
      <RouteErrorBoundary key={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          <Route index element={<HomePage pageDataLoading={pageDataLoading} />} />
          <Route path="project" element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<ProjectPage />} />
          <Route path="project/:projectID" element={<CaseStudy />} />
          <Route path="sitemap" element={<Sitemap />} />
          <Route path="contact" element={<ContactModalRoute />} />
          <Route path="dashboard">
            <Route path="auth" element={<Auth />} />
            <Route
              path="queries"
              element={
                <PrivateRouter>
                  <DashboardQueries />
                </PrivateRouter>
              }
            />
            <Route
              index
              element={
                <PrivateRouter>
                  <Dashboard />
                </PrivateRouter>
              }
            />
            <Route
              path="media"
              element={
                <PrivateRouter>
                  <DashboardStorage />
                </PrivateRouter>
              }
            />
            <Route
              path="projects"
              element={
                <PrivateRouter>
                  <DashboardProjects />
                </PrivateRouter>
              }
            />
            <Route
              path="experience"
              element={
                <PrivateRouter>
                  <DashboardExperience />
                </PrivateRouter>
              }
            />
            <Route
              path="blogs"
              element={
                <PrivateRouter>
                  <DashboardBlogs />
                </PrivateRouter>
              }
            />
            <Route
              path="blogs/new"
              element={
                <PrivateRouter>
                  <BlogEditor />
                </PrivateRouter>
              }
            />
            <Route
              path="blogs/:blogId/edit"
              element={
                <PrivateRouter>
                  <BlogEditor />
                </PrivateRouter>
              }
            />
            <Route
              path="blogs/:blogId/preview"
              element={
                <PrivateRouter>
                  <BlogPreview />
                </PrivateRouter>
              }
            />
            <Route
              path="setting"
              element={
                <PrivateRouter>
                  <Settings />
                </PrivateRouter>
              }
            />
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
    if (this.state.error) return <RouteErrorFallback />;
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

const PrivateRouter: React.FC<PrivateRouterProps> = ({ children }) => {
  const { isAuth } = useSelector((state: RootState) => state.authentication);

  if (isAuth == false) return <Auth />;
  return (
    <div className="w-screen h-dvh overflow-hidden">
      <Header />
      <div className="dashboard-content flex w-full items-center h-[calc(100vh-var(--spacing-navbar))]">
        <Sidebar />
        {children}
      </div>
    </div>
  );
};

interface PrivateRouterProps {
  children: React.ReactNode;
}
