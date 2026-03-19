"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { getCourse, getExamAttempts, getTopicBreakdown } from "@/lib/mock-data";
import { ScoreTrend } from "@/components/dashboard/ScoreTrend";
import { ExamHistory } from "@/components/dashboard/ExamHistory";
import { TopicBreakdown } from "@/components/dashboard/TopicBreakdown";

export default function ExamResultsPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const course = getCourse(courseId);
  const attempts = getExamAttempts(courseId);
  const topics = getTopicBreakdown(courseId);
  const latestScore = attempts.length > 0 ? attempts[attempts.length - 1].score : null;

  if (!course) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-gray-500">Course not found.</p>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-500"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-navy"
      >
        <ArrowLeft size={16} /> Back to {course.name}
      </Link>

      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">
          Practice Exam Results
        </h2>
        <p className="mt-1 text-sm text-gray-500">{course.name}</p>
      </div>

      {/* Readiness indicator */}
      {latestScore !== null && (
        <div
          className={`flex items-start gap-4 rounded-xl border p-5 ${
            latestScore >= 80
              ? "border-success/30 bg-success-light"
              : "border-blue-100 bg-blue-100/40"
          }`}
        >
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
              latestScore >= 80 ? "bg-success/10" : "bg-blue-500/10"
            }`}
          >
            <TrendingUp
              size={22}
              className={latestScore >= 80 ? "text-success" : "text-blue-500"}
            />
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${
                latestScore >= 80 ? "text-success" : "text-navy"
              }`}
            >
              {latestScore >= 80
                ? "You're on track for the Pass Guarantee!"
                : "You're getting close!"}
            </p>
            <p className="mt-0.5 text-sm text-gray-600">
              {latestScore >= 80
                ? "Keep it up — you're consistently scoring above the 80% target."
                : "Aim for 80%+ on your next attempt to qualify for the Pass Guarantee."}
            </p>
          </div>
        </div>
      )}

      {/* Score trend */}
      <ScoreTrend attempts={attempts} />

      {/* Exam history */}
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold text-navy">
          Attempt History
        </h3>
        <ExamHistory attempts={attempts} />
      </div>

      {/* Topic breakdown */}
      <TopicBreakdown topics={topics} />

      {/* Take exam button (placeholder) */}
      <div className="flex justify-center">
        <button
          disabled
          className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-8 py-3 font-body text-sm font-bold text-white opacity-50 shadow-sm"
        >
          Take Practice Exam (Coming Soon)
        </button>
      </div>
    </div>
  );
}
