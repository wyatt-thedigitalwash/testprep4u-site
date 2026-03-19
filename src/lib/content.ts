// ---------------------------------------------------------------------------
// content.ts — All marketing copy from client content docs (Jason Van Steenwyk)
// Organized by page. Exact copy preserved. Client action items marked with ⚑.
// ---------------------------------------------------------------------------

// ========================== SHARED / REUSABLE ==============================

export const shared = {
  guarantee: {
    headline: "Our First-Time Pass Guarantee",
    body: "Score 80% or better on three practice exams within five days of your exam date. If you don't pass, we will issue a full refund.",
    // ⚑ CLIENT ACTION REQUIRED: Finalize guarantee terms with legal/management before publishing.
  },

  whyNow: {
    headline: "Why Now Is the Best Time to Become an Insurance Agent",
    subhead: "The Market Opportunity",
    bullets: [
      "More than 50% of active agents are over age 45. The average life agent is nearly 60.",
      "Thousands retire annually — leaving behind books of business that need new agents.",
      "10,000 Americans turn 65 every day, driving sustained Medicare demand.",
      "Over 100 million Americans lack adequate life insurance coverage.",
    ],
    closing: "Someone has to step in. That someone is you.",
  },

  metricStrip: {
    items: [
      {
        value: "57.9%",
        label: "National First-Time Pass Rate",
        source: "NAIC 2020",
        tone: "warning" as const,
      },
      {
        value: "TBD%", // ⚑ CLIENT ACTION REQUIRED: Insert verified TestPrep4U first-attempt pass rate
        label: "TestPrep4U Pass Rate",
        source: "",
        tone: "success" as const,
      },
      {
        value: "80%+",
        label: "Target Practice Score",
        source:
          "Consistently score this on practice exams → schedule with confidence",
        tone: "brand" as const,
      },
    ],
  },

  quickFacts: {
    headline: "What to Expect: Licensing by the Numbers",
    items: [
      {
        value: "20–60 hrs",
        label: "Pre-licensing education required",
        context: "In most states before you can sit for the exam.",
      },
      {
        value: "100–150",
        label: "Multiple-choice questions",
        context: "Multiple-choice questions on Life or Health exam.",
      },
      {
        value: "70%",
        label: "Minimum passing score",
        context: "Required in most states. Click your state page for specifics.",
      },
      {
        value: "2–3 hrs",
        label: "Standard exam time window",
        context: "To complete your computer-based exam.",
      },
      {
        value: "$40–$150",
        label: "Typical exam registration fee",
        context: "Those who don't pass must pay it again.",
      },
      {
        value: "57.9%",
        label: "First-attempt pass rate",
        context:
          "The percentage who pass on their first try. (NAIC 2020)",
      },
    ],
  },
} as const;

// ========================== HOME PAGE ======================================

