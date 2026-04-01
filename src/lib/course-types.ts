// Shared types and utility functions for course data.
// Safe to import from both server and client components.

/* ── Types ─────────────────────────────────────────────────── */

export interface CourseEnrollment {
  enrollmentId: string;
  courseId: string;
  courseSlug: string;
  courseName: string;
  courseType: string;
  courseState: string;
  requiredHours: number;
  tier: string;
  status: string;
  enrolledAt: string;
  expiresAt: string;
  affidavitAcceptedAt: string | null;
  hasStarted: boolean;
}

export interface ModuleData {
  id: string;
  sectionId: string;
  moduleType: "lesson" | "quiz";
  title: string;
  scormEntryPath: string;
  sortOrder: number;
  quizPassScore: number | null;
}

export interface ModuleProgress {
  moduleId: string;
  status: "not_started" | "in_progress" | "completed";
  completionStatus: string;
  successStatus: string;
  score: number | null;
  timeSpentSeconds: number;
  lastAccessed: string | null;
  completedAt: string | null;
  bookmark: string | null;
}

export interface SectionData {
  id: string;
  sectionNumber: number;
  title: string;
  sortOrder: number;
  modules: ModuleData[];
}

export interface SectionWithProgress extends SectionData {
  modules: (ModuleData & {
    progress: ModuleProgress | null;
    isUnlocked: boolean;
  })[];
  isUnlocked: boolean;
  completedModules: number;
  totalModules: number;
  totalTimeSeconds: number;
  quizStatus: "not_started" | "passed" | "failed" | null;
  quizScore: number | null;
}

export interface CourseDetail {
  enrollment: CourseEnrollment;
  sections: SectionWithProgress[];
  totalTimeSeconds: number;
  requiredTimeSeconds: number;
  completedModules: number;
  totalModules: number;
  progressPercent: number;
  allSectionsComplete: boolean;
  canTakeFinalExam: boolean;
  finalExamPassed: boolean;
  meetsHourRequirement: boolean;
  hasAffidavit: boolean;
  canGetCertificate: boolean;
}

export interface ExamAttemptData {
  id: string;
  examType: "practice" | "final";
  mode: "learning" | "exam";
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  timeSpentSeconds: number;
  attemptedAt: string;
}

/* ── Format Helpers ────────────────────────────────────────── */

export function formatTime(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return `${Math.round(hours * 10) / 10}`;
}
