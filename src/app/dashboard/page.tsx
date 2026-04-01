import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  BookOpen,
  Clock,
  Target,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserEnrollments, getDashboardStats } from "@/lib/course-data";
import { formatHours } from "@/lib/course-types";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Student";

  const [enrollments, stats] = await Promise.all([
    getUserEnrollments(),
    getDashboardStats(),
  ]);

  // Batch-fetch progress data for all enrollments
  const enrollmentIds = enrollments.map((e) => e.enrollmentId);
  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];

  // Get total module count per course
  let courseModuleCounts = new Map<string, number>();
  if (courseIds.length > 0) {
    const { data: moduleCounts } = await supabase
      .from("course_modules")
      .select("id, course_sections!inner(course_id)")
      .in("course_sections.course_id", courseIds);

    for (const row of moduleCounts || []) {
      const cid = (row.course_sections as unknown as { course_id: string })
        .course_id;
      courseModuleCounts.set(cid, (courseModuleCounts.get(cid) || 0) + 1);
    }
  }

  // Get completed module count per enrollment
  let enrollmentCompletedCounts = new Map<string, number>();
  if (enrollmentIds.length > 0) {
    const { data: completedRows } = await supabase
      .from("module_progress")
      .select("enrollment_id")
      .in("enrollment_id", enrollmentIds)
      .eq("status", "completed");

    for (const row of completedRows || []) {
      enrollmentCompletedCounts.set(
        row.enrollment_id,
        (enrollmentCompletedCounts.get(row.enrollment_id) || 0) + 1
      );
    }
  }

  // Get total time per enrollment
  let enrollmentTimeTotals = new Map<string, number>();
  if (enrollmentIds.length > 0) {
    const { data: timeLogs } = await supabase
      .from("time_logs")
      .select("enrollment_id, duration_seconds")
      .in("enrollment_id", enrollmentIds);

    for (const row of timeLogs || []) {
      enrollmentTimeTotals.set(
        row.enrollment_id,
        (enrollmentTimeTotals.get(row.enrollment_id) || 0) +
          row.duration_seconds
      );
    }
  }

  const statItems = [
    {
      label: "Study Hours",
      value: `${stats.totalStudyHours}h`,
      icon: Clock,
      color: "bg-blue-100 text-blue-500",
    },
    {
      label: "Practice Exam Avg",
      value: stats.practiceExamAvg > 0 ? `${stats.practiceExamAvg}%` : "—",
      icon: Target,
      color: "bg-success-light text-success",
    },
    {
      label: "Courses Enrolled",
      value: String(stats.coursesEnrolled),
      icon: BookOpen,
      color: "bg-warning-light text-warning",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">
          Welcome back, {firstName}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s an overview of your progress.
        </p>
      </div>

      {/* Milestone callout */}
      <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-100/40 p-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          <ShieldCheck size={22} className="text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-navy">
            Upcoming Milestone
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            Score 80%+ on 3 practice exams to qualify for the Pass Guarantee.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statItems.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon size={20} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-navy">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enrolled courses */}
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold text-navy">
          Your Courses
        </h3>
        {enrollments.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <GraduationCap size={28} className="text-gray-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-navy">
              No courses yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Get started on your path to becoming a licensed insurance
              professional.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-8 py-3 font-body font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
            >
              Browse Courses
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {enrollments.map((e) => {
              const totalModules = courseModuleCounts.get(e.courseId) || 0;
              const completedModules =
                enrollmentCompletedCounts.get(e.enrollmentId) || 0;
              const totalTimeSeconds =
                enrollmentTimeTotals.get(e.enrollmentId) || 0;
              const progressPercent =
                totalModules > 0
                  ? Math.round((completedModules / totalModules) * 100)
                  : 0;

              const status: "completed" | "in_progress" | "not_started" =
                e.status === "completed"
                  ? "completed"
                  : e.hasStarted
                    ? "in_progress"
                    : "not_started";

              const statusConfig = {
                completed: {
                  label: "Completed",
                  classes: "bg-success-light text-success",
                },
                in_progress: {
                  label: "In Progress",
                  classes: "bg-blue-100 text-blue-500",
                },
                not_started: {
                  label: "Not Started",
                  classes: "bg-gray-100 text-gray-500",
                },
              };

              const { label: statusLabel, classes: statusClasses } =
                statusConfig[status];

              const typeLabel =
                e.courseType === "life"
                  ? "Life"
                  : e.courseType === "health"
                    ? "Health"
                    : "Combined";

              return (
                <div
                  key={e.enrollmentId}
                  className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  {/* Card header with gradient accent */}
                  <div className="rounded-t-xl bg-gradient-to-r from-navy to-navy/90 px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white/90">
                            {typeLabel}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <h3 className="mt-2.5 font-display text-lg font-bold leading-snug text-white">
                          {e.courseName}
                        </h3>
                      </div>
                      <div className="ml-4 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <BookOpen size={22} className="text-white/80" />
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-6 py-5">
                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Overall Progress
                        </span>
                        <span className="font-display text-sm font-bold text-navy">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-200">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${
                            status === "completed"
                              ? "bg-success"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="mb-5 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                          <Layers size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="font-display text-sm font-bold text-navy">
                            {completedModules} / {totalModules}
                          </p>
                          <p className="text-xs text-gray-500">Modules</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                          <Clock size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="font-display text-sm font-bold text-navy">
                            {formatHours(totalTimeSeconds)} / {e.requiredHours}h
                          </p>
                          <p className="text-xs text-gray-500">Hours</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/dashboard/courses/${e.courseSlug}`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-body font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
                    >
                      {status === "completed" ? (
                        <>
                          View Course
                          <CheckCircle2 size={16} />
                        </>
                      ) : e.hasStarted ? (
                        <>
                          Continue Course
                          <ArrowRight size={16} />
                        </>
                      ) : (
                        <>
                          Launch Course
                          <ArrowRight size={16} />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