export const homePage = {
  meta: {
    title: "Insurance Exam Prep Courses | Pass the First Time | TestPrep4U",
    description:
      "State-approved insurance pre-licensing courses designed to help you pass the first time. User-friendly online learning, realistic practice exams, and 24/7 support.",
  },

  hero: {
    headline: "Understand. Retain. Succeed.",
    subheadline:
      "The Best Online Insurance License Exam Prep In the Industry.",
    body: [
      "For decades, most insurance pre-licensing courses were built for compliance.",
      "TestPrep4U is built to help you learn.",
      "Our platform is built on proven adult learning principles, best-in-class instructional design, and structured learning approaches. All to help you learn the material more quickly, retain what you learned, and pass the exam on your first try.",
      "So you can start your career as an insurance professional.",
    ],
    cta: "Start Learning Now",
  },

  featureGrid: {
    headline: "The TestPrep4U Difference",
    subheadline:
      "Most insurance pre-licensing courses are built for compliance. TestPrep4U is built to help you learn — and pass on your first attempt.",
    cards: [
      {
        title: "Intuitive, Modern Platform",
        description:
          "A clean, distraction-free experience built for focus — not fighting clunky software.",
        bullets: [
          "Zero-clutter interface",
          "Built-in progress tracking",
          "Works on any device",
          "Designed to reduce friction",
        ],
      },
      {
        title: "State-Specific, Up-to-Date Instruction",
        description:
          "Tailored to your state's exam format and updated for current regulations.",
        bullets: [
          "Weighted to your state's exam",
          "Current suitability rules included",
          "State-required ethics built in",
          "Aligned to official exam outlines",
        ],
      },
      {
        title: "Designed by Adult Learning Experts",
        description:
          "Built by instructional designers, not compliance managers. Every lesson is structured for retention.",
        bullets: [
          "Proven learning science methods",
          "Competency-based progression",
          "Interactive knowledge checks",
          "Reduces cognitive overload",
        ],
      },
      {
        title: "AI-Guided, Adaptive Learning",
        description:
          "Identifies your weak areas and adjusts your study path automatically.",
        bullets: [
          "Finds knowledge gaps in real time",
          "Adjusts difficulty dynamically",
          "Targets review where you need it",
          "Predicts your exam readiness",
        ],
      },
      {
        title: "Built for Multiple Learning Styles",
        description:
          "Every concept reinforced through text, video, and practice — however you learn best.",
        bullets: [
          "Text-based instruction",
          "Visual concept mapping",
          "Scenario-based application",
          "Universal Design for Learning",
        ],
      },
      {
        title: "Designed for Mastery — Not Memorization",
        description:
          "Teaches deep understanding so you pass the exam and retain it for your career.",
        bullets: [
          "Spaced repetition built in",
          "Active retrieval practice",
          "Interleaved question sets",
          "Metacognitive feedback loops",
        ],
      },
    ],
  },

  stepsOverview: {
    headline: "Your Roadmap to an Insurance License",
    subheadline: "Six steps from today to your first sale.",
    intro:
      "You're dreaming of a career as an insurance professional. We make that dream a reality for people every day. Whether you're just entering the work force or you're a seasoned professional from another field pivoting to a career change, TestPrep4U is here to help guide you, every step along the way.",
    closingIntro: "Here's the roadmap that will take you to your goal:",
    steps: [
      {
        number: 1,
        title: "Decide What to Sell",
        description:
          "Choose your path — Life, Health, or both. Each opens different markets and income streams.",
      },
      {
        number: 2,
        title: "Enroll and Study",
        description:
          "Complete state-approved pre-licensing education. TestPrep4U covers all 50 states.",
      },
      {
        number: 3,
        title: "Pass Your Exam",
        description:
          "Master the material with AI-adaptive practice exams. Score 80%+ and pass with confidence.",
      },
    ],
    cta: "See the Full Roadmap",
    ctaHref: "/how-to-get-your-insurance-license",
  },

  faqPreview: {
    headline: "Frequently Asked Questions",
    items: [
      {
        question: "How hard is the insurance license exam?",
        answer:
          "That depends almost entirely on how you prepare. Nationwide, the average first-attempt pass rate is 57.9% (NAIC 2020). Students who complete a structured, state-specific prep program and consistently score 80% or higher on practice exams pass at a much higher rate. TestPrep4U is built to get you there.",
      },
      {
        question: "What is the insurance license exam like?",
        answer:
          "Expect a computer-based, multiple-choice exam. You'll have 90–120 minutes depending on your state and license type. You'll receive your score immediately upon completion.",
      },
      {
        question: "Is there a first-time pass guarantee?",
        answer:
          "Yes. Score 80% or better on three practice exams within five days of your exam date. If you do not pass, send us verification and we will issue a full refund.",
        // ⚑ CLIENT ACTION REQUIRED: Finalize guarantee terms with legal before publishing.
      },
      {
        question: "How long does exam preparation take?",
        answer:
          "Most students should plan to devote 30–40 hours of study. The combined Life & Health exam may require slightly more. Our platform's efficient methodology reduces unnecessary prep time.",
      },
      {
        question: "What happens if I don't pass the exam on my first attempt?",
        answer:
          "You can retake the exam — but you'll have to pay the exam fee again ($40–$150 depending on your state). Every week you spend retaking and re-studying is another week you aren't earning commissions. TestPrep4U is designed specifically to reduce that risk.",
      },
      {
        question: "Why is TestPrep4U different?",
        answer:
          "Most insurance pre-licensing courses are built around compliance requirements. Ours are built around how people actually learn — designed by instructional design professionals, grounded in adult learning theory, and enhanced with AI-powered adaptive technology that focuses your study time where it matters most.",
      },
      {
        question: "Are your materials state-specific?",
        answer:
          "Yes. All exam materials across all 50 states are geared specifically to that state's exam requirements and specifications.",
      },
    ],
    cta: "See All FAQs",
    ctaHref: "/faq",
  },

  bottomCta: {
    headline: "Ready to Start Your Insurance Career?",
    body: "Join thousands of students who chose the smarter way to prepare. State-approved courses, AI-powered practice exams, and 24/7 support.",
    cta: "Start Learning Now",
  },
} as const;

