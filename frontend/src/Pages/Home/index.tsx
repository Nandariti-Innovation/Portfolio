import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/sections/Hero";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useFetchHomePage } from "@/Hooks/FetchHomePage";

const PortfolioScene = lazy(() =>
  import("@/components/scene/PortfolioScene").then((module) => ({ default: module.PortfolioScene })),
);
const About = lazy(() =>
  import("@/components/sections/About").then((module) => ({ default: module.About })),
);
const DynamicSections = lazy(() =>
  import("@/components/sections/DynamicSections").then((module) => ({ default: module.DynamicSections })),
);
const Contact = lazy(() =>
  import("@/components/sections/Contact").then((module) => ({ default: module.Contact })),
);

const App = () => {
  const { pageDataLoading } = useFetchHomePage();
  const pageRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(pageRef);
  const [sceneReady, setSceneReady] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const isLoading = pageDataLoading || !sceneReady;
  const loadingMessage = !sceneReady
    ? "Preparing your 3D experience…"
    : "Loading page content…";

  return (
    <main ref={pageRef} aria-busy={isLoading}>
      {isLoading && (
        <div className="scene-loader" style={{ zIndex: 100 }}>
          <div className="loader-content">
            <img
              src="/svg/typing_code_loader.svg"
              alt="Loading portfolio…"
              width={640}
              height={420}
              className="loader-icon"
            />
            <div className="loader-progress">
              <p className="loader-status" role="status" aria-live="polite">
                {loadingMessage}
              </p>
              <div
                className="loader-track"
                role="progressbar"
                aria-label={loadingMessage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="loader-fill loader-indeterminate" />
              </div>
              <p className="loader-hint">Good things take a moment.</p>
            </div>
          </div>
        </div>
      )}
      <Navigation />
      <Suspense fallback={null}>
        <PortfolioScene progress={progress} onReady={handleSceneReady} />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <div className="page-content">
        <Hero />
        <About />
        <DynamicSections />
        <Contact />
      </div>
    </main>
  );
};

export default App;
