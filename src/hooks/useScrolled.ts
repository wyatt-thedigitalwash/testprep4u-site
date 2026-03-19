"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the user scrolls past `threshold` pixels.
 * Useful for navbar scroll effects, scroll-to-top buttons, etc.
 */
export function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