// ========================== PROCESS PAGE ===================================

export const processPage = {
  meta: {
    title:
      "How to Get Your Insurance License | 6-Step Guide | TestPrep4U",
    description:
      "Complete guide to getting your insurance license. Learn the 6 steps from choosing your license type to making your first sale. State-specific requirements for all 50 states.",
  },

  headline: "Your Roadmap to an Insurance License",
  subheadline: "Six steps from enrollment to your first sale.",

  steps: [
    {
      number: 1,
      title: "Decide What Insurance You Want to Sell",
      tag: "DECIDE",
      body: "Choose your path — Life, Health, or both. Each opens different markets and income streams.",
      bullets: [
        "Life license: term, permanent, cash value insurance, and fixed annuities",
        "Health license: individual and group health, disability, long-term care, Medicare Advantage, Medigap",
        "Combined Life & Health: maximum flexibility and income potential — one exam",
      ],
      fullBody: [
        "Life insurance? Health insurance? Or both?",
        "A life insurance license qualifies you to sell term insurance and permanent, cash value insurance, and fixed annuities, which provide a safe, reliable source of income. As a life insurance agent, your focus will be on promises, protection, and guarantees.",
        "As a health insurance agent, you'll help individuals and families gain affordable access to health care. You may also sell disability income protection and long-term care insurance to individuals or employee groups. You may also help senior citizens with Medicare Advantage or Medicare supplement insurance (Medigap).",
        "For maximum flexibility and income potential, you can get licensed for both, on one single exam.",
      ],
    },
    {
      number: 2,
      title: "Enroll in State-Approved Pre-Licensing Education",
      tag: "ENROLL",
      body: "State-approved instruction required before you can sit for the exam. TestPrep4U covers all 50 states.",
      bullets: [
        "Life only: ~40 hours",
        "Health only: ~40 hours",
        "Combined Life & Health: ~60 hours",
      ],
      fullBody: [
        "Each state has their own required curriculum for those taking the insurance license exam.",
        "In most states, you must receive this instruction from an approved course provider, such as TestPrep4U. Each of our courses are geared specifically towards the requirements of your state.",
      ],
      callout: {
        title: "Why Cheap Can Be Expensive",
        body: "A failed exam means another registration fee ($100+) and more weeks without income. Every week studying is another week not selling. TestPrep4U's advanced platform minimizes that risk — and pays for itself on your first sale.",
      },
    },
    {
      number: 3,
      title: "Take Practice Exams Until You Score 80% or Higher",
      tag: "STUDY",
      body: "AI-adaptive technology identifies weak areas and focuses your study time. Score 80%+ and pass with confidence.",
      bullets: [],
      fullBody: [
        "Our full-length, realistic practice exams are aligned to your state's official exam outline and designed to mirror the real testing experience. After each exam, you receive immediate feedback and clear explanations so you understand why an answer is correct — not just whether you got it right.",
        "Our advanced, AI-powered system analyzes your performance, identifies weak areas, and directs you to targeted review. Take as many practice exams as you need; you should aim to consistently score 80% or higher before sitting for the exam.",
        "If you are consistently scoring 80% or more on our practice exams, you can schedule your state exam with confidence.",
      ],
    },
    {
      number: 4,
      title: "Schedule and Take Your State Exam",
      tag: "EXAM",
      body: "100–150 multiple-choice questions. 2–3 hours. Score reported immediately upon completion.",
      bullets: [],
      fullBody: [
        "When you're consistently scoring 80%+, you're ready. Most states contract test administration to Pearson VUE or Prometric.",
      ],
      whatToBring: ["Valid government photo ID"],
      whatToExpect: [
        "Photo, digital signature, or biometric verification",
        "Phone, watch, and personal items stored in a locker",
        "Quiet, proctored computer terminal",
        "Score reported immediately upon completion",
      ],
    },
    {
      number: 5,
      title: "Get Fingerprinted and Pass Your Background Check",
      tag: "CLEAR",
      body: "Required in most states. Fee: $23–$90.",
      bullets: [],
      fullBody: [
        "Most states require fingerprinting and a criminal background check before full licensure. In some states this happens at the test site; in others, you'll visit a law enforcement agency. Expect a fee of $23–$90.",
      ],
    },
    {
      number: 6,
      title: "Get Appointed and Start Selling",
      tag: "LAUNCH",
      body: "Carrier appointment required before first sale. Your agency submits paperwork to the state DOI. Processed within days — then you're cleared to sell.",
      bullets: [
        "Independent agents: usually appointed with multiple carriers for maximum product flexibility",
        "Captive agents: typically appointed exclusively with one carrier",
        "Appointments are processed within a few days; some states charge $5–$25 per carrier",
      ],
      fullBody: [
        "Before you can sell an insurance product, each carrier must formally appoint you with your state's Department of Insurance. Your agency or recruiter typically handles this after you sign a producer agreement.",
      ],
    },
  ],

  congratulations: {
    headline: "Congratulations — You're Ready to Sell!",
    body: "And when you're ready to add new lines, expand to additional states, or deepen your expertise, TestPrep4U will be with you every step of the way.",
  },

  bottomCta: "Start Learning Now",
} as const;

