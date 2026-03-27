"use client";

import { ClipboardCheck, Fingerprint, BadgeCheck } from "lucide-react";
import { homePage } from "@/lib/content";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";

const icons = [ClipboardCheck, Fingerprint, BadgeCheck];

export function AfterYouPass() {
  const { headline, subheadline, steps } = homePage.afterYouPass;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="bg-gray-50 py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div
          className="mx-auto max-w-3xl text-center"
          style={fadeUp(isInView, 0)}
        >
          <h2 className="text-3xl font-bold text-navy md:text-4xl">
            {headline}
          </h2>
          <p className="mt-2 text-lg text-gray-500">{subheadline}</p>
        </div>

        {/* Steps — horizontal cards with left accent border */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <div
                key={step.number}
                className="rounded-xl border-l-4 border-l-blue-500 border border-gray-200 bg-white p-6 shadow-sm"
                style={fadeUp(isInView, 150 + i * 100)}
              >
                {/* Step number + icon */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Icon size={20} className="text-blue-500" />
                  </div>
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-blue-500">
                    Step {step.number}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-4 text-xl font-bold text-navy">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
