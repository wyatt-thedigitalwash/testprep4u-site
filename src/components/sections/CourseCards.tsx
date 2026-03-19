"use client";

import { useEffect, useState } from "react";
import { aboutPage } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { Check, Heart, Shield, Layers } from "lucide-react";

const icons = [Shield, Heart, Layers];

export function CourseCards() {
  const { headline, cards } = aboutPage.courseCards;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });
  const [entranceDone, setEntranceDone] = useState(false);

  useEffect(() => {
    if (isInView && !entranceDone) {
      const timer = setTimeout(() => setEntranceDone(true), 1300);
      return () => clearTimeout(timer);
    }
  }, [isInView, entranceDone]);

  return (
    <section className="py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center" style={fadeUp(isInView, 0)}>
          <h2 className="text-3xl font-bold text-navy md:text-4xl">
            {headline}
          </h2>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = icons[i];
            return (
              <div
                key={card.title}
                className={`flex flex-col rounded-xl border bg-white p-6 ${
                  entranceDone
                    ? "translate-y-0 border-gray-200 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                    : "border-gray-200 shadow-sm"
                }`}
                style={entranceDone ? undefined : fadeUp(isInView, 150 + i * 100)}
              >
                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Icon size={24} className="text-blue-500" />
                </div>

                {/* Title */}
                <h3 className="mt-4 text-xl font-bold text-navy">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {card.description}
                </p>

                {/* Bullets */}
                <ul className="mt-4 flex-1 space-y-2">
                  {card.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <Check
                        size={16}
                        className="mt-0.5 flex-shrink-0 text-blue-500"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-6">
                  <Button variant="secondary" href={card.href}>
                    {card.cta} &rarr;
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