// ========================== ABOUT / COURSES PAGE ===========================

export const aboutPage = {
  meta: {
    title: "About TestPrep4U | Why We're Different | Insurance Exam Prep",
    description:
      "We provide quality, state-specific insurance test prep instruction using the latest advancements in instructional design and online learning.",
  },

  intro: {
    headline: "About Us",
    body: "We provide quality, state specific insurance test prep instruction, using the latest advancements and innovations in instructional design and online learning. So you can master the material, and pass the exam the first time.",
  },

  courseCards: {
    headline: "Online Courses for Insurance Exams",
    cards: [
      {
        title: "Life",
        description:
          "Everything you need to know to start your new career as a life insurance and annuity agent.",
        bullets: [
          "Multimedia instruction, to support multiple learning styles",
          "Technology-enabled, AI-powered, self-guiding instruction",
          "Intuitive, user-friendly user experience",
          "Realistic practice exams",
        ],
        cta: "Life Insurance Exam Details",
        href: "/life-insurance-exam-prep",
      },
      {
        title: "Health",
        description:
          "Help people access the healthcare they deserve. Sell health insurance, Medicare plans, disability income or long-term care insurance to businesses or individuals.",
        bullets: [
          "Easy-to-use",
          "Mobile-friendly",
          "24/7 Q and A support",
          "Thorough practice tests, so you can take your exam with confidence",
        ],
        cta: "Health Insurance Exam Details",
        href: "/health-insurance-exam-prep",
      },
      {
        title: "Life and Health (Combined)",
        description:
          "Help individuals and businesses with life insurance, guaranteed income, health, disability, and long term care insurance.",
        bullets: [
          "Integrated, streamlined curriculum",
          "AI-guided focus on weak areas",
          "Reinforced cross-topic learning",
          "State-specific exam prep",
        ],
        cta: "Combined Exam Details",
        href: "/life-and-health-insurance-exam-prep",
      },
    ],
  },
} as const;

