import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  Award,
  FileCheck,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatHours, formatTime } from "@/lib/course-types";
import { StudentActions } from "@/components/admin/StudentActions";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function AdminStudentDetailPage({ params }: Props) {
  const { userId } = await params;
  const supabase = createAdminClient();

  // Fetch user from auth
  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  if (!authData?.user) redirect("/admin/students");
  const user = authData.user;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, state, plan_tier, phone, created_at, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!profile) redirect("/admin/students");

  // Fetch enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, status, enrolled_at, expires_at, affidavit_accepted_at, course_id, courses ( id, name, slug, type, state, required_hours )"
    )
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });

  // For each enrollment, get progress, time, exams, certificate
  const enrichedEnrollments = await Promise.all(
    (enrollments || []).map(async (enrollment) => {
      const course = enrollment.courses as unknown as {
        id: string;
        name: string;
        slug: string;
        type: string;
        state: string;
        required_hours: number;
      };

      // Module progress — sort by section number, then module sort_order
      const { data: allModulesRaw } = await supabase
        .from("course_modules")
        .select("id, title, module_type, sort_order, course_sections!inner(course_id, title, section_number, sort_order)")
        .eq("course_sections.course_id", course.id);

      const allModules = (allModulesRaw || []).sort((a, b) => {
        const secA = (a.course_sections as unknown as { sort_order: number }).sort_order;
        const secB = (b.course_sections as unknown as { sort_order: number }).sort_order;
        if (secA !== secB) return secA - secB;
        return a.sort_order - b.sort_order;
      });

      const moduleIds = allModules.map((m) => m.id);
      const { data: progressRows } = await supabase
        .from("module_progress")
        .select("module_id, status, score, time_spent_seconds, completed_at, success_status")
        .eq("enrollment_id", enrollment.id)
        .in("module_id", moduleIds);

      const progressMap = new Map(
        (progressRows || []).map((p) => [p.module_id, p])
      );

      const totalModules = moduleIds.length;
      const completedModules = (progressRows || []).filter(
        (p) => p.status === "completed"
      ).length;

      // Time logs
      const { data: timeLogs } = await supabase
        .from("time_logs")
        .select("duration_seconds")
        .eq("enrollment_id", enrollment.id);

      const totalTimeSeconds = (timeLogs || []).reduce(
        (sum, t) => sum + t.duration_seconds,
        0
      );

      // Exam attempts
      const { data: examAttempts } = await supabase
        .from("exam_attempts")
        .select("id, exam_type, score, passed, total_questions, correct_answers, time_spent_seconds, attempted_at, mode")
        .eq("enrollment_id", enrollment.id)
        .order("attempted_at", { ascending: false });

      // Certificate
      const { data: certificate } = await supabase
        .from("certificates")
        .select("id, certificate_number, issued_at, hours_completed")
        .eq("enrollment_id", enrollment.id)
        .maybeSingle();

      return {
        ...enrollment,
        course,
        modules: (allModules || []).map((m) => ({
          ...m,
          section: m.course_sections as unknown as {
            course_id: string;
            title: string;
            section_number: number;
          },
          progress: progressMap.get(m.id) || null,
        })),
        totalModules,
        completedModules,
        totalTimeSeconds,
        examAttempts: examAttempts || [],
        certificate,
      };
    })
  );

  const primaryEnrollment = enrichedEnrollments[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Back to Students
      </Link>

      {/* Student header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900">
              {profile.full_name || "Unknown"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail size={14} /> {user.email}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {profile.state || "—"}
              </span>
              {profile.phone && <span>{profile.phone}</span>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {profile.plan_tier && (
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-violet-600">
                  {profile.plan_tier} Plan
                </span>
              )}
              <span className="text-xs text-gray-400">
                Joined{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            <span className="font-mono">{userId.slice(0, 8)}…</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <StudentActions
        userId={userId}
        currentTier={profile.plan_tier}
        enrollmentStatus={primaryEnrollment?.status || null}
      />

      {/* Enrollments */}
      {enrichedEnrollments.map((enrollment) => (
        <div
          key={enrollment.id}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* Enrollment header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-violet-500" />
                <h3 className="font-display text-lg font-semibold text-gray-900">
                  {enrollment.course.name}
                </h3>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                <span>
                  Enrolled{" "}
                  {new Date(enrollment.enrolled_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>
                  Expires{" "}
                  {new Date(enrollment.expires_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                enrollment.status === "active"
                  ? "bg-emerald-100 text-emerald-600"
                  : enrollment.status === "completed"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {enrollment.status}
            </span>
          </div>

          {/* Progress summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatMini
              label="Modules"
              value={`${enrollment.completedModules} / ${enrollment.totalModules}`}
            />
            <StatMini
              label="Progress"
              value={`${enrollment.totalModules > 0 ? Math.round((enrollment.completedModules / enrollment.totalModules) * 100) : 0}%`}
            />
            <StatMini
              label="Seat Time"
              value={`${formatHours(enrollment.totalTimeSeconds)}h / ${enrollment.course.required_hours}h`}
            />
            <StatMini
              label="Exams Taken"
              value={String(enrollment.examAttempts.length)}
            />
          </div>

          {/* Module progress table */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-violet-600 hover:text-violet-700">
              Module Progress ({enrollment.completedModules}/{enrollment.totalModules})
            </summary>
            <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="px-3 py-2 text-left font-semibold">Module</th>
                    <th className="px-3 py-2 text-left font-semibold">Section</th>
                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                    <th className="px-3 py-2 text-left font-semibold">Score</th>
                    <th className="px-3 py-2 text-left font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {enrollment.modules.map((mod) => (
                    <tr key={mod.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700">
                        {mod.title}
                        {mod.module_type === "quiz" && (
                          <span className="ml-1 text-gray-400">(Quiz)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        Part {mod.section.section_number}
                      </td>
                      <td className="px-3 py-2">
                        {mod.progress?.status === "completed" ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={12} /> Complete
                          </span>
                        ) : mod.progress?.status === "in_progress" ? (
                          <span className="text-blue-500">In Progress</span>
                        ) : (
                          <span className="text-gray-400">Not Started</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {mod.progress?.score != null
                          ? `${mod.progress.score}%`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {mod.progress?.time_spent_seconds
                          ? formatTime(mod.progress.time_spent_seconds)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Exam attempts */}
          {enrollment.examAttempts.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-violet-600 hover:text-violet-700">
                Exam Attempts ({enrollment.examAttempts.length})
              </summary>
              <div className="mt-3 rounded-lg border border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="px-3 py-2 text-left font-semibold">Type</th>
                      <th className="px-3 py-2 text-left font-semibold">Mode</th>
                      <th className="px-3 py-2 text-left font-semibold">Score</th>
                      <th className="px-3 py-2 text-left font-semibold">Result</th>
                      <th className="px-3 py-2 text-left font-semibold">Questions</th>
                      <th className="px-3 py-2 text-left font-semibold">Time</th>
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {enrollment.examAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 capitalize text-gray-700">
                          {attempt.exam_type}
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-500">
                          {attempt.mode || "learning"}
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          {attempt.score}%
                        </td>
                        <td className="px-3 py-2">
                          {attempt.passed ? (
                            <span className="text-emerald-600">Pass</span>
                          ) : (
                            <span className="text-red-500">Fail</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {attempt.correct_answers}/{attempt.total_questions}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {formatTime(attempt.time_spent_seconds)}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(attempt.attempted_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Certificate & Affidavit status */}
          <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-xs">
              <FileCheck
                size={14}
                className={
                  enrollment.affidavit_accepted_at
                    ? "text-emerald-500"
                    : "text-gray-300"
                }
              />
              <span className="text-gray-500">
                Affidavit:{" "}
                {enrollment.affidavit_accepted_at
                  ? `Signed ${new Date(enrollment.affidavit_accepted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : "Not signed"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Award
                size={14}
                className={
                  enrollment.certificate
                    ? "text-emerald-500"
                    : "text-gray-300"
                }
              />
              <span className="text-gray-500">
                Certificate:{" "}
                {enrollment.certificate
                  ? `#${enrollment.certificate.certificate_number}`
                  : "Not issued"}
              </span>
            </div>
          </div>
        </div>
      ))}

      {enrichedEnrollments.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-400">
            This student has no enrollments.
          </p>
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
      <p className="font-display text-sm font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
