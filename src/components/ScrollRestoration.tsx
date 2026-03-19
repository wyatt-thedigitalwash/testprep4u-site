"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls to top on forward navigation, preserves position on back/forward.
 *
 * Uses the Navigation API (popstate) to distinguish between push navigations
 * and browser back/forward. Next.js App Router triggers popstate for
 * back/forward but uses pushState/replaceState for Link clicks.
 */
export function ScrollRestoration() {
  const pathname = usePathname();
  const isPop = useRef(false);

  // Track popstate (back/forward button)
  useEffect(() => {
    function onPopState() {
      isPop.current = true;
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // On pathname change, scroll to top unless it was a back/forward nav
  useEffect(() => {
    if (isPop.current) {
      // Let the browser restore scroll position naturally
      isPop.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
