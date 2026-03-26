import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get("enrollmentId");
    const moduleId = searchParams.get("moduleId");

    if (!enrollmentId || !moduleId) {
      return NextResponse.json(
        { error: "Missing enrollmentId or moduleId" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, user_id")
      .eq("id", enrollmentId)
      .single();

    if (!enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch existing progress
    const { data: progress } = await supabase
      .from("module_progress")
      .select(
        "cmi_data, bookmark, time_spent_seconds, completion_status, success_status, score"
      )
      .eq("enrollment_id", enrollmentId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (!progress) {
      // No previous progress — fresh start
      return NextResponse.json({ cmiData: null });
    }

    return NextResponse.json({
      cmiData: progress.cmi_data || null,
      bookmark: progress.bookmark,
      timeSpentSeconds: progress.time_spent_seconds,
      completionStatus: progress.completion_status,
      successStatus: progress.success_status,
      score: progress.score,
    });
  } catch (err) {
    console.error("SCORM load error:", err);
    return NextResponse.json(
      { error: "Failed to load progress" },
      { status: 500 }
    );
  }
}
