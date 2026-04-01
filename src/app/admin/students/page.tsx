import { Suspense } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { StudentSearch } from "@/components/admin/StudentSearch";
import { formatHours } from "@/lib/course-types";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

const PAGE_SIZE = 50;

export default async function AdminStudentsPage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const supabase = createAdminClient();

  // Get all users with auth email via admin API
  // We need emails which aren't in profiles — they're in auth.users
  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  const emailMap = new Map<string, string>();
  for (const u of authUsers || []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  // Fetch profiles (non-admin)
  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, state, plan_tier, created_at", { count: "exact" })
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  // Server-side name search
  if (q && q.trim()) {
    profileQuery = profileQuery.ilike("full_name", `%${q.trim()}%`);
  }

  const { data: profiles, count: totalCount } = await profileQuery
    .range(offset, offset + PAGE_SIZE - 1);

  const studentIds = (profiles || []).map((p) => p.id);

  // Also search by email if name search returned few results
  let emailMatchIds: string[] = [];
  if (q && q.trim() && (profiles || []).length < PAGE_SIZE) {
    const searchLower = q.trim().toLowerCase();
    for (const [id, email] of emailMap) {
      if (email.toLowerCase().includes(searchLower) && !studentIds.includes(id)) {
        emailMatchIds.push(id);
      }
    }
    if (emailMatchIds.length > 0) {
      const { data: emailProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, state, plan_tier, created_at")
        .eq("is_admin", false)
        .in("id", emailMatchIds.slice(0, 20));
      if (emailProfiles) {
        profiles?.push(...emailProfiles);
      }
    }
  }

  // Fetch enrollments for all displayed students
  const allStudentIds = (profiles || []).map((p) => p.id);
  let enrollmentData: Array<{
    user_id: string;
    status: string;
    enrolled_at: string;
    expires_at: string;
    course_id: string;
    courses: { name: string; type: string } | null;
  }> = [];

  if (allStudentIds.length > 0) {
    const { data } = await supabase
      .from("enrollments")
      .select("user_id, status, enrolled_at, expires_at, course_id, courses ( name, type )")
      .in("user_id", allStudentIds);
    enrollmentData = (data || []) as unknown as typeof enrollmentData;
  }

  // Fetch progress data: completed modules per enrollment
  const enrollmentIds = enrollmentData.map((e) => `${e.user_id}:${e.course_id}`);
  let progressMap = new Map<string, { completed: number; total: number }>();
  let timeMap = new Map<string, number>();

  if (allStudentIds.length > 0) {
    // Get all enrollments with IDs
    const { data: enrollmentsWithIds } = await supabase
      .from("enrollments")
      .select("id, user_id, course_id")
      .in("user_id", allStudentIds);

    if (enrollmentsWithIds && enrollmentsWithIds.length > 0) {
      const eIds = enrollmentsWithIds.map((e) => e.id);

      // Module progress counts
      const { data: progressRows } = await supabase
        .from("module_progress")
        .select("enrollment_id, status")
        .in("enrollment_id", eIds);

      // Time logs
      const { data: timeLogs } = await supabase
        .from("time_logs")
        .select("enrollment_id, duration_seconds")
        .in("enrollment_id", eIds);

      // Total modules per course
      const courseIdSet = new Set(enrollmentsWithIds.map((e) => e.course_id));
      const { data: allModules } = await supabase
        .from("course_modules")
        .select("id, course_sections!inner(course_id)")
        .in("course_sections.course_id", Array.from(courseIdSet));

      const modulesPerCourse = new Map<string, number>();
      for (const m of allModules || []) {
        const cid = (m.course_sections as unknown as { course_id: string })
          .course_id;
        modulesPerCourse.set(cid, (modulesPerCourse.get(cid) || 0) + 1);
      }

      // Build maps keyed by user_id
      const enrollmentLookup = new Map(
        enrollmentsWithIds.map((e) => [e.id, e])
      );

      for (const row of progressRows || []) {
        const enrollment = enrollmentLookup.get(row.enrollment_id);
        if (!enrollment) continue;
        const key = enrollment.user_id;
        const prev = progressMap.get(key) || {
          completed: 0,
          total: modulesPerCourse.get(enrollment.course_id) || 0,
        };
        if (row.status === "completed") prev.completed++;
        if (!progressMap.has(key))
          prev.total = modulesPerCourse.get(enrollment.course_id) || 0;
        progressMap.set(key, prev);
      }

      // Fill in total for students with no progress
      for (const e of enrollmentsWithIds) {
        if (!progressMap.has(e.user_id)) {
          progressMap.set(e.user_id, {
            completed: 0,
            total: modulesPerCourse.get(e.course_id) || 0,
          });
        }
      }

      for (const row of timeLogs || []) {
        const enrollment = enrollmentLookup.get(row.enrollment_id);
        if (!enrollment) continue;
        const key = enrollment.user_id;
        timeMap.set(key, (timeMap.get(key) || 0) + row.duration_seconds);
      }
    }
  }

  // Build enrollment map by user_id — prefer first active enrollment found
  const userEnrollmentMap = new Map<
    string,
    (typeof enrollmentData)[0]
  >();
  for (const e of enrollmentData) {
    const existing = userEnrollmentMap.get(e.user_id);
    if (!existing) {
      userEnrollmentMap.set(e.user_id, e);
    } else if (existing.status !== "active" && e.status === "active") {
      userEnrollmentMap.set(e.user_id, e);
    }
  }

  const displayTotal = (totalCount || 0) + emailMatchIds.length;
  const totalPages = Math.ceil(displayTotal / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Students
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {displayTotal} total students
        </p>
      </div>

      <Suspense>
        <StudentSearch />
      </Suspense>

      {/* Students table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Course
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Enrolled
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Seat Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(profiles || []).map((student) => {
                const email = emailMap.get(student.id) || "";
                const enrollment = userEnrollmentMap.get(student.id);
                const course = enrollment?.courses as unknown as {
                  name: string;
                  type: string;
                } | null;
                const progress = progressMap.get(student.id);
                const progressPct =
                  progress && progress.total > 0
                    ? Math.round(
                        (progress.completed / progress.total) * 100
                      )
                    : 0;
                const seatTimeSeconds = timeMap.get(student.id) || 0;
                const status = enrollment?.status || "no enrollment";

                return (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="block"
                      >
                        <p className="text-sm font-medium text-gray-900 hover:text-violet-600">
                          {student.full_name || "—"}
                        </p>
                        <p className="text-xs text-gray-400">{email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {course?.name
                        ? course.name.length > 30
                          ? course.name.slice(0, 30) + "…"
                          : course.name
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {student.plan_tier ? (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold capitalize text-violet-600">
                          {student.plan_tier}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {enrollment
                        ? new Date(enrollment.enrolled_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "2-digit" }
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {enrollment
                        ? new Date(enrollment.expires_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "2-digit" }
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-gray-200">
                          <div
                            className={`h-1.5 rounded-full ${
                              progressPct === 100
                                ? "bg-emerald-500"
                                : "bg-violet-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {progressPct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {seatTimeSeconds > 0
                        ? `${formatHours(seatTimeSeconds)}h`
                        : "0h"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          status === "active"
                            ? "bg-emerald-100 text-emerald-600"
                            : status === "completed"
                              ? "bg-blue-100 text-blue-600"
                              : status === "expired"
                                ? "bg-red-100 text-red-500"
                                : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {status === "no enrollment" ? "No enrollment" : status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(!profiles || profiles.length === 0) && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-sm text-gray-400"
                  >
                    {q ? "No students match your search." : "No students yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/students?${new URLSearchParams({ ...(q ? { q } : {}), page: String(currentPage - 1) }).toString()}`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/students?${new URLSearchParams({ ...(q ? { q } : {}), page: String(currentPage + 1) }).toString()}`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
