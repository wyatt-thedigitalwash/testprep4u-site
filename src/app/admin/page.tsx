import Link from "next/link";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  const [
    { count: studentCount },
    { count: activeEnrollmentCount },
    { count: completedEnrollmentCount },
    { count: totalEnrollmentCount },
    { data: examScores },
    { data: recentEnrollments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", false),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("exam_attempts")
      .select("score")
      .eq("exam_type", "final"),
    supabase
      .from("enrollments")
      .select(
        `
        id,
        status,
        enrolled_at,
        expires_at,
        user_id,
        courses ( name, type, state ),
        profiles!enrollments_user_id_fkey ( full_name )
      `
      )
      .order("enrolled_at", { ascending: false })
      .limit(10),
  ]);

  // Revenue from Stripe
  let totalRevenue = 0;
  try {
    const stripe = getStripe();
    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const listParams: { limit: number; starting_after?: string } = {
        limit: 100,
      };
      if (startingAfter) listParams.starting_after = startingAfter;
      const charges = await stripe.charges.list(listParams);
      for (const charge of charges.data) {
        if (charge.status === "succeeded" && !charge.refunded) {
          totalRevenue += charge.amount;
        }
      }
      hasMore = charges.has_more;
      if (charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch {
    // Stripe not configured or error — revenue will show as $0
  }
  const totalRevenueDollars = totalRevenue / 100;

  // Average completion rate
  const total = totalEnrollmentCount || 0;
  const completed = completedEnrollmentCount || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Average final exam score
  const scores = (examScores || []).map((e) => e.score);
  const avgFinalScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const stats = [
    {
      label: "Total Students",
      value: String(studentCount || 0),
      icon: Users,
      color: "bg-violet-100 text-violet-600",
    },
    {
      label: "Active Enrollments",
      value: String(activeEnrollmentCount || 0),
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Completed",
      value: String(completed),
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenueDollars.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "bg-amber-100 text-amber-600",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: "bg-sky-100 text-sky-600",
    },
    {
      label: "Avg Final Exam",
      value: scores.length > 0 ? `${avgFinalScore}%` : "—",
      icon: BarChart3,
      color: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Overview
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Platform summary and key metrics.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
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
                <p className="font-display text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent enrollments */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-display text-sm font-semibold text-gray-900">
            Recent Enrollments
          </h3>
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 transition-colors hover:text-violet-700"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Student
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Course
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Enrolled
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Expires
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(recentEnrollments || []).map((e) => {
                const profile = e.profiles as unknown as {
                  full_name: string;
                } | null;
                const course = e.courses as unknown as {
                  name: string;
                  type: string;
                  state: string;
                } | null;
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      <Link
                        href={`/admin/students/${e.user_id}`}
                        className="hover:text-violet-600"
                      >
                        {profile?.full_name || "—"}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {course?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(e.enrolled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(e.expires_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          e.status === "active"
                            ? "bg-emerald-100 text-emerald-600"
                            : e.status === "completed"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(!recentEnrollments || recentEnrollments.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-gray-400"
                  >
                    No enrollments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
