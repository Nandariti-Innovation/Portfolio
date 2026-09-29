import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/sections/Hero";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useFetchHomePage } from "@/Hooks/FetchHomePage";
import { PageLoader } from "@/components/PageLoader";

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
      {isLoading && <PageLoader message={loadingMessage} />}
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
