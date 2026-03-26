export interface PricingTier {
  slug: "essentials" | "pro" | "premium";
  name: string;
  tagline: string;
  highlighted: boolean;
  features: {
    label: string;
    included: boolean;
    comingSoon?: boolean;
  }[];
  accessMonths: number;
  hasGuarantee: boolean;
  prices: {
    life: number;
    health: number;
    combined: number;
  };
}

export type CourseType = "life" | "health" | "combined";

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  life: "Life",
  health: "Health",
  combined: "Life & Health",
};

export const COURSE_FULL_NAMES: Record<CourseType, string> = {
  life: "Florida Life Insurance",
  health: "Florida Health Insurance",
  combined: "Florida Life & Health Insurance",
};

export const PRICING_TIERS: PricingTier[] = [
  {
    slug: "essentials",
    name: "Essentials",
    tagline: "Get licensed.",
    highlighted: false,
    accessMonths: 6,
    hasGuarantee: false,
    prices: { life: 149, health: 149, combined: 179 },
    features: [
      { label: "Pre-licensing course content", included: true },
      { label: "Chapter quizzes", included: true },
      { label: "3 full practice exams", included: true },
      { label: "Progress tracking", included: true },
      { label: "Completion certificate", included: true },
      { label: "24/7 chat support", included: true },
      { label: "Unlimited practice retakes", included: false },
      { label: "AI-adaptive review", included: false },
      { label: "Study guides (PDF)", included: false },
      { label: "Digital flashcards", included: false },
      { label: "Exam readiness predictor", included: false },
      { label: "First-time pass guarantee", included: false },
      { label: "Video instruction", included: false },
      { label: "Priority support", included: false },
      { label: "Printed study guide", included: false },
      { label: "Live review sessions", included: false, comingSoon: true },
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    tagline: "Pass the first time.",
    highlighted: true,
    accessMonths: 9,
    hasGuarantee: true,
    prices: { life: 219, health: 219, combined: 259 },
    features: [
      { label: "Pre-licensing course content", included: true },
      { label: "Chapter quizzes", included: true },
      { label: "3 full practice exams", included: true },
      { label: "Progress tracking", included: true },
      { label: "Completion certificate", included: true },
      { label: "24/7 chat support", included: true },
      { label: "Unlimited practice retakes", included: true },
      { label: "AI-adaptive review", included: true },
      { label: "Study guides (PDF)", included: true },
      { label: "Digital flashcards", included: true },
      { label: "Exam readiness predictor", included: true },
      { label: "First-time pass guarantee", included: true },
      { label: "Video instruction", included: false },
      { label: "Priority support", included: false },
      { label: "Printed study guide", included: false },
      { label: "Live review sessions", included: false, comingSoon: true },
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    tagline: "The full advantage.",
    highlighted: false,
    accessMonths: 12,
    hasGuarantee: true,
    prices: { life: 319, health: 319, combined: 369 },
    features: [
      { label: "Pre-licensing course content", included: true },
      { label: "Chapter quizzes", included: true },
      { label: "3 full practice exams", included: true },
      { label: "Progress tracking", included: true },
      { label: "Completion certificate", included: true },
      { label: "24/7 chat support", included: true },
      { label: "Unlimited practice retakes", included: true },
      { label: "AI-adaptive review", included: true },
      { label: "Study guides (PDF)", included: true },
      { label: "Digital flashcards", included: true },
      { label: "Exam readiness predictor", included: true },
      { label: "First-time pass guarantee", included: true },
      { label: "Video instruction", included: true },
      { label: "Priority support", included: true },
      { label: "Printed study guide", included: true },
      { label: "Live review sessions", included: true, comingSoon: true },
    ],
  },
];
