import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}

export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Fetch all student profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, state, plan_tier, created_at")
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  // Fetch emails from auth
  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailMap = new Map<string, string>();
  for (const u of authUsers || []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  // Fetch enrollments
  const studentIds = (profiles || []).map((p) => p.id);
  let enrollmentMap = new Map<
    string,
    { course: string; status: string; enrolled: string; expires: string }
  >();

  if (studentIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("user_id, status, enrolled_at, expires_at, courses ( name )")
      .in("user_id", studentIds);

    for (const e of enrollments || []) {
      const course = e.courses as unknown as { name: string } | null;
      // Keep active enrollment or first one found
      if (!enrollmentMap.has(e.user_id) || e.status === "active") {
        enrollmentMap.set(e.user_id, {
          course: course?.name || "",
          status: e.status,
          enrolled: e.enrolled_at,
          expires: e.expires_at,
        });
      }
    }
  }

  // Fetch progress data
  let progressMap = new Map<string, { completed: number; total: number }>();
  let timeMap = new Map<string, number>();

  if (studentIds.length > 0) {
    const { data: enrollmentsWithIds } = await supabase
      .from("enrollments")
      .select("id, user_id, course_id")
      .in("user_id", studentIds);

    if (enrollmentsWithIds && enrollmentsWithIds.length > 0) {
      const eIds = enrollmentsWithIds.map((e) => e.id);

      const { data: progressRows } = await supabase
        .from("module_progress")
        .select("enrollment_id, status")
        .in("enrollment_id", eIds);

      const { data: timeLogs } = await supabase
        .from("time_logs")
        .select("enrollment_id, duration_seconds")
        .in("enrollment_id", eIds);

      const courseIdSet = new Set(enrollmentsWithIds.map((e) => e.course_id));
      const { data: allModules } = await supabase
        .from("course_modules")
        .select("id, course_sections!inner(course_id)")
        .in("course_sections.course_id", Array.from(courseIdSet));

      const modulesPerCourse = new Map<string, number>();
      for (const m of allModules || []) {
        const cid = (m.course_sections as unknown as { course_id: string }).course_id;
        modulesPerCourse.set(cid, (modulesPerCourse.get(cid) || 0) + 1);
      }

      const enrollmentLookup = new Map(enrollmentsWithIds.map((e) => [e.id, e]));

      for (const row of progressRows || []) {
        const enrollment = enrollmentLookup.get(row.enrollment_id);
        if (!enrollment) continue;
        const key = enrollment.user_id;
        const prev = progressMap.get(key) || {
          completed: 0,
          total: modulesPerCourse.get(enrollment.course_id) || 0,
        };
        if (row.status === "completed") prev.completed++;
        if (!progressMap.has(key)) prev.total = modulesPerCourse.get(enrollment.course_id) || 0;
        progressMap.set(key, prev);
      }

      for (const row of timeLogs || []) {
        const enrollment = enrollmentLookup.get(row.enrollment_id);
        if (!enrollment) continue;
        timeMap.set(enrollment.user_id, (timeMap.get(enrollment.user_id) || 0) + row.duration_seconds);
      }
    }
  }

  // Build CSV
  const headers = [
    "Name",
    "Email",
    "State",
    "Plan Tier",
    "Course",
    "Status",
    "Enrolled Date",
    "Expires Date",
    "Progress %",
    "Seat Time (hours)",
    "Joined Date",
  ];

  const rows = (profiles || []).map((student) => {
    const email = emailMap.get(student.id) || "";
    const enrollment = enrollmentMap.get(student.id);
    const progress = progressMap.get(student.id);
    const progressPct =
      progress && progress.total > 0
        ? Math.round((progress.completed / progress.total) * 100)
        : 0;
    const seatHours = Math.round(((timeMap.get(student.id) || 0) / 3600) * 10) / 10;

    return [
      csvEscape(student.full_name || ""),
      csvEscape(email),
      student.state || "",
      student.plan_tier || "",
      csvEscape(enrollment?.course || ""),
      enrollment?.status || "no enrollment",
      enrollment?.enrolled ? new Date(enrollment.enrolled).toISOString().split("T")[0] : "",
      enrollment?.expires ? new Date(enrollment.expires).toISOString().split("T")[0] : "",
      String(progressPct),
      String(seatHours),
      new Date(student.created_at).toISOString().split("T")[0],
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