// ========================== FAQ PAGE =======================================

export const faqPage = {
  meta: {
    title:
      "Insurance Exam FAQ | Common Questions Answered | TestPrep4U",
    description:
      "Get answers to common questions about the insurance license exam, study requirements, pass rates, and TestPrep4U's exam prep platform.",
  },

  headline: "Frequently Asked Questions",

  items: [
    // --- About TestPrep4U ---
    {
      category: "About TestPrep4U",
      question: "Why is TestPrep4U different?",
      answer:
        "Most insurance pre-licensing courses are built around compliance requirements. Ours are built around how people actually learn. Courses are designed by instructional design professionals, grounded in adult learning theory, and enhanced with AI-powered adaptive technology that identifies weak areas and focuses your study time where it matters most.",
    },
    {
      category: "About TestPrep4U",
      question: "Are your materials state-specific?",
      answer:
        "Yes. All exam materials across all 50 states are geared specifically to that state's exam requirements and specifications.",
    },
    {
      category: "About TestPrep4U",
      question: "What is your pass rate?",
      answer:
        "As of 2026, ___% of students who score 80%+ on our practice exams pass on their first attempt.",
      // ⚑ CLIENT ACTION REQUIRED: Insert verified TestPrep4U first-attempt pass rate.
    },
    {
      category: "About TestPrep4U",
      question: "What is your first-time pass guarantee?",
      answer:
        "Score 80% or better on three practice exams within five days of your exam date. If you do not pass, send us verification and we will issue a full refund.",
      // ⚑ CLIENT ACTION REQUIRED: Finalize guarantee terms with legal before publishing.
    },
    {
      category: "About TestPrep4U",
      question: "Who is TestPrep4U for?",
      answer: "U!",
      // ⚑ CLIENT ACTION REQUIRED: Confirm whether this answer is intentional brand voice or a placeholder.
    },

    // --- Exam Preparation ---
    {
      category: "Exam Preparation",
      question: "How long does exam preparation take?",
      answer:
        "Most students should plan to devote 30–40 hours of study. The combined Life & Health exam may require slightly more. Our platform's efficient methodology reduces unnecessary prep time.",
    },
    {
      category: "Exam Preparation",
      question:
        "How do I complete my pre-licensing education requirements before the exam?",
      answer:
        "In most states, you must complete a minimum number of pre-licensing education hours from a state-approved provider before you can sit for the licensing exam. TestPrep4U is an approved provider offering state-specific courses for all 50 states — built not just to satisfy the requirement, but to actually prepare you to pass. Our courses are designed by instructional design professionals using proven adult learning principles, and powered by AI technology that adjusts to your individual performance. When you finish, we issue your completion certificate automatically. Enroll in your state's course at TestPrep4U and your pre-licensing requirement and your exam preparation happen in one place.",
    },

    // --- The Exam ---
    {
      category: "The Exam",
      question: "What is the insurance license exam like?",
      answer:
        "Expect a computer-based, multiple-choice exam. You'll have 90–120 minutes depending on your state and license type. You'll receive your score immediately upon completion.",
    },
    {
      category: "The Exam",
      question: "Is the insurance license exam hard?",
      answer:
        "That depends almost entirely on how you prepare. Nationwide, the average first-attempt pass rate is 57.9%, according to the National Association of Insurance Commissioners. Students who complete a structured, state-specific prep program and consistently score 80% or higher on practice exams before sitting for the real test pass at a much higher rate. TestPrep4U is built to get you there.",
      // ⚑ CLIENT ACTION REQUIRED: Insert TestPrep4U's verified first-attempt pass rate once confirmed.
    },
    {
      category: "The Exam",
      question: "What will be covered on the life insurance exam?",
      answer:
        "The Life insurance exam covers six primary topic areas: General Insurance Concepts (10–15%), Life Policy Types (20–25%), Policy Provisions & Riders (20–25%), Policy Values & Taxation (10–15%), Annuities (10–15%), and State Laws & Regulations (10–15%). Topic weights are typical ranges — your state's exam outline is the authoritative source.",
    },
    {
      category: "The Exam",
      question: "What will be covered on the health insurance exam?",
      answer:
        "The Health exam covers Health Policy Types (HMOs, PPOs, and more), Disability & Income Protection, Medical Plans & Cost Sharing, Government Programs (including Medicare, which is heavily tested), Supplemental Policies, Policy Provisions, and State Laws & Regulations.",
    },
    {
      category: "The Exam",
      question: "What should I bring to the exam?",
      answer:
        "Bring a valid, government-issued photo ID. Most testing centers will photograph you at check-in. Some states also require a digital signature, palm scan, or fingerprint verification before you enter the testing room. You'll store your phone, watch, wallet, and all personal items in a provided locker — nothing goes in with you. The testing center provides everything you're permitted to use.",
    },
    {
      category: "The Exam",
      question: "How soon will I know if I passed?",
      answer:
        "You'll know immediately. The exam is scored automatically, and your result appears on screen as soon as you complete the test. If you pass, you'll receive a score report. If you don't, you'll receive a diagnostic breakdown showing which topic areas need more work.",
    },

    // --- After the Exam ---
    {
      category: "After the Exam",
      question: "What happens if I don't pass the exam on my first attempt?",
      answer:
        "You can retake the exam — but you'll have to pay the exam fee again. Each exam fee typically runs between $40 and $150 depending on your state. More importantly, every week you spend retaking and re-studying is another week you aren't earning commissions. TestPrep4U is designed specifically to reduce that risk.",
      // ⚑ CLIENT ACTION REQUIRED: Confirm finalized guarantee terms before publishing.
    },
  ],
} as const;

