"use client";

import { useState } from "react";
import { homePage } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { AccordionItem } from "@/components/ui/AccordionItem";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";

export function FaqPreview() {
  const { headline, items, cta, ctaHref } = homePage.faqPreview;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section className="bg-gray-50 py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-3xl px-6 md:px-10 lg:px-16">
        <h2
          className="text-center text-3xl font-bold text-navy md:text-4xl"
          style={fadeUp(isInView, 0)}
        >
          {headline}
        </h2>

        <div
          className="mt-10 flex flex-col gap-2.5"
          style={fadeUp(isInView, 150)}
        >
          {items.map((item, i) => (
            <AccordionItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        <div className="mt-10 text-center" style={fadeUp(isInView, 300)}>
          <Button variant="secondary" href={ctaHref}>
            {cta} &rarr;
          </Button>
        </div>
      </div>
    </section>
  );
}
