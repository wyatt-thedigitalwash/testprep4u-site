import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import type { Course } from "@/lib/mock-data";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const typeLabel = course.type === "life" ? "Life" : "Health";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
            {typeLabel}
          </span>
          <h3 className="mt-2 font-display text-lg font-semibold text-navy">
            {course.name}
          </h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <BookOpen size={20} className="text-blue-500" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>
            {course.completedChapters} of {course.totalChapters} chapters
          </span>
          <span className="font-semibold text-navy">{course.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      {/* Last activity */}
      {course.lastActivity && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={12} />
          Last activity:{" "}
          {new Date(course.lastActivity).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      )}
      {!course.lastActivity && (
        <p className="mb-4 text-xs text-gray-400">Not started yet</p>
      )}

      <Link
        href={`/dashboard/courses/${course.id}`}
        className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-5 py-2 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
      >
        {course.progress > 0 ? "Continue" : "Start Course"}
      </Link>
    </div>
  );
}
