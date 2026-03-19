"use client";

import { homePage } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
export function StepsOverview() {
  const { steps, cta, ctaHref } = homePage.stepsOverview;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="bg-gray-50 py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center" style={fadeUp(isInView, 0)}>
          <h2 className="text-3xl font-bold text-navy md:text-4xl">
            {homePage.stepsOverview.headline}
          </h2>
          <p className="mt-2 text-lg text-gray-500">
            {homePage.stepsOverview.subheadline}
          </p>
        </div>

        {/* 3-step cards */}
        <div className="mt-12 grid items-stretch gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="text-left"
              style={fadeUp(isInView, 150 + i * 100)}
            >
              <span className="font-display text-7xl font-extrabold leading-none text-blue-200">
                0{step.number}
              </span>
              <h3 className="mt-3 text-xl font-bold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center" style={fadeUp(isInView, 650)}>
          <Button variant="secondary" href={ctaHref}>
            {cta} &rarr;
          </Button>
        </div>
      </div>
    </section>
  );
}
