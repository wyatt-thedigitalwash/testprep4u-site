// Server-side data fetching for the student dashboard.
// All functions require a Supabase server client and authenticated user.
// Replaces mock-data.ts for real course data.

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CourseEnrollment,
  ModuleProgress,
  SectionData,
  SectionWithProgress,
  CourseDetail,
  ExamAttemptData,
} from "@/lib/course-types";

// Re-export types and helpers so server consumers can import from one place
export type {
  CourseEnrollment,
  ModuleData,
  ModuleProgress,
  SectionData,
  SectionWithProgress,
  CourseDetail,
  ExamAttemptData,
} from "@/lib/course-types";
export { formatTime, formatHours } from "@/lib/course-types";

/* ── Helpers ───────────────────────────────────────────────── */

function buildProgressMap(
  rows: Array<{
    module_id: string;
    status: string;
    completion_status: string;
    success_status: string;
    score: number | null;
    time_spent_seconds: number;
    last_accessed: string | null;
    completed_at: string | null;
    bookmark: string | null;
  }>
): Map<string, ModuleProgress> {
  const map = new Map<string, ModuleProgress>();
  for (const r of rows) {
    map.set(r.module_id, {
      moduleId: r.module_id,
      status: r.status as ModuleProgress["status"],
      completionStatus: r.completion_status,
      successStatus: r.success_status,
      score: r.score,
      timeSpentSeconds: r.time_spent_seconds,
      lastAccessed: r.last_accessed,
      completedAt: r.completed_at,
      bookmark: r.bookmark,
    });
  }
  return map;
}

/**
 * Determines if a module is unlocked based on sequential progression:
 * - First module in first unlocked section is always unlocked
 * - Each subsequent module requires the previous to be completed
 * - Quiz modules require all lesson modules in the section to be completed
 */
function computeUnlockState(
  sections: SectionData[],
  progressMap: Map<string, ModuleProgress>
): {
  sectionUnlocks: Map<string, boolean>;
  moduleUnlocks: Map<string, boolean>;
} {
  const sectionUnlocks = new Map<string, boolean>();
  const moduleUnlocks = new Map<string, boolean>();

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];

    // Section 0 is always unlocked. Subsequent sections require previous section's quiz passed.
    let sectionUnlocked = si === 0;
    if (si > 0) {
      const prevSection = sections[si - 1];
      const prevQuiz = prevSection.modules.find(
        (m) => m.moduleType === "quiz"
      );
      if (prevQuiz) {
        const prevQuizProgress = progressMap.get(prevQuiz.id);
        sectionUnlocked = prevQuizProgress?.successStatus === "passed";
      } else {
        // No quiz in previous section — unlocked if all modules completed
        const allPrevCompleted = prevSection.modules.every((m) => {
          const p = progressMap.get(m.id);
          return p?.status === "completed";
        });
        sectionUnlocked = allPrevCompleted;
      }
    }
    sectionUnlocks.set(section.id, sectionUnlocked);

    // Module unlock within section
    for (let mi = 0; mi < section.modules.length; mi++) {
      const mod = section.modules[mi];

      if (!sectionUnlocked) {
        moduleUnlocks.set(mod.id, false);
        continue;
      }

      if (mi === 0) {
        // First module in unlocked section is always unlocked
        moduleUnlocks.set(mod.id, true);
      } else if (mod.moduleType === "quiz") {
        // Quiz requires all lessons in section to be completed
        const allLessonsComplete = section.modules
          .filter((m) => m.moduleType === "lesson")
          .every((m) => {
            const p = progressMap.get(m.id);
            return p?.status === "completed";
          });
        moduleUnlocks.set(mod.id, allLessonsComplete);
      } else {
        // Lesson requires previous module completed
        const prevMod = section.modules[mi - 1];
        const prevProgress = progressMap.get(prevMod.id);
        moduleUnlocks.set(
          mod.id,
          prevProgress?.status === "completed" || false
        );
      }
    }
  }

  return { sectionUnlocks, moduleUnlocks };
}

/* ── Data Fetching Functions ───────────────────────────────── */

