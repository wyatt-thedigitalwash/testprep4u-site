import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { getExamAttempts } from "@/lib/course-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ScoreTrend } from "@/components/dashboard/ScoreTrend";
import { ExamHistory } from "@/components/dashboard/ExamHistory";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function ExamResultsPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createServerSupabaseClient();

  // Get course name
  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("slug", courseId)
    .single();

  if (!course) redirect("/dashboard");

  const allAttempts = await getExamAttempts(courseId);
  const practiceAttempts = allAttempts.filter((a) => a.examType === "practice");

  // Adapt to ExamHistory component's expected shape
  const attemptsForHistory = practiceAttempts.map((a, i) => ({
    id: i + 1,
    date: a.attemptedAt,
    score: a.score,
    totalQuestions: a.totalQuestions,
  }));

  const latestScore =
    practiceAttempts.length > 0
      ? practiceAttempts[practiceAttempts.length - 1].score
      : null;

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
      <ScoreTrend attempts={attemptsForHistory} />

      {/* Exam history */}
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold text-navy">
          Attempt History
        </h3>
        <ExamHistory attempts={attemptsForHistory} />
      </div>

      {/* Take exam buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href={`/dashboard/courses/${courseId}/practice-exam`}
          className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-8 py-3 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
        >
          Take Practice Exam
        </Link>
        <Link
          href={`/dashboard/courses/${courseId}/final-exam`}
          className="inline-flex items-center justify-center rounded-lg border-2 border-blue-500 px-8 py-3 font-body text-sm font-bold text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white"
        >
          Take Final Exam
        </Link>
      </div>
    </div>
  );
}
