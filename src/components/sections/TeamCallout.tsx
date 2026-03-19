"use client";

import { pricingPage } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { Users } from "lucide-react";

export function TeamCallout() {
  const { headline, body, cta, href } = pricingPage.teamCallout;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="bg-gray-50 py-14 md:py-16">
      <div
        ref={ref}
        className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center md:flex-row md:text-left md:px-10 lg:px-16"
        style={fadeUp(isInView, 0)}
      >
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <Users size={24} className="text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-navy">{headline}</h3>
          <p className="mt-1 text-sm text-gray-500">{body}</p>
        </div>
        <Button variant="secondary" href={href}>
          {cta} &rarr;
        </Button>
      </div>
    </section>
  );
}
