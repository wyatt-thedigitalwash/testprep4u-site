import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

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

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const supabase = createAdminClient();

  // Date filters
  const dateFrom = from
    ? new Date(from).toISOString()
    : new Date(Date.now() - 365 * 86400000).toISOString();
  const dateTo = to
    ? new Date(to + "T23:59:59").toISOString()
    : new Date().toISOString();

  // ── 1. Enrollments over time ─────────────────────────────────
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, enrolled_at, status, user_id, course_id")
    .gte("enrolled_at", dateFrom)
    .lte("enrolled_at", dateTo)
    .order("enrolled_at");

  // ── 2. All enrollments (for completion funnel, not date-filtered)
  const { data: allEnrollments } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id, status");

  // ── 3. Section quiz pass rates ───────────────────────────────
  // Get all course sections
  const { data: sections } = await supabase
    .from("course_sections")
    .select("id, title, section_number, course_id")
    .order("section_number");

  // Get quiz modules per section
  const sectionIds = (sections || []).map((s) => s.id);
  let quizModules: Array<{ id: string; section_id: string }> = [];
  if (sectionIds.length > 0) {
    const { data } = await supabase
      .from("course_modules")
      .select("id, section_id")
      .in("section_id", sectionIds)
      .eq("module_type", "quiz");
    quizModules = data || [];
  }

  // Get all quiz progress
  const quizModuleIds = quizModules.map((m) => m.id);
  let quizProgress: Array<{
    module_id: string;
    success_status: string;
  }> = [];
  if (quizModuleIds.length > 0) {
    const { data } = await supabase
      .from("module_progress")
      .select("module_id, success_status")
      .in("module_id", quizModuleIds);
    quizProgress = data || [];
  }

  // Build quiz → section mapping
  const quizToSection = new Map<string, string>();
  for (const qm of quizModules) {
    quizToSection.set(qm.id, qm.section_id);
  }

  // Compute pass rates per section
  const sectionPassData = new Map<
    string,
    { passed: number; total: number }
  >();
  for (const qp of quizProgress) {
    const sectionId = quizToSection.get(qp.module_id);
    if (!sectionId) continue;
    const prev = sectionPassData.get(sectionId) || { passed: 0, total: 0 };
    prev.total++;
    if (qp.success_status === "passed") prev.passed++;
    sectionPassData.set(sectionId, prev);
  }

  // Final exam pass rate
  const { data: finalAttempts } = await supabase
    .from("exam_attempts")
    .select("passed")
    .eq("exam_type", "final");

  const finalTotal = (finalAttempts || []).length;
  const finalPassed = (finalAttempts || []).filter((a) => a.passed).length;

  const passRates = (sections || [])
    .map((s) => {
      const data = sectionPassData.get(s.id);
      return {
        name: `Part ${s.section_number}`,
        title: s.title,
        passed: data?.passed || 0,
        total: data?.total || 0,
        rate: data && data.total > 0
          ? Math.round((data.passed / data.total) * 100)
          : 0,
      };
    })
    .concat([
      {
        name: "Final Exam",
        title: "Final Exam",
        passed: finalPassed,
        total: finalTotal,
        rate: finalTotal > 0 ? Math.round((finalPassed / finalTotal) * 100) : 0,
      },
    ]);

  // ── 4. Completion funnel ─────────────────────────────────────
  const allEnrollmentIds = (allEnrollments || []).map((e) => e.id);
  let moduleProgressAll: Array<{
    enrollment_id: string;
    module_id: string;
    status: string;
  }> = [];
  if (allEnrollmentIds.length > 0) {
    const { data } = await supabase
      .from("module_progress")
      .select("enrollment_id, module_id, status")
      .in("enrollment_id", allEnrollmentIds);
    moduleProgressAll = data || [];
  }

  // Get all modules per section for funnel
  let allModules: Array<{
    id: string;
    section_id: string;
  }> = [];
  if (sectionIds.length > 0) {
    const { data } = await supabase
      .from("course_modules")
      .select("id, section_id")
      .in("section_id", sectionIds);
    allModules = data || [];
  }

  const moduleToSection = new Map<string, string>();
  for (const m of allModules) {
    moduleToSection.set(m.id, m.section_id);
  }

  const modulesPerSection = new Map<string, Set<string>>();
  for (const m of allModules) {
    const set = modulesPerSection.get(m.section_id) || new Set();
    set.add(m.id);
    modulesPerSection.set(m.section_id, set);
  }

  // For each enrollment, track which sections are fully completed
  const enrollmentSectionComplete = new Map<string, Set<string>>();
  const completedModulesPerEnrollment = new Map<string, Set<string>>();

  for (const mp of moduleProgressAll) {
    if (mp.status === "completed") {
      const set =
        completedModulesPerEnrollment.get(mp.enrollment_id) || new Set();
      set.add(mp.module_id);
      completedModulesPerEnrollment.set(mp.enrollment_id, set);
    }
  }

  for (const [enrollmentId, completedMods] of completedModulesPerEnrollment) {
    const completedSections = new Set<string>();
    for (const [sectionId, sectionModules] of modulesPerSection) {
      const allDone = [...sectionModules].every((mId) =>
        completedMods.has(mId)
      );
      if (allDone) completedSections.add(sectionId);
    }
    enrollmentSectionComplete.set(enrollmentId, completedSections);
  }

  const totalEnrolled = (allEnrollments || []).length;
  const started = completedModulesPerEnrollment.size; // has at least 1 completed module

  const funnelSteps = [
    { name: "Enrolled", value: totalEnrolled },
    { name: "Started", value: started },
  ];

  // Per section: how many enrollments completed that section
  for (const s of (sections || []).sort(
    (a, b) => a.section_number - b.section_number
  )) {
    let count = 0;
    for (const [, completedSections] of enrollmentSectionComplete) {
      if (completedSections.has(s.id)) count++;
    }
    funnelSteps.push({
      name: `Part ${s.section_number}`,
      value: count,
    });
  }

  const completedCount = (allEnrollments || []).filter(
    (e) => e.status === "completed"
  ).length;
  funnelSteps.push({ name: "Completed", value: completedCount });

  // ── 5. Seat time stats ───────────────────────────────────────
  const { data: timeLogs } = await supabase
    .from("time_logs")
    .select("enrollment_id, duration_seconds")
    .in("enrollment_id", allEnrollmentIds);

  const timePerEnrollment = new Map<string, number>();
  for (const tl of timeLogs || []) {
    timePerEnrollment.set(
      tl.enrollment_id,
      (timePerEnrollment.get(tl.enrollment_id) || 0) + tl.duration_seconds
    );
  }

  const allTimes = [...timePerEnrollment.values()];
  const avgSeatTimeSeconds =
    allTimes.length > 0
      ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)
      : 0;

  // ── 6. Exam scores ──────────────────────────────────────────
  const { data: allExamAttempts } = await supabase
    .from("exam_attempts")
    .select("score, exam_type");

  const finalScores = (allExamAttempts || [])
    .filter((a) => a.exam_type === "final")
    .map((a) => a.score);
  const avgFinalScore =
    finalScores.length > 0
      ? Math.round(
          finalScores.reduce((a, b) => a + b, 0) / finalScores.length
        )
      : 0;

  // ── 7. Revenue from Stripe ──────────────────────────────────
  type MonthRevenue = { month: string; amount: number };
  const revenueByMonth: MonthRevenue[] = [];
  let totalRevenueCents = 0;

  try {
    const stripe = getStripe();
    // Fetch charges within date range
    const chargeParams: { limit: number; starting_after?: string; created?: { gte?: number; lte?: number } } = {
      limit: 100,
      created: {
        gte: Math.floor(new Date(dateFrom).getTime() / 1000),
        lte: Math.floor(new Date(dateTo).getTime() / 1000),
      },
    };

    const monthBuckets = new Map<string, number>();
    let hasMore = true;

    while (hasMore) {
      const charges = await stripe.charges.list(chargeParams);
      for (const charge of charges.data) {
        if (charge.status === "succeeded" && !charge.refunded) {
          totalRevenueCents += charge.amount;
          const date = new Date(charge.created * 1000);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          monthBuckets.set(key, (monthBuckets.get(key) || 0) + charge.amount);
        }
      }
      hasMore = charges.has_more;
      if (charges.data.length > 0) {
        chargeParams.starting_after =
          charges.data[charges.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    // Sort months and convert to array
    const sortedMonths = [...monthBuckets.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    for (const [month, amount] of sortedMonths) {
      revenueByMonth.push({ month, amount: amount / 100 });
    }
  } catch {
    // Stripe not configured
  }

  // ── 8. Time-to-complete for completed enrollments ───────────
  const completedEnrollments = (allEnrollments || []).filter(
    (e) => e.status === "completed"
  );
  const completionTimes: number[] = [];
  for (const e of completedEnrollments) {
    const time = timePerEnrollment.get(e.id);
    if (time && time > 0) completionTimes.push(time);
  }
  const avgTimeToComplete =
    completionTimes.length > 0
      ? Math.round(
          completionTimes.reduce((a, b) => a + b, 0) /
            completionTimes.length
        )
      : 0;

  // ── Assemble response ──────────────────────────────────────
  const completionRate =
    totalEnrolled > 0
      ? Math.round((completedCount / totalEnrolled) * 100)
      : 0;

  return NextResponse.json({
    stats: {
      totalStudents: totalEnrolled,
      completionRate,
      avgFinalScore,
      avgSeatTimeSeconds,
      avgTimeToCompleteSeconds: avgTimeToComplete,
      totalRevenue: totalRevenueCents / 100,
    },
    enrollmentTrend: (enrollments || []).map((e) => ({
      date: e.enrolled_at.split("T")[0],
    })),
    revenueByMonth,
    passRates,
    funnel: funnelSteps,
  });
}
