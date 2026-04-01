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
      .maybeSingle();

    if (prevQuiz) {
      // Previous section has a quiz — must be passed
      const { data: prevQuizProgress } = await supabase
        .from("module_progress")
        .select("success_status")
        .eq("enrollment_id", enrollment.id)
        .eq("module_id", prevQuiz.id)
        .maybeSingle();

      if (prevQuizProgress?.success_status !== "passed") {
        isUnlocked = false;
      }
    } else {
      // Previous section has no quiz — all modules must be completed
      const { data: prevSectionModules } = await supabase
        .from("course_modules")
        .select("id")
        .eq("section_id", prevSection.id);

      if (prevSectionModules && prevSectionModules.length > 0) {
        const prevModuleIds = prevSectionModules.map((m) => m.id);
        const { data: prevModProgress } = await supabase
          .from("module_progress")
          .select("module_id")
          .eq("enrollment_id", enrollment.id)
          .in("module_id", prevModuleIds)
          .eq("status", "completed");

        if ((prevModProgress?.length || 0) < prevModuleIds.length) {
          isUnlocked = false;
        }
      }
    }
  }

  if (!isUnlocked) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  // Compute the next sequential module for "Complete & Continue" navigation
  // Get all sections with their modules, ordered
  const { data: allSectionsWithModules } = await supabase
    .from("course_sections")
    .select(
      `
      id,
      sort_order,
      course_modules (
        id,
        sort_order
      )
    `
    )
    .eq("course_id", course.id)
    .order("sort_order");

  // Build a flat ordered list of all module IDs
  const allModulesOrdered: string[] = [];
  for (const s of (allSectionsWithModules || []).sort(
    (a, b) => a.sort_order - b.sort_order
  )) {
    const modules = (
      s.course_modules as Array<{ id: string; sort_order: number }>
    ).sort((a, b) => a.sort_order - b.sort_order);
    for (const m of modules) {
      allModulesOrdered.push(m.id);
    }
  }

  const currentIdx = allModulesOrdered.indexOf(moduleId);
  const nextModuleId =
    currentIdx >= 0 && currentIdx < allModulesOrdered.length - 1
      ? allModulesOrdered[currentIdx + 1]
      : null;
  const isLastModule = currentIdx === allModulesOrdered.length - 1;

  // Build learner name in "Last, First" format for SCORM
  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.name || "";
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
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
      nextModuleId={nextModuleId}
      isLastModule={isLastModule}
    />
  );
}
