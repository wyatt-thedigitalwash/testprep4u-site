"use client";

import { homePage } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";

interface BottomCtaProps {
  headline?: string;
  body?: string;
  cta?: string;
  ctaHref?: string;
}

export function BottomCta({
  headline,
  body,
  cta,
  ctaHref = "/pricing",
}: BottomCtaProps = {}) {
  const defaults = homePage.bottomCta;
  const h = headline ?? defaults.headline;
  const b = body ?? defaults.body;
  const c = cta ?? defaults.cta;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="bg-navy py-20 md:py-24">
      <div
        ref={ref}
        className="mx-auto max-w-3xl px-6 text-center md:px-10 lg:px-16"
      >
        <h2
          className="text-3xl font-bold text-white md:text-4xl"
          style={fadeUp(isInView, 0)}
        >
          {h}
        </h2>
        <p
          className="mt-4 text-lg leading-relaxed text-blue-100"
          style={fadeUp(isInView, 150)}
        >
          {b}
        </p>
        <div className="mt-8" style={fadeUp(isInView, 300)}>
          <Button href={ctaHref} variant="primary-dark">
            {c}
          </Button>
        </div>
      </div>
    </section>
  );
}
