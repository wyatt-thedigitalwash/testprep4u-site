// ---------------------------------------------------------------------------
// states.ts — State-specific licensing data
// Only Florida is populated for Phase 1. Add additional states as needed.
// ---------------------------------------------------------------------------

export interface StateQuickFact {
  value: string;
  label: string;
  context: string;
}

export interface StateFaqItem {
  question: string;
  answer: string;
}

export interface StateData {
  slug: string;
  name: string;
  abbreviation: string;
  requiredHours: {
    life: number;
    health: number;
    combined: number;
  };
  passingScore: string;
  examQuestions: {
    life: number;
    health: number;
    combined: number;
  };
  examDuration: string;
  examFee: string;
  testingProvider: string;
  fingerprintFee: string;
  regulatoryBody: string;
  regulatoryUrl: string;
  stateSpecificNotes: string[];
  quickFacts: StateQuickFact[];
  faqItems: StateFaqItem[];
  meta: {
    title: string;
    description: string;
  };
  hero: {
    headline: string;
    subheadline: string;
  };
}

const STATES: Record<string, StateData> = {
  florida: {
    slug: "florida",
    name: "Florida",
    abbreviation: "FL",
    requiredHours: {
      life: 60,
      health: 40,
      combined: 60,
    },
    passingScore: "70%",
    examQuestions: {
      life: 100,
      health: 100,
      combined: 150,
    },
    examDuration: "2 hours",
    examFee: "$55.75",
    testingProvider: "Pearson VUE",
    fingerprintFee: "~$50",
    regulatoryBody: "Florida Department of Financial Services",
    regulatoryUrl: "https://www.myfloridacfo.com/division/agents",
    stateSpecificNotes: [
      "Florida requires 60 hours of pre-licensing education for Life — more than most states.",
      "Fingerprinting is done electronically through an approved vendor (Cogent/IDEMIA) and must be completed before your license is issued.",
      "Continuing education: 24 hours every 2 years, including a 4-hour law update and an 8-hour ethics course for your first renewal.",
    ],
    quickFacts: [
      {
        value: "60 hrs",
        label: "Life pre-licensing hours",
        context:
          "Florida requires 60 hours for Life — more than most states.",
      },
      {
        value: "40 hrs",
        label: "Health pre-licensing hours",
        context: "Required before sitting for the Health insurance exam.",
      },
      {
        value: "70%",
        label: "Minimum passing score",
        context: "Required on the Florida state licensing exam.",
      },
      {
        value: "100–150",
        label: "Multiple-choice questions",
        context:
          "100 for Life or Health, 150 for the Combined exam.",
      },
      {
        value: "$55.75",
        label: "Exam registration fee",
        context:
          "Per attempt — those who don't pass must pay it again.",
      },
      {
        value: "57.9%",
        label: "National first-attempt pass rate",
        context: "Percentage who pass on their first try. (NAIC 2020)",
      },
    ],
    faqItems: [
      {
        question: "How many pre-licensing hours does Florida require?",
        answer:
          "Florida requires 60 hours of pre-licensing education for a Life insurance license and 40 hours for Health. If you're pursuing a combined Life & Health license, you'll need 60 hours total. TestPrep4U courses satisfy the full requirement for each license type.",
      },
      {
        question: "Where do I take the Florida insurance exam?",
        answer:
          "Florida insurance exams are administered by Pearson VUE at testing centers throughout the state. You can schedule your exam online at pearsonvue.com after completing your pre-licensing education. The exam fee is $55.75 per attempt.",
      },
      {
        question:
          "What score do I need to pass the Florida insurance exam?",
        answer:
          "You need a minimum score of 70% to pass the Florida insurance licensing exam. The exam is computer-based and multiple choice — 100 questions for Life or Health, 150 for the Combined exam. You'll receive your score immediately upon completion.",
      },
      {
        question:
          "Do I need fingerprinting for a Florida insurance license?",
        answer:
          "Yes. Florida requires electronic fingerprinting through an approved vendor (Cogent/IDEMIA). The fee is approximately $50. Fingerprints must be submitted before your license can be issued. Your background check is processed by the Florida Department of Financial Services.",
      },
      {
        question:
          "What are the continuing education requirements in Florida?",
        answer:
          "Florida licensed insurance agents must complete 24 hours of continuing education every 2 years. Your first renewal requires a 4-hour law update course and an 8-hour ethics course. Subsequent renewals require 24 hours of approved CE, including any state-mandated topics.",
      },
    ],
    meta: {
      title:
        "Florida Insurance License Exam Prep | Pass the First Time | TestPrep4U",
      description:
        "Prepare for your Florida insurance licensing exam with TestPrep4U. State-approved pre-licensing courses for Life, Health, and Combined licenses. 60-hour Life course, practice exams, and 24/7 support.",
    },
    hero: {
      headline: "Florida Insurance License Exam Prep",
      subheadline:
        "State-approved pre-licensing courses tailored to Florida's exam requirements. Everything you need to pass — the first time.",
    },
  },
};

export function getStateBySlug(slug: string): StateData | null {
  return STATES[slug] ?? null;
}

export function getAllStateSlugs(): string[] {
  return Object.keys(STATES);
}
