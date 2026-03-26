import Link from "next/link";
import { ClipboardCheck, Lock } from "lucide-react";
import {
  getUserEnrollments,
  getExamAttempts,
  checkAllSectionsComplete,
} from "@/lib/course-data";

export default async function ExamsIndexPage() {
  const enrollments = await getUserEnrollments();

  // Check section completion for all enrollments
  const completionMap = await checkAllSectionsComplete(
    enrollments.map((e) => ({
      enrollmentId: e.enrollmentId,
      courseId: e.courseId,
    }))
  );

  // Fetch exam attempts for each enrollment
  const coursesWithAttempts = await Promise.all(
    enrollments.map(async (e) => {
      const attempts = await getExamAttempts(e.courseSlug);
      const practiceAttempts = attempts.filter((a) => a.examType === "practice");
      const latestScore =
        practiceAttempts.length > 0
          ? practiceAttempts[practiceAttempts.length - 1].score
          : null;
      const allSectionsComplete =
        completionMap.get(e.enrollmentId) || false;
      return {
        enrollment: e,
        attemptCount: practiceAttempts.length,
        latestScore,
        allSectionsComplete,
      };
    })
  );

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

      {coursesWithAttempts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          No enrolled courses yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coursesWithAttempts.map(
            ({ enrollment, attemptCount, latestScore, allSectionsComplete }) =>
              allSectionsComplete ? (
                <Link
                  key={enrollment.enrollmentId}
                  href={`/dashboard/courses/${enrollment.courseSlug}/exams`}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <ClipboardCheck size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-navy">
                        {enrollment.courseName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {attemptCount} attempt
                        {attemptCount !== 1 ? "s" : ""}
                        {latestScore !== null && (
                          <> &middot; Latest: {latestScore}%</>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div
                  key={enrollment.enrollmentId}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-gray-400">
                        {enrollment.courseName}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Complete all course sections to unlock
                      </p>
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}
