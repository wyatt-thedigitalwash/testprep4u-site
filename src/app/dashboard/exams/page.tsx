import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { courses, getExamAttempts } from "@/lib/mock-data";

export default function ExamsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">
          Practice Exams
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Review your practice exam results by course.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => {
          const attempts = getExamAttempts(course.id);
          const latestScore =
            attempts.length > 0 ? attempts[attempts.length - 1].score : null;

          return (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}/exams`}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <ClipboardCheck size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-navy">
                    {course.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
                    {latestScore !== null && (
                      <> &middot; Latest: {latestScore}%</>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
