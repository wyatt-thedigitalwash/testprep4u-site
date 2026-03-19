// All demo student data for Phase 2 dashboard prototype.
// Every dashboard component pulls from this file.
// Designed for easy swap to real Supabase queries later.

export type ChapterStatus = "completed" | "in_progress" | "not_started" | "locked";
export type TopicStrength = "strong" | "moderate" | "weak";

export interface DemoStudent {
  id: string;
  name: string;
  email: string;
  state: string;
  plan: string;
  planLabel: string;
  enrolledDate: string;
  accessExpires: string;
}

export interface Course {
  id: string;
  name: string;
  type: "life" | "health";
  totalChapters: number;
  completedChapters: number;
  progress: number;
  lastActivity: string | null;
  description: string;
}

export interface Chapter {
  number: number;
  title: string;
  duration: string;
  status: ChapterStatus;
}

export interface ExamAttempt {
  id: number;
  date: string;
  score: number;
  totalQuestions: number;
}

export interface TopicArea {
  topic: string;
  weight: string;
  score: number;
  status: TopicStrength;
}

export interface DemoStats {
  studyHours: number;
  practiceExamAvg: number;
  coursesEnrolled: number;
}

export const demoStudent: DemoStudent = {
  id: "demo-001",
  name: "Alex Johnson",
  email: "demo@testprep4u.com",
  state: "Florida",
  plan: "pro",
  planLabel: "Pro",
  enrolledDate: "2026-01-15",
  accessExpires: "2026-10-15",
};

export const courses: Course[] = [
  {
    id: "fl-life",
    name: "Florida Life Insurance",
    type: "life",
    totalChapters: 8,
    completedChapters: 5,
    progress: 65,
    lastActivity: "2026-03-16",
    description:
      "Complete pre-licensing course covering general insurance concepts, life policy types, provisions, riders, and Florida state regulations.",
  },
  {
    id: "fl-health",
    name: "Florida Health Insurance",
    type: "health",
    totalChapters: 7,
    completedChapters: 0,
    progress: 0,
    lastActivity: null,
    description:
      "Complete pre-licensing course covering health insurance fundamentals, policy types, managed care, and Florida state regulations.",
  },
];

export const chapters: Record<string, Chapter[]> = {
  "fl-life": [
    { number: 1, title: "General Insurance Concepts", duration: "45 min", status: "completed" },
    { number: 2, title: "Life Policy Types", duration: "1 hr", status: "completed" },
    { number: 3, title: "Policy Provisions & Options", duration: "50 min", status: "completed" },
    { number: 4, title: "Riders & Benefits", duration: "40 min", status: "completed" },
    { number: 5, title: "Tax Considerations", duration: "35 min", status: "completed" },
    { number: 6, title: "Qualified & Retirement Plans", duration: "55 min", status: "in_progress" },
    { number: 7, title: "Florida Life Insurance Law", duration: "1 hr", status: "locked" },
    { number: 8, title: "Ethics & Producer Responsibilities", duration: "45 min", status: "locked" },
  ],
  "fl-health": [
    { number: 1, title: "Health Insurance Fundamentals", duration: "50 min", status: "not_started" },
    { number: 2, title: "Individual Health Policies", duration: "1 hr", status: "locked" },
    { number: 3, title: "Group Health Insurance", duration: "45 min", status: "locked" },
    { number: 4, title: "Managed Care & HMOs", duration: "40 min", status: "locked" },
    { number: 5, title: "Disability & Long-Term Care", duration: "50 min", status: "locked" },
    { number: 6, title: "Florida Health Insurance Law", duration: "55 min", status: "locked" },
    { number: 7, title: "ACA & Federal Regulations", duration: "45 min", status: "locked" },
  ],
};

export const examAttempts: Record<string, ExamAttempt[]> = {
  "fl-life": [
    { id: 1, date: "2026-03-01", score: 68, totalQuestions: 100 },
    { id: 2, date: "2026-03-08", score: 72, totalQuestions: 100 },
    { id: 3, date: "2026-03-15", score: 76, totalQuestions: 100 },
  ],
  "fl-health": [],
};

export const topicBreakdown: Record<string, TopicArea[]> = {
  "fl-life": [
    { topic: "General Insurance Concepts", weight: "10–15%", score: 82, status: "strong" },
    { topic: "Life Policy Types", weight: "20–25%", score: 78, status: "moderate" },
    { topic: "Policy Provisions & Riders", weight: "20–25%", score: 65, status: "weak" },
    { topic: "Tax Considerations", weight: "10–15%", score: 85, status: "strong" },
    { topic: "Qualified & Retirement Plans", weight: "10–15%", score: 71, status: "moderate" },
    { topic: "Florida State Regulations", weight: "15–20%", score: 74, status: "moderate" },
  ],
  "fl-health": [],
};

export const stats: DemoStats = {
  studyHours: 24,
  practiceExamAvg: 76,
  coursesEnrolled: 2,
};

// Helper to get a course by ID
export function getCourse(courseId: string): Course | undefined {
  return courses.find((c) => c.id === courseId);
}

// Helper to get chapters for a course
export function getChapters(courseId: string): Chapter[] {
  return chapters[courseId] ?? [];
}

// Helper to get exam attempts for a course
export function getExamAttempts(courseId: string): ExamAttempt[] {
  return examAttempts[courseId] ?? [];
}

// Helper to get topic breakdown for a course
export function getTopicBreakdown(courseId: string): TopicArea[] {
  return topicBreakdown[courseId] ?? [];
}
