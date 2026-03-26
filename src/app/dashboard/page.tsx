import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, BookOpen, Clock, Target } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserEnrollments, getDashboardStats } from "@/lib/course-data";

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

                <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={12} />
                  Enrolled{" "}
                  {new Date(e.enrolledAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                <Link
                  href={`/dashboard/courses/${e.courseSlug}`}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-5 py-2 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
                >
                  Continue
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
