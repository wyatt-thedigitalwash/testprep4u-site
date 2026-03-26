import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/send-email";
import { sectionCompletedEmail, finalExamPassedEmail } from "@/lib/emails";

interface AnswerInput {
  questionId: string;
  selectedIndex: number;
}

interface GradedResult {
  questionId: string;
  question_text: string;
  options: string[];
  selectedIndex: number;
  correct_index: number;
  correct: boolean;
  explanation: string;
  topic: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, courseId, sectionNumber, answers, timeSpentSeconds } =
      await request.json();

    // Validate type against allowed values
    const ALLOWED_TYPES = ["section_quiz", "practice", "final"];
    if (!type || !ALLOWED_TYPES.includes(type) || !courseId || !answers?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate answer shape
    for (const a of answers as unknown[]) {
      if (
        typeof a !== "object" ||
        a === null ||
        typeof (a as Record<string, unknown>).questionId !== "string" ||
        typeof (a as Record<string, unknown>).selectedIndex !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid answer format" },
          { status: 400 }
        );
      }
    }

    // Look up course
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseId)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Look up enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "active")
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: "No active enrollment" },
        { status: 403 }
      );
    }

    // Fetch full question data (including correct answers)
    // Use admin client because question_bank RLS restricts to service_role
    const adminClient = createAdminClient();
    const questionIds = (answers as AnswerInput[]).map((a) => a.questionId);
    const { data: questions } = await adminClient
      .from("question_bank")
      .select("id, question_text, options, correct_index, explanation, topic")
      .in("id", questionIds);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions not found" },
        { status: 404 }
      );
    }

    // Build lookup map
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Grade each answer
    const results: GradedResult[] = (answers as AnswerInput[])
      .map((a) => {
        const q = questionMap.get(a.questionId);
        if (!q) return null;
        return {
          questionId: q.id,
          question_text: q.question_text,
          options: q.options as string[],
          selectedIndex: a.selectedIndex,
          correct_index: q.correct_index,
          correct: a.selectedIndex === q.correct_index,
          explanation: q.explanation,
          topic: q.topic,
        };
      })
      .filter((r): r is GradedResult => r !== null);

    const totalQuestions = results.length;
    const correctAnswers = results.filter((r) => r.correct).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Pass thresholds: section quizzes 70%, final 70%, practice uses 80% for "pass" label
    const passThreshold =
      type === "practice" ? 80 : type === "final" ? 70 : 70;
    const passed = score >= passThreshold;

    // Calculate topic breakdown
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const r of results) {
      const existing = topicMap.get(r.topic) || { correct: 0, total: 0 };
      existing.total++;
      if (r.correct) existing.correct++;
      topicMap.set(r.topic, existing);
    }

    const topicBreakdown = Array.from(topicMap.entries()).map(
      ([topic, data]) => ({
        topic,
        correct: data.correct,
        total: data.total,
        percentage: Math.round((data.correct / data.total) * 100),
      })
    );

    // ── Cap time spent (4 hours max, same as SCORM save route) ──

    const MAX_SESSION_SECONDS = 14400;
    const rawTime =
      typeof timeSpentSeconds === "number" && timeSpentSeconds > 0
        ? timeSpentSeconds
        : 0;
    const cappedTime = Math.min(Math.floor(rawTime), MAX_SESSION_SECONDS);

    // ── Store results ────────────────────────────────────────

    if (type === "section_quiz" && sectionNumber !== undefined) {
      // Find the quiz module for this section
      const { data: section } = await supabase
        .from("course_sections")
        .select("id")
        .eq("course_id", course.id)
        .eq("section_number", sectionNumber)
        .single();

      if (section) {
        const { data: quizModule } = await supabase
          .from("course_modules")
          .select("id")
          .eq("section_id", section.id)
          .eq("module_type", "quiz")
          .single();

        if (quizModule) {
          // Fetch existing time to accumulate across retakes
          const { data: existingQuizProgress } = await supabase
            .from("module_progress")
            .select("time_spent_seconds")
            .eq("enrollment_id", enrollment.id)
            .eq("module_id", quizModule.id)
            .maybeSingle();

          const accumulatedTime =
            (existingQuizProgress?.time_spent_seconds || 0) + cappedTime;

          // Upsert module_progress for the quiz
          // Only mark as completed if the quiz was passed
          await supabase.from("module_progress").upsert(
            {
              enrollment_id: enrollment.id,
              module_id: quizModule.id,
              status: passed ? "completed" : "in_progress",
              completion_status: passed ? "completed" : "incomplete",
              success_status: passed ? "passed" : "failed",
              score,
              time_spent_seconds: accumulatedTime,
              completed_at: passed ? new Date().toISOString() : null,
              last_accessed: new Date().toISOString(),
            },
            { onConflict: "enrollment_id,module_id" }
          );
        }
      }
    } else {
      // Practice or final → exam_attempts
      await supabase.from("exam_attempts").insert({
        enrollment_id: enrollment.id,
        exam_type: type === "final" ? "final" : "practice",
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        passed,
        time_spent_seconds: cappedTime,
        answers,
      });
    }

    // ── Send email notifications ────────────────────────────

    if (user.email) {
      const userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "";

      if (type === "section_quiz" && passed && sectionNumber !== undefined) {
        // Get section info for the email
        const { data: sectionInfo } = await supabase
          .from("course_sections")
          .select("title")
          .eq("course_id", course.id)
          .eq("section_number", sectionNumber)
          .single();

        const { data: allSections } = await supabase
          .from("course_sections")
          .select("id")
          .eq("course_id", course.id);

        // Count how many sections have a passed quiz
        const sectionIds = (allSections || []).map((s) => s.id);
        const { data: quizModules } = await supabase
          .from("course_modules")
          .select("id, section_id")
          .in("section_id", sectionIds)
          .eq("module_type", "quiz");

        const quizModuleIds = (quizModules || []).map((m) => m.id);
        const { data: passedQuizzes } = await supabase
          .from("module_progress")
          .select("module_id")
          .eq("enrollment_id", enrollment.id)
          .in("module_id", quizModuleIds)
          .eq("success_status", "passed");

        const completedSections = (passedQuizzes || []).length;

        if (sectionInfo) {
          const email = sectionCompletedEmail({
            name: userName,
            sectionTitle: sectionInfo.title,
            sectionNumber,
            score,
            totalSections: (allSections || []).length,
            completedSections,
            courseSlug: courseId,
          });
          sendEmail({ to: user.email, subject: email.subject, html: email.html });
        }
      }

      if (type === "final" && passed) {
        const { data: courseInfo } = await supabase
          .from("courses")
          .select("name")
          .eq("id", course.id)
          .single();

        const email = finalExamPassedEmail({
          name: userName,
          score,
          courseName: courseInfo?.name || "your course",
          courseSlug: courseId,
        });
        sendEmail({ to: user.email, subject: email.subject, html: email.html });
      }
    }

    // ── Log time (immutable audit trail) ─────────────────────

    if (cappedTime > 0) {
      const source =
        type === "final"
          ? "final_exam"
          : type === "practice"
            ? "practice_exam"
            : "quiz";

      await supabase.from("time_logs").insert({
        enrollment_id: enrollment.id,
        module_id: null,
        started_at: new Date(
          Date.now() - cappedTime * 1000
        ).toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: cappedTime,
        source,
      });
    }

    return NextResponse.json({
      score,
      passed,
      totalQuestions,
      correctAnswers,
      results,
      topicBreakdown,
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
