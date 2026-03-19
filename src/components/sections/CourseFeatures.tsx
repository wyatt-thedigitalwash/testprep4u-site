"use client";

import { useEffect, useState } from "react";
import { aboutPage } from "@/lib/content";
import type { CourseType } from "@/lib/pricing";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import {
  BookOpen,
  BrainCircuit,
  ClipboardCheck,
  Bookmark,
  BarChart3,
  MessageCircle,
} from "lucide-react";

const COURSE_CARD_INDEX: Record<CourseType, number> = {
  life: 0,
  health: 1,
  combined: 2,
};

const FEATURES = [
  {
    icon: BookOpen,
    title: "State-Approved Content",
    description:
      "Pre-licensing instruction tailored to your state's exam requirements and current regulations.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Adaptive Learning",
    description:
      "Smart technology identifies weak areas and adjusts your study path in real time.",
  },
  {
    icon: ClipboardCheck,
    title: "Realistic Practice Exams",
    description:
      "Full-length exams that mirror the format, difficulty, and timing of the real test.",
  },
  {
    icon: Bookmark,
    title: "Study Guides & Flashcards",
    description:
      "Downloadable PDF guides and digital flashcards for on-the-go review.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "See your readiness score improve and know exactly when you're prepared to test.",
  },
  {
    icon: MessageCircle,
    title: "24/7 Support",
    description:
      "Get answers anytime you need them — never lose momentum waiting for help.",
  },
];

interface CourseFeaturesProps {
  courseType: CourseType;
}

export function CourseFeatures({ courseType }: CourseFeaturesProps) {
  const card = aboutPage.courseCards.cards[COURSE_CARD_INDEX[courseType]];
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });
  const [entranceDone, setEntranceDone] = useState(false);

  useEffect(() => {
    if (isInView && !entranceDone) {
      const timer = setTimeout(() => setEntranceDone(true), 1300);
      return () => clearTimeout(timer);
    }
  }, [isInView, entranceDone]);

  return (
    <section className="relative overflow-hidden bg-navy py-20 md:py-24">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/3 blur-3xl" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center" style={fadeUp(isInView, 0)}>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            What&rsquo;s Included
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Everything You Need to Pass
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-100/80">
            {card.description}
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group rounded-xl border bg-white/5 p-6 backdrop-blur-sm ${
                  entranceDone
                    ? "translate-y-0 border-white/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 hover:shadow-lg hover:shadow-black/10"
                    : "border-white/10"
                }`}
                style={entranceDone ? undefined : fadeUp(isInView, 150 + i * 80)}
              >
                {/* Icon */}
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-400/20">
                  <Icon size={20} className="text-blue-300" />
                </div>

                {/* Title */}
                <h3 className="mt-4 font-display text-base font-bold text-white">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-blue-100/70">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
