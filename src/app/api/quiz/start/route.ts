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

    const { type, courseId, sectionNumber } = await request.json();

    if (!type || !courseId) {
      return NextResponse.json(
        { error: "Missing type or courseId" },
        { status: 400 }
      );
    }

    // Look up course by slug
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseId)
      .single();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify active enrollment
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

    let questions;

    if (type === "section_quiz" && sectionNumber !== undefined) {
      // Get section for this course + section number
      const { data: section } = await supabase
        .from("course_sections")
        .select("id")
        .eq("course_id", course.id)
        .eq("section_number", sectionNumber)
        .single();

      if (!section) {
        return NextResponse.json(
          { error: "Section not found" },
          { status: 404 }
        );
      }

      // Verify all lesson modules in this section are completed before allowing quiz
      const { data: sectionModules } = await supabase
        .from("course_modules")
        .select("id")
        .eq("section_id", section.id)
        .eq("module_type", "lesson");

      if (sectionModules && sectionModules.length > 0) {
        const moduleIds = sectionModules.map((m) => m.id);
        const { data: progressRows } = await supabase
          .from("module_progress")
          .select("module_id, status")
          .eq("enrollment_id", enrollment.id)
          .in("module_id", moduleIds)
          .eq("status", "completed");

        const completedCount = progressRows?.length || 0;
        if (completedCount < moduleIds.length) {
          return NextResponse.json(
            { error: "Complete all section lessons before taking the quiz" },
            { status: 403 }
          );
        }
      }

      // Get lesson module titles — these are used as topic keys in question_bank
      const { data: modules } = await supabase
        .from("course_modules")
        .select("title")
        .eq("section_id", section.id)
        .eq("module_type", "lesson");

      const topics = (modules || []).map((m) => m.title);

      if (topics.length === 0) {
        return NextResponse.json({ questions: [] });
      }

      // Pull questions matching these topics
      const { data: questionData, error: qErr } = await supabase
        .from("question_bank")
        .select("id, question_text, options, topic")
        .eq("course_id", course.id)
        .in("topic", topics);

      if (qErr) {
        console.error("Question fetch error:", qErr);
        return NextResponse.json(
          { error: "Failed to load questions" },
          { status: 500 }
        );
      }

      questions = questionData || [];
    } else {
      // Practice or final exam — verify all SCORM sections complete
      const { data: allModules } = await supabase
        .from("course_modules")
        .select("id, course_sections!inner(course_id)")
        .eq("course_sections.course_id", course.id);

      if (allModules && allModules.length > 0) {
        const allModuleIds = allModules.map((m) => m.id);
        const { data: completedRows } = await supabase
          .from("module_progress")
          .select("module_id")
          .eq("enrollment_id", enrollment.id)
          .in("module_id", allModuleIds)
          .eq("status", "completed");

        if ((completedRows?.length || 0) < allModuleIds.length) {
          return NextResponse.json(
            { error: "Complete all course sections before taking this exam" },
            { status: 403 }
          );
        }
      }

      // Filter by exam_type
      const examFilter =
        type === "final" ? ["final", "both"] : ["practice", "both"];

      const { data: questionData, error: qErr } = await supabase
        .from("question_bank")
        .select("id, question_text, options, topic")
        .eq("course_id", course.id)
        .in("exam_type", examFilter);

      if (qErr) {
        console.error("Question fetch error:", qErr);
        return NextResponse.json(
          { error: "Failed to load questions" },
          { status: 500 }
        );
      }

      questions = questionData || [];
    }

    // Shuffle questions (Fisher-Yates)
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Limit question count by type
    let limit = questions.length;
    if (type === "final") limit = Math.min(85, questions.length);
    if (type === "practice") limit = Math.min(50, questions.length);

    return NextResponse.json({
      questions: questions.slice(0, limit),
    });
  } catch (err) {
    console.error("Quiz start error:", err);
    return NextResponse.json(
      { error: "Failed to start quiz" },
      { status: 500 }
    );
  }
}
