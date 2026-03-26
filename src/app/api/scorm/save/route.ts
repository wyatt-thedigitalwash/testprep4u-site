import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      enrollmentId,
      moduleId,
      completionStatus,
      successStatus,
      scoreRaw,
      scoreScaled,
      location,
      suspendData,
      sessionTimeSeconds,
      cmiData,
      isFinal,
    } = await request.json();

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

    // Fetch module info (quiz_pass_score for success_status fallback)
    const { data: moduleInfo } = await supabase
      .from("course_modules")
      .select("module_type, quiz_pass_score")
      .eq("id", moduleId)
      .single();

    // Map SCORM statuses to our schema values
    const status =
      completionStatus === "completed"
        ? "completed"
        : completionStatus === "incomplete"
          ? "in_progress"
          : "in_progress";

    const dbCompletionStatus =
      completionStatus === "completed"
        ? "completed"
        : completionStatus === "incomplete"
          ? "incomplete"
          : "not attempted";

    const score = scoreScaled
      ? Math.round(parseFloat(scoreScaled) * 100)
      : scoreRaw
        ? parseFloat(scoreRaw)
        : null;

    // Derive success_status: prefer SCORM-reported value, fall back to
    // score vs quiz_pass_score for quiz modules when SCORM didn't set it.
    let dbSuccessStatus: string;
    if (successStatus === "passed") {
      dbSuccessStatus = "passed";
    } else if (successStatus === "failed") {
      dbSuccessStatus = "failed";
    } else if (
      moduleInfo?.module_type === "quiz" &&
      score !== null &&
      moduleInfo.quiz_pass_score !== null
    ) {
      // SCORM content didn't set success_status — derive from score
      dbSuccessStatus = score >= moduleInfo.quiz_pass_score ? "passed" : "failed";
    } else {
      dbSuccessStatus = "unknown";
    }

    const now = new Date().toISOString();

    // Only accumulate time on final save to avoid double-counting.
    // Intermediate commits send the running session total, which would
    // inflate the stored value if accumulated on every call.
    let timeUpdate: number | undefined;
    if (isFinal && sessionTimeSeconds && sessionTimeSeconds > 0) {
      const { data: existing } = await supabase
        .from("module_progress")
        .select("time_spent_seconds")
        .eq("enrollment_id", enrollmentId)
        .eq("module_id", moduleId)
        .single();

      timeUpdate = (existing?.time_spent_seconds || 0) + sessionTimeSeconds;
    }

    // Build upsert payload — only include time_spent_seconds on final save
    const upsertData: Record<string, unknown> = {
      enrollment_id: enrollmentId,
      module_id: moduleId,
      status,
      completion_status: dbCompletionStatus,
      success_status: dbSuccessStatus,
      score: score !== null && score >= 0 && score <= 100 ? score : null,
      last_accessed: now,
      bookmark: location || null,
      completed_at: status === "completed" ? now : null,
      cmi_data: cmiData || {},
    };
    if (timeUpdate !== undefined) {
      upsertData.time_spent_seconds = timeUpdate;
    }

    // Upsert module_progress
    const { error: upsertError } = await supabase
      .from("module_progress")
      .upsert(upsertData, { onConflict: "enrollment_id,module_id" });

    if (upsertError) {
      console.error("SCORM progress upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    // Insert time log only on final save (Terminate or close)
    // Intermediate commits (every 20s) just update module_progress
    if (isFinal && sessionTimeSeconds && sessionTimeSeconds > 0) {
      const { error: timeLogError } = await supabase
        .from("time_logs")
        .insert({
          enrollment_id: enrollmentId,
          module_id: moduleId,
          started_at: new Date(
            Date.now() - sessionTimeSeconds * 1000
          ).toISOString(),
          ended_at: now,
          duration_seconds: sessionTimeSeconds,
          source: "scorm",
        });

      if (timeLogError) {
        console.error("Time log insert error:", timeLogError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SCORM save error:", err);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
