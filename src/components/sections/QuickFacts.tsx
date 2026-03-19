"use client";

import { shared } from "@/lib/content";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { CountUp } from "@/components/ui/CountUp";

export function QuickFacts() {
  const { headline, items } = shared.quickFacts;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section className="bg-white py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div style={fadeUp(isInView, 0)}>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">
            By the Numbers
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy md:text-4xl">
            {headline}
          </h2>
        </div>

        <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:items-stretch lg:gap-20">
          {/* Stats column */}
          <div className="lg:w-[55%]">
            <div className="space-y-0">
              {items.map((item, i) => (
                <div
                  key={item.label}
                  className="group flex items-center gap-8 border-b border-gray-100 py-6 first:pt-0 last:border-b-0 last:pb-0"
                  style={fadeUp(isInView, 150 + i * 100)}
                >
                  {/* Number with left accent */}
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-1 rounded-full bg-blue-500/30 transition-colors duration-300 group-hover:bg-blue-500" />
                    <p className="w-32 flex-shrink-0 whitespace-nowrap font-display text-3xl font-extrabold tracking-tight text-navy">
                      <CountUp value={item.value} trigger={isInView} />
                    </p>
                  </div>

                  {/* Label + context */}
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold leading-snug text-gray-800">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      {item.context}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image placeholder */}
          <div
            className="lg:w-[45%]"
            style={fadeUp(isInView, 300)}
          >
            <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-200/60 lg:h-full">
              <span className="text-sm font-medium text-gray-300">
                Image placeholder
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
