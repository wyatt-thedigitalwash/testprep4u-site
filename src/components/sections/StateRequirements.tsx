"use client";

import type { StateData } from "@/lib/states";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import {
  Clock,
  Target,
  Building2,
  DollarSign,
  FileText,
  Landmark,
} from "lucide-react";
import { Info } from "lucide-react";

interface StateRequirementsProps {
  state: StateData;
}

export function StateRequirements({ state }: StateRequirementsProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  const requirements = [
    {
      icon: Clock,
      label: "Pre-Licensing Hours",
      value: `Life: ${state.requiredHours.life}hrs · Health: ${state.requiredHours.health}hrs · Combined: ${state.requiredHours.combined}hrs`,
    },
    {
      icon: Target,
      label: "Passing Score",
      value: state.passingScore,
    },
    {
      icon: Building2,
      label: "Testing Provider",
      value: state.testingProvider,
    },
    {
      icon: DollarSign,
      label: "Exam Fee",
      value: `${state.examFee} per attempt`,
    },
    {
      icon: FileText,
      label: "Exam Format",
      value: `Computer-based, multiple choice · ${state.examQuestions.life}–${state.examQuestions.combined} questions · ${state.examDuration}`,
    },
    {
      icon: Landmark,
      label: "Regulatory Body",
      value: state.regulatoryBody,
    },
  ];

  return (
    <section className="py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div style={fadeUp(isInView, 0)}>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">
            State Requirements
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy md:text-4xl">
            {state.name} Licensing Requirements
          </h2>
        </div>

        {/* Requirements grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requirements.map((req, i) => {
            const Icon = req.icon;
            return (
              <div
                key={req.label}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                style={fadeUp(isInView, 150 + i * 80)}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100">
                  <Icon size={20} className="text-blue-500" />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  {req.label}
                </p>
                <p className="mt-1 font-display text-base font-bold leading-snug text-navy">
                  {req.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* State-specific notes */}
        {state.stateSpecificNotes.length > 0 && (
          <div
            className="mt-10 rounded-xl border border-blue-200 bg-blue-100/30 p-6"
            style={fadeUp(isInView, 700)}
          >
            <div className="flex items-start gap-3">
              <Info
                size={20}
                className="mt-0.5 flex-shrink-0 text-blue-500"
              />
              <div>
                <p className="font-display text-base font-bold text-navy">
                  {state.name}-Specific Notes
                </p>
                <ul className="mt-2 space-y-2">
                  {state.stateSpecificNotes.map((note) => (
                    <li
                      key={note}
                      className="text-sm leading-relaxed text-gray-700"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
