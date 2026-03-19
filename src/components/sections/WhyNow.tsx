"use client";

import { shared } from "@/lib/content";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { TrendingUp } from "lucide-react";

export function WhyNow() {
  const { headline, subhead, bullets, closing } = shared.whyNow;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section className="relative overflow-hidden bg-navy py-20 md:py-24">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-white/3 blur-3xl" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-20">
          {/* Left column — headline + closing */}
          <div className="lg:w-[40%]">
            <div style={fadeUp(isInView, 0)}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 ring-1 ring-white/10">
                <TrendingUp size={14} className="text-blue-300" />
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-300">
                  {subhead}
                </span>
              </div>
              <h2 className="mt-5 text-3xl font-bold text-white md:text-4xl">
                {headline}
              </h2>
            </div>

            <div style={fadeUp(isInView, 150)}>
              <p className="mt-8 text-xl font-bold leading-snug text-blue-100 md:text-2xl">
                {closing}
              </p>
            </div>
          </div>

          {/* Right column — bullets as cards */}
          <div className="flex-1 space-y-4">
            {bullets.map((bullet, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                style={fadeUp(isInView, 150 + i * 100)}
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 font-display text-2xl font-extrabold text-blue-400">
                    0{i + 1}
                  </span>
                  <p className="text-base leading-relaxed text-blue-100/90">
                    {bullet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