/** Get all enrollments for the current user */
export async function getUserEnrollments(): Promise<CourseEnrollment[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch user's plan tier from profiles (tier lives on profiles, not enrollments)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.plan_tier || "essentials";

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      status,
      enrolled_at,
      expires_at,
      affidavit_accepted_at,
      courses (
        id,
        slug,
        name,
        type,
        state,
        required_hours
      )
    `
    )
    .eq("user_id", user.id)
    .in("status", ["active", "completed"])
    .gt("expires_at", new Date().toISOString());

  if (error || !data) {
    console.error("getUserEnrollments query error:", error);
    return [];
  }

  // Check which enrollments have any module progress (i.e., have been started)
  const enrollmentIds = data.map((row) => row.id);
  const startedSet = new Set<string>();
  if (enrollmentIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("module_progress")
      .select("enrollment_id")
      .in("enrollment_id", enrollmentIds)
      .limit(enrollmentIds.length);

    for (const r of progressRows || []) {
      startedSet.add(r.enrollment_id);
    }
  }

  return data.map((row) => {
    const course = row.courses as unknown as {
      id: string;
      slug: string;
      name: string;
      type: string;
      state: string;
      required_hours: number;
    };
    return {
      enrollmentId: row.id,
      courseId: course.id,
      courseSlug: course.slug,
      courseName: course.name,
      courseType: course.type,
      courseState: course.state,
      requiredHours: course.required_hours,
      tier,
      status: row.status,
      enrolledAt: row.enrolled_at,
      expiresAt: row.expires_at,
      affidavitAcceptedAt: row.affidavit_accepted_at,
      hasStarted: startedSet.has(row.id),
    };
  });
}

/** Get full course detail with sections, modules, progress, and time tracking */
export async function getCourseDetail(
  courseSlug: string
): Promise<CourseDetail | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Get course
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, name, type, state, required_hours")
    .eq("slug", courseSlug)
    .single();

  if (!course) return null;

  // 2. Get enrollment (tier lives on profiles, not enrollments)
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_at, expires_at, affidavit_accepted_at")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .in("status", ["active", "completed"])
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!enrollment) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.plan_tier || "essentials";

  // 3. Get sections with modules
  const { data: sectionsRaw } = await supabase
    .from("course_sections")
    .select(
      `
      id,
      section_number,
      title,
      sort_order,
      course_modules (
        id,
        section_id,
        module_type,
        title,
        scorm_entry_path,
        sort_order,
        quiz_pass_score
      )
    `
    )
    .eq("course_id", course.id)
    .order("sort_order");

  if (!sectionsRaw) return null;

  const sections: SectionData[] = sectionsRaw.map((s) => ({
    id: s.id,
    sectionNumber: s.section_number,
    title: s.title,
    sortOrder: s.sort_order,
    modules: (
      s.course_modules as Array<{
        id: string;
        section_id: string;
        module_type: string;
        title: string;
        scorm_entry_path: string;
        sort_order: number;
        quiz_pass_score: number | null;
      }>
    )
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        id: m.id,
        sectionId: m.section_id,
        moduleType: m.module_type as "lesson" | "quiz",
        title: m.title,
        scormEntryPath: m.scorm_entry_path,
        sortOrder: m.sort_order,
        quizPassScore: m.quiz_pass_score,
      })),
  }));

  // 4. Get module progress
  const allModuleIds = sections.flatMap((s) => s.modules.map((m) => m.id));
  const { data: progressRows } = await supabase
    .from("module_progress")
    .select(
      "module_id, status, completion_status, success_status, score, time_spent_seconds, last_accessed, completed_at, bookmark"
    )
    .eq("enrollment_id", enrollment.id)
    .in("module_id", allModuleIds);

  const progressMap = buildProgressMap(progressRows || []);

  // 5. Get total time from time_logs (aggregated)
  const { data: timeLogs } = await supabase
    .from("time_logs")
    .select("duration_seconds, module_id")
    .eq("enrollment_id", enrollment.id);

  const totalTimeSeconds = (timeLogs || []).reduce(
    (sum, t) => sum + t.duration_seconds,
    0
  );

  // Build per-module time from time_logs (more accurate than module_progress.time_spent_seconds)
  const moduleTimeMap = new Map<string, number>();
  for (const t of timeLogs || []) {
    if (t.module_id) {
      moduleTimeMap.set(
        t.module_id,
        (moduleTimeMap.get(t.module_id) || 0) + t.duration_seconds
      );
    }
  }

  // 6. Get exam attempts (for final exam status)
  const { data: examAttempts } = await supabase
    .from("exam_attempts")
    .select("exam_type, passed")
    .eq("enrollment_id", enrollment.id);

  const finalExamPassed = (examAttempts || []).some(
    (a) => a.exam_type === "final" && a.passed
  );

  // 7. Compute unlock state
  const { sectionUnlocks, moduleUnlocks } = computeUnlockState(
    sections,
    progressMap
  );

  // 8. Build sections with progress
  let completedModules = 0;
  let totalModules = 0;

  const sectionsWithProgress: SectionWithProgress[] = sections.map((s) => {
    const sectionUnlocked = sectionUnlocks.get(s.id) || false;
    let sectionTime = 0;
    let sectionCompleted = 0;
    let quizStatus: SectionWithProgress["quizStatus"] = null;
    let quizScore: number | null = null;

    const modulesWithProgress = s.modules.map((m) => {
      const progress = progressMap.get(m.id) || null;
      const isUnlocked = moduleUnlocks.get(m.id) || false;
      const moduleTime =
        moduleTimeMap.get(m.id) || progress?.timeSpentSeconds || 0;
      sectionTime += moduleTime;

      if (progress?.status === "completed") {
        sectionCompleted++;
        completedModules++;
      }
      totalModules++;

      if (m.moduleType === "quiz") {
        if (!progress || progress.status === "not_started") {
          quizStatus = "not_started";
        } else if (progress.successStatus === "passed") {
          quizStatus = "passed";
          quizScore = progress.score;
        } else {
          quizStatus = "failed";
          quizScore = progress.score;
        }
      }

      return {
        ...m,
        progress,
        isUnlocked,
      };
    });

    return {
      ...s,
      modules: modulesWithProgress,
      isUnlocked: sectionUnlocked,
      completedModules: sectionCompleted,
      totalModules: s.modules.length,
      totalTimeSeconds: sectionTime,
      quizStatus,
      quizScore,
    };
  });

  const requiredTimeSeconds = course.required_hours * 3600;
  const meetsHourRequirement = totalTimeSeconds >= requiredTimeSeconds;
  const allSectionsComplete = sectionsWithProgress.every((s) => {
    return s.modules.every((m) => m.progress?.status === "completed");
  });
  const hasAffidavit = !!enrollment.affidavit_accepted_at;
  const canTakeFinalExam = allSectionsComplete;
  const canGetCertificate = finalExamPassed && meetsHourRequirement && hasAffidavit;

  const progressPercent =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return {
    enrollment: {
      enrollmentId: enrollment.id,
      courseId: course.id,
      courseSlug: course.slug,
      courseName: course.name,
      courseType: course.type,
      courseState: course.state,
      requiredHours: course.required_hours,
      tier,
      status: enrollment.status,
      enrolledAt: enrollment.enrolled_at,
      expiresAt: enrollment.expires_at,
      affidavitAcceptedAt: enrollment.affidavit_accepted_at,
      hasStarted: completedModules > 0,
    },
    sections: sectionsWithProgress,
    totalTimeSeconds,
    requiredTimeSeconds,
    completedModules,
    totalModules,
    progressPercent,
    allSectionsComplete,
    canTakeFinalExam,
    finalExamPassed,
    meetsHourRequirement,
    hasAffidavit,
    canGetCertificate,
  };
}

/** Get exam attempts for a course enrollment */
export async function getExamAttempts(
  courseSlug: string
): Promise<ExamAttemptData[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .single();
  if (!course) return [];

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .in("status", ["active", "completed"])
    .gt("expires_at", new Date().toISOString())
    .single();
  if (!enrollment) return [];

  const { data } = await supabase
    .from("exam_attempts")
    .select(
      "id, exam_type, score, total_questions, correct_answers, passed, time_spent_seconds, attempted_at"
    )
    .eq("enrollment_id", enrollment.id)
    .order("attempted_at");

  return (data || []).map((a) => ({
    id: a.id,
    examType: a.exam_type as "practice" | "final",
    score: a.score,
    totalQuestions: a.total_questions,
    correctAnswers: a.correct_answers,
    passed: a.passed,
    timeSpentSeconds: a.time_spent_seconds,
    attemptedAt: a.attempted_at,
  }));
}

/** Check which enrollments have all course sections completed (batch) */
export async function checkAllSectionsComplete(
  enrollments: { enrollmentId: string; courseId: string }[]
): Promise<Map<string, boolean>> {
  if (enrollments.length === 0) return new Map();

  const supabase = await createServerSupabaseClient();

  // Get all modules for all relevant courses
  const uniqueCourseIds = [...new Set(enrollments.map((e) => e.courseId))];
  const { data: allModules } = await supabase
    .from("course_modules")
    .select("id, course_sections!inner(course_id)")
    .in("course_sections.course_id", uniqueCourseIds);

  // Build courseId → module ID set
  const courseModuleMap = new Map<string, Set<string>>();
  for (const m of allModules || []) {
    const courseId = (
      m.course_sections as unknown as { course_id: string }
    ).course_id;
    if (!courseModuleMap.has(courseId))
      courseModuleMap.set(courseId, new Set());
    courseModuleMap.get(courseId)!.add(m.id);
  }

  // Get completed module_progress for all enrollments
  const enrollmentIds = enrollments.map((e) => e.enrollmentId);
  const { data: completedRows } = await supabase
    .from("module_progress")
    .select("enrollment_id, module_id")
    .in("enrollment_id", enrollmentIds)
    .eq("status", "completed");

  const enrollmentCompleted = new Map<string, Set<string>>();
  for (const r of completedRows || []) {
    if (!enrollmentCompleted.has(r.enrollment_id))
      enrollmentCompleted.set(r.enrollment_id, new Set());
    enrollmentCompleted.get(r.enrollment_id)!.add(r.module_id);
  }

  // Compare totals
  const result = new Map<string, boolean>();
  for (const e of enrollments) {
    const totalModules = courseModuleMap.get(e.courseId);
    const completed = enrollmentCompleted.get(e.enrollmentId);
    if (!totalModules || totalModules.size === 0) {
      result.set(e.enrollmentId, true);
    } else {
      result.set(
        e.enrollmentId,
        (completed?.size || 0) >= totalModules.size
      );
    }
  }

  return result;
}

/** Get dashboard stats for the current user */
export async function getDashboardStats(): Promise<{
  totalStudyHours: number;
  practiceExamAvg: number;
  coursesEnrolled: number;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { totalStudyHours: 0, practiceExamAvg: 0, coursesEnrolled: 0 };

  // Count enrollments (include completed so stats reflect full history)
  const { count: enrollmentCount } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["active", "completed"]);

  // Total study time across all enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "completed"]);

  const enrollmentIds = (enrollments || []).map((e) => e.id);
  let totalSeconds = 0;
  let practiceExamAvg = 0;

  if (enrollmentIds.length > 0) {
    const { data: timeLogs } = await supabase
      .from("time_logs")
      .select("duration_seconds")
      .in("enrollment_id", enrollmentIds);

    totalSeconds = (timeLogs || []).reduce(
      (sum, t) => sum + t.duration_seconds,
      0
    );

    // Practice exam average
    const { data: practiceAttempts } = await supabase
      .from("exam_attempts")
      .select("score")
      .in("enrollment_id", enrollmentIds)
      .eq("exam_type", "practice");

    if (practiceAttempts && practiceAttempts.length > 0) {
      practiceExamAvg = Math.round(
        practiceAttempts.reduce((sum, a) => sum + a.score, 0) /
          practiceAttempts.length
      );
    }
  }

  return {
    totalStudyHours: Math.round((totalSeconds / 3600) * 10) / 10,
    practiceExamAvg,
    coursesEnrolled: enrollmentCount || 0,
  };
}

