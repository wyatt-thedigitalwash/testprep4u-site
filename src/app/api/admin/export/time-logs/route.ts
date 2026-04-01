import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/lib/supabase/server";

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
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Fetch time logs with enrollment → user and course info
  const { data: timeLogs } = await supabase
    .from("time_logs")
    .select(
      "id, enrollment_id, module_id, started_at, ended_at, duration_seconds, source"
    )
    .order("started_at", { ascending: false })
    .limit(10000);

  // Get enrollment → user + course mapping
  const enrollmentIds = [
    ...new Set((timeLogs || []).map((t) => t.enrollment_id)),
  ];
  let enrollmentMap = new Map<
    string,
    { userId: string; courseName: string }
  >();

  if (enrollmentIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, user_id, courses ( name )")
      .in("id", enrollmentIds);

    for (const e of enrollments || []) {
      const course = e.courses as unknown as { name: string } | null;
      enrollmentMap.set(e.id, {
        userId: e.user_id,
        courseName: course?.name || "",
      });
    }
  }

  // Get user names
  const userIds = [...new Set([...enrollmentMap.values()].map((e) => e.userId))];
  let nameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    for (const p of profiles || []) {
      nameMap.set(p.id, p.full_name || "");
    }
  }

  const headers = [
    "Log ID",
    "Student Name",
    "User ID",
    "Course",
    "Source",
    "Started At",
    "Ended At",
    "Duration (seconds)",
    "Duration (minutes)",
  ];

  const rows = (timeLogs || []).map((t) => {
    const enrollment = enrollmentMap.get(t.enrollment_id);
    const name = enrollment ? nameMap.get(enrollment.userId) || "" : "";
    return [
      t.id,
      csvEscape(name),
      enrollment?.userId || "",
      csvEscape(enrollment?.courseName || ""),
      t.source,
      t.started_at,
      t.ended_at,
      String(t.duration_seconds),
      String(Math.round((t.duration_seconds / 60) * 10) / 10),
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="time-logs-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
