"use client";

import { coursePages } from "@/lib/content";
import type { CourseType } from "@/lib/pricing";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { AlertTriangle } from "lucide-react";

interface ExamTableProps {
  courseType: CourseType;
}

export function ExamTable({ courseType }: ExamTableProps) {
  const { examTable } = coursePages[courseType];
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section className="py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-3xl px-6 md:px-10 lg:px-16">
        {/* Section header */}
        <h2
          className="text-center text-3xl font-bold text-navy md:text-4xl"
          style={fadeUp(isInView, 0)}
        >
          {examTable.title}
        </h2>

        {/* Exam sections list */}
        <div
          className="mt-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          style={fadeUp(isInView, 150)}
        >
          {examTable.sections.map((section, i) => (
            <div
              key={section.name}
              className={`flex items-start justify-between gap-4 px-6 py-5 ${
                i !== examTable.sections.length - 1
                  ? "border-b border-gray-200"
                  : ""
              } ${i % 2 === 1 ? "bg-gray-50" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-navy">
                  {section.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{section.topics}</p>
              </div>
              <span className="flex-shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-500">
                {section.weight}
              </span>
            </div>
          ))}
        </div>

        {/* Footnote */}
        {"footnote" in examTable && examTable.footnote && (
          <div
            className="mt-6 rounded-r-lg border-l-4 border-blue-500 bg-blue-100/40 p-5"
            style={fadeUp(isInView, 250)}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={16}
                className="mt-0.5 flex-shrink-0 text-blue-500"
              />
              <p className="text-sm leading-relaxed text-gray-700">
                {examTable.footnote}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
