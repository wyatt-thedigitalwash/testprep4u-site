import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enrollmentId, typedName } = await request.json();

    if (!enrollmentId || !typedName?.trim()) {
      return NextResponse.json(
        { error: "Missing enrollmentId or typedName" },
        { status: 400 }
      );
    }

    if (typedName.length > 200) {
      return NextResponse.json(
        { error: "typedName exceeds 200 character limit" },
        { status: 400 }
      );
    }

    // Get enrollment and verify ownership
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, user_id, course_id, affidavit_accepted_at")
      .eq("id", enrollmentId)
      .single();

    if (!enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (enrollment.affidavit_accepted_at) {
      return NextResponse.json(
        { error: "Affidavit already signed" },
        { status: 409 }
      );
    }

    // Verify eligibility: final exam passed + 30h seat time
    const { data: course } = await supabase
      .from("courses")
      .select("required_hours")
      .eq("id", enrollment.course_id)
      .single();

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Check all SCORM sections are completed and quizzes passed
    const { data: allModules } = await supabase
      .from("course_modules")
      .select("id, module_type, course_sections!inner(course_id)")
      .eq("course_sections.course_id", enrollment.course_id);

    if (allModules && allModules.length > 0) {
      const allModuleIds = allModules.map((m) => m.id);
      const { data: progressRows } = await supabase
        .from("module_progress")
        .select("module_id, status, success_status")
        .eq("enrollment_id", enrollmentId)
        .in("module_id", allModuleIds);

      const progressMap = new Map(
        (progressRows || []).map((p) => [p.module_id, p])
      );

      for (const mod of allModules) {
        const progress = progressMap.get(mod.id);
        if (!progress || progress.status !== "completed") {
          return NextResponse.json(
            { error: "All course sections must be completed" },
            { status: 403 }
          );
        }
        if (mod.module_type === "quiz" && progress.success_status !== "passed") {
          return NextResponse.json(
            { error: "All section quizzes must be passed" },
            { status: 403 }
          );
        }
      }
    }

    // Check final exam passed
    const { data: examAttempts } = await supabase
      .from("exam_attempts")
      .select("passed")
      .eq("enrollment_id", enrollmentId)
      .eq("exam_type", "final")
      .eq("passed", true);

    if (!examAttempts || examAttempts.length === 0) {
      return NextResponse.json(
        { error: "Final exam not passed" },
        { status: 403 }
      );
    }

    // Check seat time
    const { data: timeLogs } = await supabase
      .from("time_logs")
      .select("duration_seconds")
      .eq("enrollment_id", enrollmentId);

    const totalSeconds = (timeLogs || []).reduce(
      (sum, t) => sum + t.duration_seconds,
      0
    );
    const requiredSeconds = course.required_hours * 3600;

    if (totalSeconds < requiredSeconds) {
      return NextResponse.json(
        { error: "Seat time requirement not met" },
        { status: 403 }
      );
    }

    // Record affidavit (use admin client — enrollment updates restricted to service role)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const now = new Date().toISOString();

    const adminSupabase = createAdminClient();
    const { error: updateError } = await adminSupabase
      .from("enrollments")
      .update({
        affidavit_accepted_at: now,
        affidavit_ip: ip,
        affidavit_user_agent: userAgent,
        affidavit_typed_name: typedName.trim(),
      })
      .eq("id", enrollmentId);

    if (updateError) {
      console.error("Affidavit update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save affidavit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, signedAt: now });
  } catch (err) {
    console.error("Affidavit error:", err);
    return NextResponse.json(
      { error: "Failed to process affidavit" },
      { status: 500 }
    );
  }
}
