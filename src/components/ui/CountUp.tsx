"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** The final display value, e.g. "57.9%", "80%+", "$149". */
  value: string;
  /** Start animating when true. */
  trigger: boolean;
  /** Animation duration in ms. */
  duration?: number;
}

/**
 * Animates a leading number from 0 to its target value.
 * Non-numeric values and ranges (containing –) render instantly.
 * Reusable across any stat/metric component.
 */
export function CountUp({ value, trigger, duration = 1200 }: CountUpProps) {
  // Skip ranges containing – (en-dash) or - (hyphen between digits)
  const isRange = /\d\s*[–-]\s*\d/.test(value);
  const match = !isRange ? value.match(/^([^0-9]*?)(\d+\.?\d*)(.*)$/) : null;
  const canAnimate = !!match;
  const target = canAnimate ? parseFloat(match![2]) : 0;
  const hasDecimal = canAnimate ? match![2].includes(".") : false;
  const decimals = hasDecimal ? match![2].split(".")[1].length : 0;
  const prefix = match?.[1] ?? "";
  const suffix = match?.[3] ?? "";

  const [current, setCurrent] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!trigger || !canAnimate || hasRun.current) return;
    hasRun.current = true;

    const start = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [trigger, canAnimate, target, duration]);

  if (!canAnimate) return <>{value}</>;

  const formatted = hasDecimal
    ? current.toFixed(decimals)
    : Math.round(current).toString();

  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
}
