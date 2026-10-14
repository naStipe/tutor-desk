"use client";

import { useEffect } from "react";

// Landing-page effects layer: scroll progress bar, trailing cursor dot/ring, magnetic buttons and
// scroll parallax. Everything attaches from the outside (event delegation) and is skipped for
// reduced motion. Opt elements in with data-magnetic, data-parallax="40" and data-cursor="Label".
const MAGNETIC_PULL = 0.28;
const MAGNETIC_MAX_PX = 10;
const INTERACTIVE = "a, button, [role='button'], summary, label[for]";

export function FxLayer() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: Array<() => void> = [];
    root.classList.add("td-fx");
    cleanups.push(() => root.classList.remove("td-fx"));

    // Scroll progress bar + parallax, one rAF-throttled handler.
    const bar = document.createElement("div");
    bar.className = "td-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    cleanups.push(() => bar.remove());

    let ticking = false;
    const update = () => {
      ticking = false;
      const max = root.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      const vh = window.innerHeight;
      for (const el of document.querySelectorAll<HTMLElement>("[data-parallax]")) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > vh + 120) continue;
        const amount = Number(el.dataset.parallax) || 0;
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        el.style.setProperty("--td-py", `${(-progress * amount).toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    });
    update();

    if (finePointer) {
      // Cursor dot: swells into a ring over links/buttons and into a labelled bubble over [data-cursor].
      const cursor = document.createElement("div");
      cursor.className = "td-cursor";
      cursor.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      cursor.appendChild(label);
      document.body.appendChild(cursor);
      cleanups.push(() => cursor.remove());

      let tx = 0;
      let ty = 0;
      let cx = 0;
      let cy = 0;
      let seen = false;
      let raf = 0;
      const loop = () => {
        cx += (tx - cx) * 0.35;
        cy += (ty - cy) * 0.35;
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        raf = requestAnimationFrame(loop);
      };

      let magnet: HTMLElement | null = null;
      const release = () => {
        if (!magnet) return;
        magnet.style.removeProperty("--td-mx");
        magnet.style.removeProperty("--td-my");
        magnet.classList.remove("td-magnet-active");
        magnet = null;
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        tx = e.clientX;
        ty = e.clientY;
        if (!seen) {
          seen = true;
          cx = tx;
          cy = ty;
          root.classList.add("td-hide-cursor");
          raf = requestAnimationFrame(loop);
        }
        const target = e.target as Element | null;
        const native = Boolean(target?.closest?.("input, textarea, select, [aria-modal='true']"));
        cursor.classList.toggle("is-on", !native);
        const big = target?.closest?.<HTMLElement>("[data-cursor]") ?? null;
        const link = !big && Boolean(target?.closest?.(INTERACTIVE));
        cursor.classList.toggle("is-big", Boolean(big));
        cursor.classList.toggle("is-link", link);
        const text = big?.dataset.cursor ?? "";
        if (label.textContent !== text) label.textContent = text;

        const el = target?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
        if (el !== magnet) release();
        if (!el) return;
        magnet = el;
        el.classList.add("td-magnet-active");
        const rect = el.getBoundingClientRect();
        const clamp = (v: number) => Math.max(-MAGNETIC_MAX_PX, Math.min(MAGNETIC_MAX_PX, v));
        el.style.setProperty(
          "--td-mx",
          `${clamp((e.clientX - (rect.left + rect.width / 2)) * MAGNETIC_PULL)}px`,
        );
        el.style.setProperty(
          "--td-my",
          `${clamp((e.clientY - (rect.top + rect.height / 2)) * MAGNETIC_PULL)}px`,
        );
      };
      const onLeave = () => {
        cursor.classList.remove("is-on");
        release();
      };
      const onDown = () => cursor.classList.add("is-down");
      const onUp = () => cursor.classList.remove("is-down");
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("blur", onLeave);
      root.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        release();
        root.classList.remove("td-hide-cursor");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("blur", onLeave);
        root.removeEventListener("pointerleave", onLeave);
      });
    }

    return () => {
      for (const fn of cleanups.reverse()) fn();
    };
  }, []);

  return null;
}
