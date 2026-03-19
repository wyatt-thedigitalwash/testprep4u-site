"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Play, ClipboardCheck, ArrowLeft } from "lucide-react";
import { getCourse, getChapters, getExamAttempts } from "@/lib/mock-data";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { ChapterList } from "@/components/dashboard/ChapterList";
import { ScormViewer } from "@/components/dashboard/ScormViewer";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [showScorm, setShowScorm] = useState(false);

  const course = getCourse(courseId);
  const chapters = getChapters(courseId);
  const attempts = getExamAttempts(courseId);
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
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-navy"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Course header */}
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
            {course.type === "life" ? "Life" : "Health"}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-navy">
            {course.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{course.description}</p>
          <p className="mt-2 text-xs text-gray-400">
            {course.completedChapters} of {course.totalChapters} chapters
            complete
          </p>
        </div>
        <ProgressRing percentage={course.progress} size={100} strokeWidth={8} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chapters — left, wider */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">
              Chapters
            </h3>
            <button
              onClick={() => setShowScorm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
            >
              <Play size={16} /> Launch Course
            </button>
          </div>
          <ChapterList chapters={chapters} />
        </div>

        {/* Sidebar — right */}
        <div className="space-y-4">
          {/* Practice exams card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-blue-500" />
              <h4 className="font-display text-sm font-semibold text-navy">
                Practice Exams
              </h4>
            </div>

            {latestScore !== null ? (
              <div className="mt-3">
                <p className="text-xs text-gray-500">Latest Score</p>
                <p className="font-display text-2xl font-bold text-navy">
                  {latestScore}%
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-gray-500">
                No attempts yet. Start a practice exam to track your progress.
              </p>
            )}

            <Link
              href={`/dashboard/courses/${courseId}/exams`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg border-2 border-blue-500 px-4 py-2 font-body text-sm font-bold text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white"
            >
              View Exam Results
            </Link>
          </div>

          {/* Course info card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="font-display text-sm font-semibold text-navy">
              Course Info
            </h4>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-navy">
                  {course.type === "life" ? "Life Insurance" : "Health Insurance"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Chapters</dt>
                <dd className="font-medium text-navy">{course.totalChapters}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Progress</dt>
                <dd className="font-medium text-navy">{course.progress}%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* SCORM modal */}
      {showScorm && <ScormViewer onClose={() => setShowScorm(false)} />}
    </div>
  );
}
