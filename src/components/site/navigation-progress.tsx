"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

// A 2px red bar across the top of the page while the next page loads.
// It starts when an internal link is clicked or a search/filter form is sent,
// and finishes when the address changes.

let bar: HTMLDivElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let safetyTimer: ReturnType<typeof setTimeout> | undefined;
let running = false;

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
  safetyTimer = setTimeout(finishProgress, 20000);
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
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      const action = form.getAttribute("action") ?? "";
      // Only search/filter forms that load another page; Server Action forms show a button spinner instead.
      if (form.method.toLowerCase() === "get" && action && !action.startsWith("javascript:")) startProgress();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("popstate", startProgress);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener("popstate", startProgress);
      bar = null;
    };
  }, []);

  useEffect(() => {
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
