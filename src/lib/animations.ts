import type { CSSProperties } from "react";

/**
 * Fade-up transition style — element rises 16px and fades in.
 * Use with a boolean (mounted / isInView) and an optional stagger delay in ms.
 */
export function fadeUp(visible: boolean, delay = 0): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(16px)",
    transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
  };
}

/**
 * Slide-in-left transition style — element slides 20px from the left and fades in.
 * Use with a boolean (mounted / isInView) and an optional stagger delay in ms.
 */
export function slideLeft(visible: boolean, delay = 0): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateX(-20px)",
    transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
  };
}