// ========================== PRICING PAGE ===================================

export const pricingPage = {
  meta: {
    title: "Pricing & Plans | Insurance Exam Prep | TestPrep4U",
    description:
      "Compare TestPrep4U exam prep packages. Essentials, Pro, and Premium tiers for Life, Health, and Combined insurance license courses.",
  },

  headline: "Choose Your Plan",
  subheadline:
    "Every plan includes state-approved pre-licensing content. Choose the level of support that fits your goals.",
  teamCallout: {
    headline: "Enrolling a team?",
    body: "Contact us for group pricing and manager dashboards.",
    cta: "Contact Us",
    href: "/contact",
  },
} as const;

// ========================== COURSE PAGES (shared template) =================

export const coursePages = {
  life: {
    meta: {
      title:
        "Life Insurance Exam Prep | Online Pre-Licensing Course | TestPrep4U",
      description:
        "Pass your life insurance licensing exam on the first try. State-approved pre-licensing course with AI-powered practice exams, study guides, and 24/7 support.",
    },
    headline: "Life Insurance Exam Prep",
    description:
      "Everything you need to know to start your new career as a life insurance and annuity agent.",
    cta: "Start My Life License",
    examTable: {
      title: "What's Covered on the Life Insurance Exam",
      sections: [
        {
          name: "General Insurance Concepts",
          weight: "10–15%",
          topics: "Definitions, risk, insurability, insurable interest",
        },
        {
          name: "Life Policy Types",
          weight: "20–25%",
          topics: "Term, Whole, Universal, Variable",
        },
        {
          name: "Policy Provisions & Riders",
          weight: "20–25%",
          topics: "The single biggest memorization section",
        },
        {
          name: "Policy Values & Taxation",
          weight: "10–15%",
          topics: "Loans, dividends, MEC rules",
        },
        {
          name: "Annuities",
          weight: "10–15%",
          topics: "Immediate vs deferred, taxation",
        },
        {
          name: "State Laws & Regulations",
          weight: "10–15%",
          topics: "Ethics, replacement, licensing",
        },
      ],
      footnote:
        "Selling variable life insurance or variable annuities requires additional FINRA licensing (Series 6 or 7, plus Series 63 in most states). Many successful life agents never pursue variable products, preferring to focus on safety, protection, and guarantees.",
    },
  },

  health: {
    meta: {
      title:
        "Health Insurance Exam Prep | Online Pre-Licensing Course | TestPrep4U",
      description:
        "Pass your health insurance licensing exam on the first try. State-approved pre-licensing course with AI-powered practice exams, study guides, and 24/7 support.",
    },
    headline: "Health Insurance Exam Prep",
    description:
      "Help people access the healthcare they deserve. Sell health insurance, Medicare plans, disability income or long-term care insurance to businesses or individuals.",
    cta: "Start My Health License",
    examTable: {
      title: "What's Covered on the Health Insurance Exam",
      sections: [
        {
          name: "Health Policy Types",
          weight: "20–25%",
          topics: "HMOs, PPOs, EPOs, Indemnity, long-term care, disability",
        },
        {
          name: "Disability & Income Protection",
          weight: "10–15%",
          topics: "Often underestimated by candidates",
        },
        {
          name: "Medical Plans & Cost Sharing",
          weight: "10–15%",
          topics: "Deductible, copay, coinsurance math",
        },
        {
          name: "Government Programs",
          weight: "15–20%",
          topics: "Medicare is heavily tested",
        },
        {
          name: "Supplemental Policies",
          weight: "5–10%",
          topics: "Accident, critical illness",
        },
        {
          name: "Policy Provisions",
          weight: "10–15%",
          topics: "Renewability and coordination of benefits",
        },
        {
          name: "State Laws & Regulations",
          weight: "10–15%",
          topics: "Privacy and unfair trade practices",
        },
      ],
    },
  },

  combined: {
    meta: {
      title:
        "Life & Health Insurance Exam Prep | Combined Course | TestPrep4U",
      description:
        "Pass your combined Life & Health insurance licensing exam on the first try. One exam, maximum flexibility. State-approved course with AI-powered practice exams.",
    },
    headline: "Life & Health Insurance Exam Prep",
    description:
      "Help individuals and businesses with life insurance, guaranteed income, health, disability, and long term care insurance.",
    cta: "Get Both Licenses",
    examTable: {
      title: "What's Covered on the Combined Life & Health Exam",
      sections: [
        {
          name: "Life Insurance Concepts",
          weight: "25–30%",
          topics: "All life policy types, provisions, taxation",
        },
        {
          name: "Health Insurance Concepts",
          weight: "25–30%",
          topics: "All health policy types and provisions",
        },
        {
          name: "Annuities & Retirement",
          weight: "10–15%",
          topics: "Fixed annuities, retirement concepts",
        },
        {
          name: "Disability & Income",
          weight: "5–10%",
          topics: "Short- and long-term disability",
        },
        {
          name: "Government Programs",
          weight: "10–15%",
          topics: "Medicare, Medicaid, Social Security basics",
        },
        {
          name: "State Laws & Ethics",
          weight: "15–20%",
          topics: "Licensing, replacement, unfair practices, privacy",
        },
      ],
      footnote:
        "Selling variable life insurance or variable annuities requires additional FINRA licensing (Series 6 or 7, plus Series 63 in most states). Many successful life agents never pursue variable products, preferring to focus on safety, protection, and guarantees.",
    },
  },
} as const;

// ========================== CONTACT PAGE ===================================

export const contactPage = {
  meta: {
    title: "Contact & Support | TestPrep4U",
    description:
      "Get in touch with TestPrep4U. 24/7 chat support for students, enrollment questions, and general inquiries.",
  },
  headline: "Contact Us",
  subheadline:
    "Have a question? Need help? We're here for you.",
  supportNote:
    "TestPrep4U students have exclusive access to 24/7 chat support. So you'll never have to break momentum waiting to have your question answered.",
  cta: "Chat With Us",
  // ⚑ CLIENT ACTION REQUIRED: Supply support contact information (email, chat platform, phone).
} as const;
