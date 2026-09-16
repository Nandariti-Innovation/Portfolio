import { useProgress } from "@react-three/drei";
import { Suspense, useCallback, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { PortfolioScene } from "@/components/scene/PortfolioScene";
import { About } from "@/components/sections/About";
import { Blog } from "@/components/sections/Blog";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const App = ({ pageDataLoading }: { pageDataLoading: boolean }) => {
  const pageRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(pageRef);
  const [sceneReady, setSceneReady] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const isLoading = pageDataLoading || !sceneReady;
  const { active, progress: assetProgress } = useProgress();
  const hasAssetProgress = active && assetProgress > 0 && assetProgress < 100;
  const loadingMessage = active
    ? "Loading 3D assets…"
    : !sceneReady
      ? "Preparing your 3D experience…"
      : "Loading page content…";

  return (
    <main ref={pageRef} aria-busy={isLoading}>
      {isLoading && (
        <div
          className="scene-loader"
          style={{ zIndex: 100 }}
        >
          <div className="loader-content">
          <img
            src="/svg/typing_code_loader.svg"
            alt="Loading portfolio…"
            width={640}
            height={420}
            className="loader-icon"
          />
          <div className="loader-progress">
            <p className="loader-status" role="status" aria-live="polite">{loadingMessage}</p>
            <div
              className="loader-track"
              role="progressbar"
              aria-label={hasAssetProgress ? "3D asset loading progress" : loadingMessage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={hasAssetProgress ? Math.round(assetProgress) : undefined}
            >
              <span
                className={hasAssetProgress ? "loader-fill" : "loader-fill loader-indeterminate"}
                style={hasAssetProgress ? { width: `${assetProgress}%` } : undefined}
              />
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
        <Experience />
        <Projects />
        <Blog />
        <Contact />
      </div>
    </main>
  );
};

export default App;
