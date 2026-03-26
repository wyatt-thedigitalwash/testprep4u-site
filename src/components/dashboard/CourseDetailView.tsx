"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Check,
  Lock,
  Play,
  ChevronDown,
  FileQuestion,
  AlertTriangle,
  Award,
  BookOpen,
  Circle,
} from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import type { CourseDetail, SectionWithProgress } from "@/lib/course-types";
import { formatTime, formatHours } from "@/lib/course-types";

interface CourseDetailViewProps {
  detail: CourseDetail;
  courseSlug: string;
}

export function CourseDetailView({ detail, courseSlug }: CourseDetailViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Auto-expand the first unlocked incomplete section
    const first = detail.sections.find(
      (s) =>
        s.isUnlocked && s.completedModules < s.totalModules
    );
    return new Set(first ? [first.id] : []);
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const hoursLogged = detail.totalTimeSeconds / 3600;
  const hoursRequired = detail.requiredTimeSeconds / 3600;
  const hoursPercent = Math.min(
    100,
    Math.round((hoursLogged / hoursRequired) * 100)
  );

  return (
    <>
      {/* Course header */}
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
            {detail.enrollment.courseType === "life"
              ? "Life"
              : detail.enrollment.courseType === "health"
                ? "Health"
                : "Combined"}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-navy">
            {detail.enrollment.courseName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {detail.completedModules} of {detail.totalModules} modules complete
          </p>
        </div>
        <ProgressRing
          percentage={detail.progressPercent}
          size={100}
          strokeWidth={8}
        />
      </div>

      {/* Seat time tracker */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-500" />
            <h3 className="font-display text-sm font-semibold text-navy">
              Seat Time Requirement
            </h3>
          </div>
          <span className="text-sm font-bold text-navy">
            {formatHours(detail.totalTimeSeconds)} /{" "}
            {hoursRequired}h
          </span>
        </div>
        <div className="h-3 rounded-full bg-gray-200">
          <div
            className={`h-3 rounded-full transition-all duration-700 ease-out ${
              detail.meetsHourRequirement ? "bg-success" : "bg-blue-500"
            }`}
            style={{ width: `${hoursPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {detail.meetsHourRequirement
              ? "Requirement met"
              : `${formatHours(detail.requiredTimeSeconds - detail.totalTimeSeconds)}h remaining`}
          </span>
          <span>{hoursPercent}%</span>
        </div>
      </div>

      {/* Sections accordion */}
      <div className="space-y-3">
        {detail.sections.map((section) => (
          <SectionAccordion
            key={section.id}
            section={section}
            courseSlug={courseSlug}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>

      {/* Final exam & certificate section */}
      <FinalExamCard detail={detail} courseSlug={courseSlug} />
    </>
  );
}

/* ── Section Accordion ─────────────────────────────────────── */

function SectionAccordion({
  section,
  courseSlug,
  isExpanded,
  onToggle,
}: {
  section: SectionWithProgress;
  courseSlug: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const allComplete = section.completedModules === section.totalModules;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Section header — clickable */}
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${
          !section.isUnlocked ? "opacity-60" : "hover:bg-gray-50"
        }`}
        disabled={!section.isUnlocked}
      >
        {/* Status icon */}
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
            !section.isUnlocked
              ? "bg-gray-100"
              : allComplete
                ? "bg-success-light"
                : "bg-blue-100"
          }`}
        >
          {!section.isUnlocked ? (
            <Lock size={16} className="text-gray-300" />
          ) : allComplete ? (
            <Check size={16} className="text-success" />
          ) : (
            <BookOpen size={16} className="text-blue-500" />
          )}
        </div>

        {/* Section info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">
              Part {section.sectionNumber}
            </span>
            {section.quizStatus === "passed" && (
              <span className="rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success">
                Quiz Passed
              </span>
            )}
            {section.quizStatus === "failed" && (
              <span className="rounded-full bg-error-light px-2 py-0.5 text-xs font-semibold text-error">
                Quiz: {section.quizScore}%
              </span>
            )}
          </div>
          <p
            className={`text-sm font-semibold ${
              !section.isUnlocked ? "text-gray-400" : "text-navy"
            }`}
          >
            {section.title}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
            <span>
              {section.completedModules}/{section.totalModules} modules
            </span>
            {section.totalTimeSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatTime(section.totalTimeSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Section progress bar (mini) */}
        {section.isUnlocked && (
          <div className="hidden w-24 sm:block">
            <div className="h-1.5 rounded-full bg-gray-200">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  allComplete ? "bg-success" : "bg-blue-500"
                }`}
                style={{
                  width: `${section.totalModules > 0 ? (section.completedModules / section.totalModules) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Chevron */}
        {section.isUnlocked && (
          <ChevronDown
            size={18}
            className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Module list (expanded) */}
      {isExpanded && section.isUnlocked && (
        <div className="border-t border-gray-100 px-5 py-3">
          <div className="space-y-1">
            {section.modules.map((mod) => {
              const isCompleted = mod.progress?.status === "completed";
              const isInProgress = mod.progress?.status === "in_progress";
              const isLocked = !mod.isUnlocked;
              const isQuiz = mod.moduleType === "quiz";

              const timeSeconds =
                mod.progress?.timeSpentSeconds || 0;

              // SCORM-based quizzes (with scormEntryPath) load in the module launcher.
              // Native quizzes (no scormEntryPath) go to the dedicated quiz page.
              let href: string;
              if (isQuiz && !mod.scormEntryPath) {
                href = `/dashboard/courses/${courseSlug}/quiz/${section.sectionNumber}`;
              } else {
                href = `/dashboard/courses/${courseSlug}/module/${mod.id}`;
              }

              return (
                <div
                  key={mod.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                    isLocked
                      ? "opacity-50"
                      : "transition-colors hover:bg-gray-50"
                  }`}
                >
                  {/* Status icon */}
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      isLocked
                        ? "bg-gray-100"
                        : isCompleted
                          ? "bg-success-light"
                          : isInProgress
                            ? "bg-blue-100"
                            : "bg-gray-100"
                    }`}
                  >
                    {isLocked ? (
                      <Lock size={12} className="text-gray-300" />
                    ) : isCompleted ? (
                      <Check size={12} className="text-success" />
                    ) : isQuiz ? (
                      <FileQuestion size={12} className={isInProgress ? "text-blue-500" : "text-gray-400"} />
                    ) : isInProgress ? (
                      <Circle size={12} className="text-blue-500" />
                    ) : (
                      <Circle size={12} className="text-gray-300" />
                    )}
                  </div>

                  {/* Module info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        isLocked
                          ? "text-gray-400"
                          : isCompleted
                            ? "font-medium text-gray-600"
                            : "font-medium text-navy"
                      }`}
                    >
                      {mod.title}
                    </p>
                  </div>

                  {/* Time spent */}
                  {timeSeconds > 0 && (
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {formatTime(timeSeconds)}
                    </span>
                  )}

                  {/* Quiz score badge */}
                  {isQuiz && mod.progress?.score !== null && mod.progress?.score !== undefined && (
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        mod.progress.successStatus === "passed"
                          ? "bg-success-light text-success"
                          : "bg-error-light text-error"
                      }`}
                    >
                      {mod.progress.score}%
                    </span>
                  )}

                  {/* Status badge */}
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isLocked
                        ? "bg-gray-100 text-gray-400"
                        : isCompleted
                          ? "bg-success-light text-success"
                          : isInProgress
                            ? "bg-blue-100 text-blue-500"
                            : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isLocked
                      ? "Locked"
                      : isCompleted
                        ? "Done"
                        : isInProgress
                          ? "In Progress"
                          : "Not Started"}
                  </span>

                  {/* Launch link */}
                  {!isLocked && !isCompleted && (
                    <Link
                      href={href}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600"
                    >
                      <Play size={12} />
                    </Link>
                  )}
                  {!isLocked && isCompleted && (
                    <Link
                      href={href}
                      className="flex-shrink-0 text-xs font-medium text-blue-500 transition-colors hover:text-blue-600"
                    >
                      Review
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Final Exam & Certificate Card ─────────────────────────── */

function FinalExamCard({
  detail,
  courseSlug,
}: {
  detail: CourseDetail;
  courseSlug: string;
}) {
  const blockers: string[] = [];
  if (!detail.allSectionsComplete)
    blockers.push("Complete all course sections");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            detail.finalExamPassed ? "bg-success-light" : "bg-blue-100"
          }`}
        >
          <Award
            size={22}
            className={
              detail.finalExamPassed ? "text-success" : "text-blue-500"
            }
          />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-navy">
            Final Exam & Certificate
          </h3>
          <p className="text-sm text-gray-500">
            {detail.finalExamPassed
              ? "Final exam passed!"
              : "Pass the final exam to earn your certificate"}
          </p>
        </div>
      </div>

      {/* Blockers */}
      {!detail.canTakeFinalExam && blockers.length > 0 && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning-light p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle size={16} />
            Before you can take the final exam:
          </div>
          <ul className="mt-2 space-y-1 pl-6">
            {blockers.map((b) => (
              <li key={b} className="list-disc text-sm text-gray-600">
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Certificate status — affidavit needed */}
      {detail.finalExamPassed &&
        detail.meetsHourRequirement &&
        !detail.hasAffidavit && (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-100/40 p-4">
            <p className="text-sm text-gray-600">
              Final exam passed. Complete the self-study affidavit to receive
              your certificate.
            </p>
          </div>
        )}

      {/* Certificate status — ready */}
      {detail.canGetCertificate && (
        <div className="mt-4 rounded-lg border border-success/30 bg-success-light p-4">
          <p className="text-sm font-semibold text-success">
            Your certificate is ready for download.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-5 flex flex-wrap gap-3">
        {detail.canTakeFinalExam ? (
          <Link
            href={`/dashboard/courses/${courseSlug}/practice-exam`}
            className="inline-flex items-center justify-center rounded-lg border-2 border-blue-500 px-6 py-2.5 font-body text-sm font-bold text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white"
          >
            Practice Exam
          </Link>
        ) : (
          <div className="group relative">
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-200 px-6 py-2.5 font-body text-sm font-bold text-gray-400"
            >
              <Lock size={14} />
              Practice Exam
            </button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Complete all sections to unlock
            </span>
          </div>
        )}

        {/* Final exam button */}
        {detail.finalExamPassed ? null : detail.canTakeFinalExam ? (
          <Link
            href={`/dashboard/courses/${courseSlug}/final-exam`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-2.5 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
          >
            Take Final Exam
          </Link>
        ) : (
          <div className="group relative">
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-2.5 font-body text-sm font-bold text-gray-400"
            >
              <Lock size={14} />
              Final Exam
            </button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Complete all sections to unlock
            </span>
          </div>
        )}

        {/* Affidavit button — show after final exam passed + hours met */}
        {detail.finalExamPassed &&
          detail.meetsHourRequirement &&
          !detail.hasAffidavit && (
            <Link
              href={`/dashboard/courses/${courseSlug}/affidavit`}
              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-2.5 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
            >
              Sign Affidavit
            </Link>
          )}

        {/* Certificate button — show after affidavit signed */}
        {detail.canGetCertificate && (
          <Link
            href={`/dashboard/courses/${courseSlug}/certificate`}
            className="inline-flex items-center justify-center rounded-lg bg-success px-6 py-2.5 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-success/90"
          >
            View Certificate
          </Link>
        )}
      </div>
    </div>
  );
}
