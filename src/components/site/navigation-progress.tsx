"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

// A 2px red bar across the top of the page while the next page loads.
// It starts only when a link, search or filter will load a DIFFERENT address,
// and finishes when the address changes. Forms that stay on the same page
// (inquiry, sign-in, saving) use the button spinner instead.

let bar: HTMLDivElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let safetyTimer: ReturnType<typeof setTimeout> | undefined;
let running = false;
/** Address (path + query) of the page currently shown. */
let shownAddress = "";

/** Start the bar if `target` (path + query) differs from the current address. */
export function startProgressTo(target: string) {
  const url = new URL(target, window.location.href);
  if (url.pathname + url.search !== window.location.pathname + window.location.search) startProgress();
}

export function startProgress() {
  if (!bar || running) return;
  running = true;
  clearTimeout(showTimer);
  clearTimeout(safetyTimer);
  // Fast navigations (under 80 ms) never show the bar.
  showTimer = setTimeout(() => {
    if (!bar || !running) return;
    bar.style.transition = "none";
    bar.style.opacity = "1";
    bar.style.transform = "scaleX(0.04)";
    void bar.offsetWidth;
    bar.style.transition = "transform 10s cubic-bezier(0.08, 0.7, 0.2, 1)";
    bar.style.transform = "scaleX(0.9)";
  }, 80);
  safetyTimer = setTimeout(finishProgress, 10000);
}

export function finishProgress() {
  clearTimeout(showTimer);
  clearTimeout(safetyTimer);
  if (!bar || !running) return;
  running = false;
  if (bar.style.opacity !== "1") return;
  bar.style.transition = "transform 180ms ease-out, opacity 250ms ease 180ms";
  bar.style.transform = "scaleX(1)";
  bar.style.opacity = "0";
}

function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Same page (or only a #section on it): nothing to load.
  return url.pathname + url.search !== window.location.pathname + window.location.search;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bar = ref.current;
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (anchor && isInternalNavigation(anchor, event)) startProgress();
    };
    document.addEventListener("click", onClick, true);
    // Back/forward buttons. Also fired by #section links on the same page, so check the address changed.
    const onPopState = () => {
      if (window.location.pathname + window.location.search !== shownAddress) startProgress();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      bar = null;
    };
  }, []);

  useEffect(() => {
    shownAddress = window.location.pathname + window.location.search;
    finishProgress();
  }, [pathname, searchParams]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-red opacity-0"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
