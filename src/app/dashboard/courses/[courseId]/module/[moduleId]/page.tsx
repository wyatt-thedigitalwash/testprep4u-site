import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ModuleLauncher } from "@/components/dashboard/ModuleLauncher";

interface Props {
  params: Promise<{ courseId: string; moduleId: string }>;
}

export default async function ModulePage({ params }: Props) {
  const { courseId, moduleId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get course by slug
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", courseId)
    .single();

  if (!course) redirect("/dashboard");

  // Get enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .single();

  if (!enrollment) redirect("/dashboard");

  // Get the module with its section info
  const { data: mod } = await supabase
    .from("course_modules")
    .select(
      `
      id,
      module_type,
      title,
      scorm_entry_path,
      sort_order,
      quiz_pass_score,
      section_id,
      course_sections!inner (
        id,
        section_number,
        course_id
      )
    `
    )
    .eq("id", moduleId)
    .single();

  if (!mod) redirect(`/dashboard/courses/${courseId}`);

  // Verify module belongs to this course
  const section = mod.course_sections as unknown as {
    id: string;
    section_number: number;
    course_id: string;
  };

  if (section.course_id !== course.id) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  // If quiz without SCORM content, redirect to the native quiz page.
  // SCORM-based quizzes (with scorm_entry_path) load in the ModuleLauncher below.
  if (mod.module_type === "quiz" && !mod.scorm_entry_path) {
    redirect(
      `/dashboard/courses/${courseId}/quiz/${section.section_number}`
    );
  }

  // Check sequential unlock: verify all previous modules in this section are completed
  const { data: sectionModules } = await supabase
    .from("course_modules")
    .select("id, sort_order, module_type")
    .eq("section_id", section.id)
    .order("sort_order");

  const previousModules = (sectionModules || []).filter(
    (m) => m.sort_order < mod.sort_order
  );
  const previousModuleIds = previousModules.map((m) => m.id);

  let isUnlocked = true;

  if (previousModuleIds.length > 0) {
    const { data: prevProgress } = await supabase
      .from("module_progress")
      .select("module_id, status")
      .eq("enrollment_id", enrollment.id)
      .in("module_id", previousModuleIds);

    const completedSet = new Set(
      (prevProgress || [])
        .filter((p) => p.status === "completed")
        .map((p) => p.module_id)
    );

    // Check that the immediately previous module is completed
    const immediatePrev = previousModules[previousModules.length - 1];
    if (immediatePrev && !completedSet.has(immediatePrev.id)) {
      isUnlocked = false;
    }
  }

  // Also check section unlock (previous section's quiz must be passed)
  // Get all sections to find previous
  const { data: allSections } = await supabase
    .from("course_sections")
    .select("id, section_number, sort_order")
    .eq("course_id", course.id)
    .order("sort_order");

  const currentSectionIdx = (allSections || []).findIndex(
    (s) => s.id === section.id
  );

  if (currentSectionIdx > 0) {
    const prevSection = allSections![currentSectionIdx - 1];
    // Get quiz module from previous section
    const { data: prevQuiz } = await supabase
      .from("course_modules")
      .select("id")
      .eq("section_id", prevSection.id)
      .eq("module_type", "quiz")
      .single();

    if (prevQuiz) {
      const { data: prevQuizProgress } = await supabase
        .from("module_progress")
        .select("success_status")
        .eq("enrollment_id", enrollment.id)
        .eq("module_id", prevQuiz.id)
        .single();

      if (prevQuizProgress?.success_status !== "passed") {
        isUnlocked = false;
      }
    }
  }

  if (!isUnlocked) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  // Build learner name in "Last, First" format for SCORM
  const meta = user.user_metadata || {};
  const firstName = meta.first_name || meta.name || "";
  const lastName = meta.last_name || "";
  const learnerName = lastName && firstName
    ? `${lastName}, ${firstName}`
    : firstName || lastName || user.email || "";

  return (
    <ModuleLauncher
      moduleId={mod.id}
      moduleTitle={mod.title}
      scormEntryPath={mod.scorm_entry_path}
      courseSlug={courseId}
      enrollmentId={enrollment.id}
      learnerId={user.id}
      learnerName={learnerName}
    />
  );
}
