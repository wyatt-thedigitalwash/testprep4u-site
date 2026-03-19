"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { Button } from "@/components/ui/Button";
import { AccordionItem } from "@/components/ui/AccordionItem";

const PRICING_FAQS = [
  {
    question: "What's included in every plan?",
    answer:
      "All plans include state-approved pre-licensing course content, chapter quizzes, 3 full practice exams, progress tracking, a completion certificate, and 24/7 chat support. Higher tiers add AI-adaptive review, unlimited practice retakes, study guides, and more.",
  },
  {
    question: "Can I upgrade my plan later?",
    answer:
      "Yes. You can upgrade from Essentials to Pro or Premium at any time. You'll only pay the difference between your current plan and the new tier.",
  },
  {
    question: "What is the first-time pass guarantee?",
    answer:
      "Score 80% or better on three practice exams within five days of your exam date. If you don't pass, send us verification and we will issue a full refund. Available on Pro and Premium plans.",
  },
  {
    question: "Do prices vary by state?",
    answer:
      "Pricing is the same across all 50 states. The only variation is between course types — Life, Health, or the Combined Life & Health course.",
  },
];

export function PricingFaq() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section className="py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-3xl px-6 md:px-10 lg:px-16">
        <h2
          className="text-center text-3xl font-bold text-navy md:text-4xl"
          style={fadeUp(isInView, 0)}
        >
          Pricing Questions
        </h2>

        <div
          className="mt-10 flex flex-col gap-2.5"
          style={fadeUp(isInView, 150)}
        >
          {PRICING_FAQS.map((item, i) => (
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
          <Button variant="secondary" href="/faq">
            See All FAQs &rarr;
          </Button>
        </div>
      </div>
    </section>
  );
}
