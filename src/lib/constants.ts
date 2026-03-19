export const STATS = {
  nationalPassRate: "57.9%",
  nationalPassRateSource: "NAIC 2020",
  tp4uPassRate: "TBD", // ⚑ CLIENT ACTION REQUIRED: Insert verified TestPrep4U first-attempt pass rate
  targetPracticeScore: "80%+",
  preLicensingHoursLife: "~40",
  preLicensingHoursHealth: "~40",
  preLicensingHoursCombined: "~60",
  examQuestions: "100–150",
  passingScore: "70%",
  examDuration: "2–3 hours",
  examFeeRange: "$40–$150",
  fingerprintFeeRange: "$23–$90",
} as const;

export const SITE = {
  name: "TestPrep4U",
  url: "https://testprep4u.com",
  tagline: "Understand. Retain. Succeed.",
  supportEmail: "", // ⚑ CLIENT ACTION REQUIRED: Supply support email
  supportPhone: "", // ⚑ CLIENT ACTION REQUIRED: Supply support phone
} as const;

export const NAV_LINKS = [
  { label: "How It Works", href: "/how-to-get-your-insurance-license" },
  {
    label: "Courses",
    href: "#",
    children: [
      { label: "Life Insurance", href: "/life-insurance-exam-prep" },
      { label: "Health Insurance", href: "/health-insurance-exam-prep" },
      {
        label: "Life & Health Combined",
        href: "/life-and-health-insurance-exam-prep",
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LINKS = {
  courses: [
    { label: "Life Insurance Exam Prep", href: "/life-insurance-exam-prep" },
    {
      label: "Health Insurance Exam Prep",
      href: "/health-insurance-exam-prep",
    },
    {
      label: "Life & Health Combined",
      href: "/life-and-health-insurance-exam-prep",
    },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "Pricing", href: "/pricing" },
  ],
  resources: [
    {
      label: "How to Get Licensed",
      href: "/how-to-get-your-insurance-license",
    },
    { label: "Florida", href: "/states/florida" },
  ],
} as const;
