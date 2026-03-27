import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { getUserEnrollments } from "@/lib/course-data";

export default async function CoursesPage() {
  const enrollments = await getUserEnrollments();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">
          My Courses
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Your enrolled courses and progress.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            You don&apos;t have any active courses yet.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-2.5 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {enrollments.map((e) => (
            <div
              key={e.enrollmentId}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
                    {e.courseType === "life"
                      ? "Life"
                      : e.courseType === "health"
                        ? "Health"
                        : "Combined"}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-semibold text-navy">
                    {e.courseName}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <BookOpen size={20} className="text-blue-500" />
                </div>
              </div>

              <dl className="mb-4 space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  Enrolled{" "}
                  {new Date(e.enrolledAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div>
                  Expires{" "}
                  {new Date(e.expiresAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </dl>

              <Link
                href={`/dashboard/courses/${e.courseSlug}`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-5 py-2 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
              >
                {e.hasStarted ? "Continue Course" : "Start Course"}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
