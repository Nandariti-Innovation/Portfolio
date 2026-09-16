import { type RefObject, useEffect, useRef } from "react";

export const useScrollProgress = (pageRef: RefObject<HTMLElement | null>) => {
  const progress = useRef(0);

  useEffect(() => {
    const update = () => {
      const page = pageRef.current;
      if (!page) return;
      const distance = page.scrollHeight - window.innerHeight;
      progress.current = distance > 0 ? window.scrollY / distance : 0;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pageRef]);

  return progress;
};
