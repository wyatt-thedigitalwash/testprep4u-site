"use client";

import { useEffect, useState } from "react";
import { homePage, shared } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { fadeUp, slideLeft } from "@/lib/animations";
import { useInView } from "@/hooks/useInView";

export function Hero() {
  const { headline, subheadline, cta } = homePage.hero;
  const metrics = shared.metricStrip.items;
  const [mounted, setMounted] = useState(false);
  const { ref: metricsRef, isInView: metricsVisible } =
    useInView<HTMLDivElement>();

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <section className="flex min-h-[calc(100svh-4rem)] flex-col bg-navy">
      {/* Hero content — centered in remaining space */}
      <div className="flex flex-1 items-center py-12 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="max-w-3xl">
            <h1
              className="text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl lg:leading-[1.05]"
              style={fadeUp(mounted, 0)}
            >
              Understand. Retain.
              <br />
              <em className="italic text-blue-100">Succeed.</em>
            </h1>
            <p
              className="mt-4 text-lg font-semibold text-blue-100 md:text-xl"
              style={fadeUp(mounted, 150)}
            >
              {subheadline}
            </p>
            <p
              className="mt-6 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg md:leading-[1.7]"
              style={fadeUp(mounted, 300)}
            >
              TestPrep4U gives you everything you need to pass your state
              insurance licensing exam — the first time. Our adaptive platform
              combines state-approved pre-licensing courses with AI-driven study
              tools, realistic practice exams, and expert-designed content that
              teaches understanding, not just memorization.
            </p>
            <div
              className="mt-8 flex flex-col gap-4 sm:flex-row"
              style={fadeUp(mounted, 450)}
            >
              <Button href="/pricing" variant="primary-dark">
                {cta}
              </Button>
              <Button
                href="/how-to-get-your-insurance-license"
                variant="outline-dark"
              >
                See the Full Roadmap
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metric strip — pinned to bottom */}
      <div
        ref={metricsRef}
        className="border-t border-white/10 py-8 md:py-10"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-0">
            {metrics.map((item, i) => (
              <div
                key={item.label}
                className={`border-l-4 border-blue-500 pl-5 ${
                  i > 0 ? "md:ml-8" : ""
                }`}
                style={slideLeft(metricsVisible, i * 200)}
              >
                <p className="font-display text-3xl font-extrabold text-white md:text-4xl">
                  <CountUp
                    value={item.value}
                    trigger={metricsVisible}
                    duration={1400}
                  />
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-300">
                  {item.label}
                </p>
                {item.source && (
                  <p className="mt-0.5 text-xs text-gray-400">{item.source}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
