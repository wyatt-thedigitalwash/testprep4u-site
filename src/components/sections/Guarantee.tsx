"use client";

import { ShieldCheck } from "lucide-react";
import { shared } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";

export function Guarantee() {
  const { headline, body } = shared.guarantee;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.15 });

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-[#003d6b] to-blue-500 py-20 md:py-24">
      {/* Subtle decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div
        ref={ref}
        className="relative mx-auto max-w-3xl px-6 text-center md:px-10 lg:px-16"
        style={fadeUp(isInView, 0)}
      >
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
          <ShieldCheck size={40} className="text-white" />
        </div>

        {/* Headline */}
        <h2 className="mt-8 text-3xl font-bold text-white md:text-4xl">
          {headline}
        </h2>

        {/* Body */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100">
          {body}
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Button variant="primary-dark" href="/pricing">
            Start Learning — Risk Free
          </Button>
        </div>
      </div>
    </section>
  );
}
