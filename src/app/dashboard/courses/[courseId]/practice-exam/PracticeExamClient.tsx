"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardCheck } from "lucide-react";
import { QuizEngine, type QuizMode } from "@/components/dashboard/QuizEngine";

interface PracticeExamClientProps {
  courseId: string;
}

export function PracticeExamClient({ courseId }: PracticeExamClientProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<QuizMode | null>(null);

  // Mode selector screen
  if (!selectedMode) {
    return (
      <div className="mx-auto max-w-2xl py-4">
        <h2 className="mb-2 font-display text-2xl font-bold text-navy">
          Practice Exam
        </h2>
        <p className="mb-8 text-sm text-gray-500">
          Choose how you&apos;d like to take this practice exam.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Learning Mode */}
          <button
            onClick={() => setSelectedMode("learning")}
            className="group flex flex-col rounded-xl border-2 border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-500">
              <BookOpen
                size={24}
                className="text-blue-500 transition-colors group-hover:text-white"
              />
            </div>
            <h3 className="font-display text-lg font-bold text-navy">
              Learning Mode
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
              See explanations after each question. Great for studying and
              understanding concepts.
            </p>
            <ul className="mt-4 space-y-1.5">
              {[
                "Rationale shown after each answer",
                "Learn as you go",
                "No time pressure",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-xs text-gray-400"
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </button>

          {/* Exam Mode */}
          <button
            onClick={() => setSelectedMode("exam")}
            className="group flex flex-col rounded-xl border-2 border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-500">
              <ClipboardCheck
                size={24}
                className="text-blue-500 transition-colors group-hover:text-white"
              />
            </div>
            <h3 className="font-display text-lg font-bold text-navy">
              Exam Mode
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
              Simulate real exam conditions. No feedback until you submit — just
              like test day.
            </p>
            <ul className="mt-4 space-y-1.5">
              {[
                "No rationale until the end",
                "Mark questions for review",
                "Review all before submitting",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-xs text-gray-400"
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-4">
      <QuizEngine
        title={`Practice Exam — ${selectedMode === "learning" ? "Learning" : "Exam"} Mode`}
        courseId={courseId}
        quizType="practice"
        passScore={80}
        mode={selectedMode}
        onExit={() => router.push(`/dashboard/courses/${courseId}`)}
      />
    </div>
  );
}
