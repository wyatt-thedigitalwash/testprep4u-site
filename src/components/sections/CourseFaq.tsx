"use client";

import { useState } from "react";
import { faqPage } from "@/lib/content";
import type { CourseType } from "@/lib/pricing";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { Button } from "@/components/ui/Button";
import { AccordionItem } from "@/components/ui/AccordionItem";

// Map each course type to relevant FAQ questions
const COURSE_FAQ_QUESTIONS: Record<CourseType, string[]> = {
  life: [
    "What will be covered on the life insurance exam?",
    "Is the insurance license exam hard?",
    "How long does exam preparation take?",
    "What is your first-time pass guarantee?",
  ],
  health: [
    "What will be covered on the health insurance exam?",
    "Is the insurance license exam hard?",
    "How long does exam preparation take?",
    "What is your first-time pass guarantee?",
  ],
  combined: [
    "Is the insurance license exam hard?",
    "How long does exam preparation take?",
    "What is your first-time pass guarantee?",
    "What should I bring to the exam?",
  ],
};

interface CourseFaqProps {
  courseType: CourseType;
}

export function CourseFaq({ courseType }: CourseFaqProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  const relevantQuestions = COURSE_FAQ_QUESTIONS[courseType];
  const items = relevantQuestions
    .map((q) => faqPage.items.find((item) => item.question === q))
    .filter(Boolean) as (typeof faqPage.items)[number][];

  return (
    <section className="py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-3xl px-6 md:px-10 lg:px-16">
        <h2
          className="text-center text-3xl font-bold text-navy md:text-4xl"
          style={fadeUp(isInView, 0)}
        >
          Common Questions
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
          <Button variant="secondary" href="/faq">
            See All FAQs &rarr;
          </Button>
        </div>
      </div>
    </section>
  );
}
