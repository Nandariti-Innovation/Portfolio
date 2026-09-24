import React, { lazy, Suspense } from "react";
import { VisitorTracker } from "@/components/VisitorTracker";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useContactModal } from "@/hooks/useContactModal";

const HomePage = lazy(() => import("@/Pages/Home"));
const CaseStudy = lazy(() => import("@/Pages/CaseStudy"));
const ProjectPage = lazy(() =>
  import("./ProjectRoutes").then((module) => ({ default: module.ProjectArchiveRoute })),
);
const Sitemap = lazy(() =>
  import("./ProjectRoutes").then((module) => ({ default: module.SitemapRoute })),
);
const DashboardRouter = lazy(() => import("./DashboardRouter"));
const Invite = lazy(() => import("@/Pages/Auth/Invite"));

export const Router = () => {
  const location = useLocation();

  return (
    <>
      <VisitorTracker />
      <RouteErrorBoundary
        key={location.pathname.startsWith("/dashboard") ? "dashboard" : location.pathname}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="project" element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<ProjectPage />} />
            <Route path="project/:projectID" element={<CaseStudy />} />
            <Route path="sitemap" element={<Sitemap />} />
            <Route path="contact" element={<ContactModalRoute />} />
            <Route path="auth/invite" element={<Invite />} />
            <Route path="dashboard/*" element={<DashboardRouter />} />
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
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
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
