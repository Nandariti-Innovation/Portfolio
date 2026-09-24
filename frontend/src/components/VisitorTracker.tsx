import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { attachResumeTracking, setVisitorRoute } from "@/utils/visitorTracking";

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

function afterInitialRender(callback: () => void) {
  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback) {
    const id = idleWindow.requestIdleCallback(callback, { timeout: 2_000 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, 1_000);
  return () => window.clearTimeout(id);
}

export function VisitorTracker() {
  const { pathname, search } = useLocation();

  useEffect(
    () => afterInitialRender(() => setVisitorRoute(pathname, search)),
    [pathname, search],
  );

  useEffect(() => {
    let detach: (() => void) | undefined;
    const cancel = afterInitialRender(() => {
      detach = attachResumeTracking();
    });
    return () => {
      cancel();
      detach?.();
    };
  }, []);

  return null;
}
