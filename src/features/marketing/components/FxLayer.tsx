"use client";

import { useEffect } from "react";

// Landing-page scroll progress bar. It is created from the outside so the server HTML stays
// clean, and it is skipped for reduced motion.
export function FxLayer() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bar = document.createElement("div");
    bar.className = "td-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    let ticking = false;
    const update = () => {
      ticking = false;
      const root = document.documentElement;
      const max = root.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      bar.remove();
    };
  }, []);

  return null;
}
