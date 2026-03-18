# CLAUDE.md — TestPrep4U

## Project Overview

TestPrep4U is an online insurance exam prep platform selling pre-licensing courses for Life, Health, and Life & Health Combined insurance licenses. The initial launch targets Florida only, with planned expansion to all 50 states, then continuing education and Property & Casualty courses.

This is a client project built and managed by The Digital Wash (Wyatt). The site is a Next.js application deployed on Vercel via GitHub auto-deploy under the `wyatt-thedigitalwash` GitHub org.

## Current Phase

**Phase 1 — Public Marketing Site**
Building the full public-facing marketing site from provided content docs. SEO-first, conversion-optimized. All copy has been provided by the client's content strategist (Jason Van Steenwyk). No auth, no dashboards, no SCORM integration yet.

### Phase 1 Pages

- `/` — Homepage (hero, stats strip, feature grid, steps overview, guarantee, FAQs preview)
- `/how-to-get-your-insurance-license` — Process page (6-step guide, sticky sidebar nav, metric strips)
- `/life-insurance-exam-prep` — Life course product page
- `/health-insurance-exam-prep` — Health course product page
- `/life-and-health-insurance-exam-prep` — Combined course product page
- `/states/florida` — Florida state page (dynamic route template for future 50-state expansion)
- `/faq` — FAQ page (accordion, JSON-LD schema, search bar)
- `/about` — About / Why TestPrep4U page
- `/contact` — Contact / Support page
- `/pricing` — Pricing page (3-tier comparison, course type toggle)

### Future Phases (do NOT build yet, but keep architecture compatible)

- **Phase 2**: Supabase auth, student dashboard, enrollment flow, Stripe checkout
- **Phase 3**: SCORM course hosting via Supabase Storage, iframe launcher, progress tracking
- **Phase 4**: Admin dashboard (student management, course uploads, analytics)
- **Phase 5**: Manager/affiliate portal (discount codes, referral tracking, manager dashboards)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 (CSS-based `@theme` configuration)
- **Fonts**: Plus Jakarta Sans (display/headlines), DM Sans (body/UI) — via `next/font/google`
- **Icons**: Lucide React
- **Forms/Email**: Resend (for contact form, email capture)
- **Deployment**: Vercel via GitHub auto-deploy
- **Future Auth**: Supabase (not yet implemented)
- **Future Payments**: Stripe (not yet implemented)
- **Future Storage**: Supabase Storage for SCORM packages (not yet implemented)

---

## Brand System

All theme values are configured via the `@theme` block in `src/app/globals.css` (Tailwind v4 convention — no `tailwind.config.ts`).

### Colors

```css
/* src/app/globals.css — inside @theme inline { } */

/* Primary */
--color-navy: #003152;

/* Blue Scale */
--color-blue-100: #d8e5fd;
--color-blue-200: #b5cdfd;
--color-blue-300: #93b1f7;
--color-blue-400: #6a9af7;
--color-blue-500: #4680eb;

/* CTA Accent */
--color-amber: #f59e0b;
--color-amber-hover: #d97706;

/* Neutrals (Slate scale) */
--color-gray-50: #f8fafc;
--color-gray-100: #f1f5f9;
--color-gray-200: #e2e8f0;
--color-gray-300: #cbd5e1;
--color-gray-400: #94a3b8;
--color-gray-500: #64748b;
--color-gray-600: #475569;
--color-gray-700: #334155;
--color-gray-800: #1e293b;
--color-gray-900: #0f172a;

/* Semantic */
--color-success: #10b981;
--color-success-light: #d1fae5;
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-info: #4680eb;
--color-info-light: #dbeafe;
```

### Color Usage Rules

- **Navy (#003152)**: Primary backgrounds — hero, nav, footer, section headers
- **White**: Page backgrounds, card backgrounds, text on dark surfaces
- **Blue 100–200**: Section backgrounds, card fills, alternating table rows, subtle highlights
- **Blue 300–500**: Links, active states, progress bars, interactive elements, secondary buttons
- **Amber (#F59E0B)**: Primary CTA buttons ONLY — never decorative. One primary CTA per section max.
- **Gray 700**: Default body text
- **Gray 500**: Secondary/supporting text
- **Gray 200**: Borders, dividers
- **Gray 50**: Subtle alternating backgrounds

### Typography

```css
/* src/app/globals.css — inside @theme inline { } */
--font-display: var(--font-jakarta), sans-serif;
--font-body: var(--font-dm), sans-serif;
```

**Font loading in layout.tsx:**

```tsx
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
});
```

### Type Scale

| Element       | Size            | Weight          | Font    | Usage                         |
| ------------- | --------------- | --------------- | ------- | ----------------------------- |
| H1 Hero       | 3rem (48px)     | ExtraBold (800) | Display | Hero headlines only           |
| H2 Page Title | 2.25rem (36px)  | Bold (700)      | Display | Section headers               |
| H3 Section    | 1.5rem (24px)   | Bold (700)      | Display | Card titles, subsections      |
| H4 Label      | 1.25rem (20px)  | SemiBold (600)  | Display | Feature titles, stat labels   |
| Body Large    | 1.125rem (18px) | Regular (400)   | Body    | Hero subtext, lead paragraphs |
| Body          | 1rem (16px)     | Regular (400)   | Body    | Default body copy             |
| Body Small    | 0.875rem (14px) | Regular (400)   | Body    | Captions, metadata            |
| Caption       | 0.75rem (12px)  | Medium (500)    | Body    | Labels, fine print            |

### Headlines

- Use `font-display` (Plus Jakarta Sans) for ALL headings (h1–h4)
- Letter spacing: `-0.02em` on headlines
- Line height: `1.1–1.2` on headlines

### Body Text

- Use `font-body` (DM Sans) for all body text, UI elements, navigation
- Line height: `1.6–1.7` for body paragraphs (long-form readability)
- Line height: `1.4` for UI text (buttons, labels, nav)

### Buttons

**Primary CTA:**

```
bg-amber hover:bg-amber-hover text-white font-bold
px-8 py-3.5 rounded-lg
shadow-[0_2px_8px_rgba(245,158,11,0.3)]
hover:shadow-[0_4px_12px_rgba(245,158,11,0.4)]
transition-all duration-200
```

**Secondary:**

```
border-2 border-blue-500 text-blue-500 font-bold
px-8 py-3.5 rounded-lg
hover:bg-blue-500 hover:text-white
transition-all duration-200
```

**Text Link:**

```
text-blue-500 font-semibold hover:text-navy hover:underline
```

### Cards

```
bg-white border border-gray-200 rounded-xl p-6
shadow-sm hover:shadow-md transition-shadow duration-200
```

- Icon container: `w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center`
- Equal height in grids: use `grid` with `items-stretch`

### Spacing

- Between major page sections: `py-16` (64px) desktop, `py-12` mobile
- Hero vertical padding: `py-24` (96px)
- Between content blocks within a section: `space-y-8` (32px)
- Card grid gaps: `gap-6` (24px)
- Max content width: `max-w-7xl mx-auto` (1280px)
- Side padding: `px-6` mobile, `px-10` tablet, `px-16` desktop

### Shadows

- `shadow-sm`: Default card resting state
- `shadow-md`: Elevated cards, dropdowns
- `shadow-lg`: Modals, hover-lift
- CTA glow: `shadow-[0_2px_8px_rgba(245,158,11,0.3)]`

---

## Project Structure

```
testprep4u-site/
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   ├── logo-white.png
│   │   └── hero/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── globals.css                   # Tailwind v4 @theme config + global styles
│   │   ├── layout.tsx                    # Root layout (fonts, nav, footer)
│   │   ├── page.tsx                      # Homepage
│   │   ├── how-to-get-your-insurance-license/
│   │   │   └── page.tsx                  # Process page
│   │   ├── life-insurance-exam-prep/
│   │   │   └── page.tsx
│   │   ├── health-insurance-exam-prep/
│   │   │   └── page.tsx
│   │   ├── life-and-health-insurance-exam-prep/
│   │   │   └── page.tsx
│   │   ├── states/
│   │   │   └── [state]/
│   │   │       └── page.tsx              # Dynamic state pages
│   │   ├── faq/
│   │   │   └── page.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   └── pricing/
│   │       └── page.tsx                  # 3-tier pricing comparison
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                # Sticky nav with CTA
│   │   │   └── Footer.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx                # Primary, Secondary, Text variants
│   │   │   ├── Card.tsx                  # Feature card component
│   │   │   ├── MetricStrip.tsx           # 3-col stat callout strip
│   │   │   ├── Accordion.tsx             # FAQ accordion
│   │   │   ├── StateSelector.tsx         # Map or dropdown for state selection
│   │   │   ├── PricingCards.tsx           # 3-tier pricing cards with course toggle
│   │   │   ├── ExamTable.tsx             # Exam section weights table
│   │   │   └── DonutChart.tsx            # Exam weight visualization
│   │   ├── sections/
│   │   │   ├── Hero.tsx                  # Homepage hero
│   │   │   ├── FeatureGrid.tsx           # 3x2 TestPrep4U Difference cards
│   │   │   ├── StepsOverview.tsx         # 3-step or 6-step roadmap
│   │   │   ├── Guarantee.tsx             # Pass guarantee section
│   │   │   ├── WhyNow.tsx               # Market opportunity section
│   │   │   ├── QuickFacts.tsx            # 3x2 metric grid
│   │   │   ├── CourseCards.tsx           # Life / Health / Combined cards
│   │   │   └── PricingSection.tsx       # Full pricing section with toggle + cards
│   │   └── seo/
│   │       └── JsonLd.tsx                # JSON-LD structured data (FAQ, Course)
│   ├── lib/
│   │   ├── constants.ts                  # Site-wide constants (stats, URLs)
│   │   ├── pricing.ts                    # Pricing tiers, features, per-course prices
│   │   └── states.ts                     # State data (name, slug, hours, requirements)
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── CLAUDE.md
```

---

## SEO Requirements

This is an SEO-first site. Every page must be built with search visibility as a primary concern.

### Every Page Must Have

- Unique `<title>` and `<meta name="description">` via Next.js `Metadata` export
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`) via `Metadata` export
- Canonical URL
- Semantic HTML (proper heading hierarchy — one `h1` per page, logical `h2`/`h3` nesting)
- Internal links to related pages

### Structured Data (JSON-LD)

- **FAQ pages**: `FAQPage` schema on `/faq` and any page with inline FAQs
- **Course pages**: `Course` schema on each product page
- **Organization**: `Organization` schema in root layout
- **BreadcrumbList**: On all interior pages

### State Pages

- Dynamic route: `/states/[state]`
- Each state page must have unique title, description, and content
- Template: `[State] Insurance License Exam Prep | TestPrep4U`
- Data source: `src/lib/states.ts` — object keyed by state slug with name, abbreviation, required hours, passing score, exam details, testing provider info
- Phase 1 launches with Florida only; template must work for all 50 states when content is added

### Sitemap

- Generate via `next-sitemap` or Next.js native sitemap
- Include all static pages and the Florida state page
- Update dynamically as state pages are added

### Performance

- Target 90+ Lighthouse scores across all categories
- Use `next/image` for all images with proper `width`, `height`, `alt`
- Lazy load below-fold sections
- Minimize client-side JavaScript — prefer Server Components

---

## Component Patterns

### MetricStrip

Reusable 3-column stat display used on homepage, process page, courses page, and quick facts.

```tsx
<MetricStrip
  items={[
    {
      value: "57.9%",
      label: "National First-Time Pass Rate",
      source: "NAIC 2020",
      tone: "warning",
    },
    { value: "TBD%", label: "TestPrep4U Pass Rate", tone: "success" },
    { value: "80%+", label: "Target Practice Score", tone: "brand" },
  ]}
/>
```

- `tone` controls accent color: `warning` = amber border, `success` = green, `brand` = blue-500
- High-contrast background (navy or gray-900)
- Large number, bold label, optional source/context line

### Accordion (FAQ)

- All content rendered in HTML source (not hidden behind JS for SEO)
- `details`/`summary` native HTML elements with progressive enhancement
- Smooth open/close animation via CSS `grid-template-rows` trick
- JSON-LD `FAQPage` schema generated from same data source

### Button

Three variants via a single component:

```tsx
<Button variant="primary">Start Learning Now</Button>    // Amber CTA
<Button variant="secondary">See the Full Roadmap</Button> // Blue outline
<Button variant="text" href="/faq">See All FAQs →</Button> // Text link
```

### PricingCards

3-column tier comparison used on `/pricing` and embedded (pre-filtered) on each course product page.

- **Layout**: 3-column grid, Pro card visually elevated
- **Pro card (highlighted)**: `bg-navy text-white scale-105 shadow-lg`, "Recommended" badge (amber), amber CTA button
- **Essentials & Premium cards**: White bg, standard card style (`border border-gray-200 shadow-sm`), secondary CTA buttons
- **Course type toggle** above cards: `Life | Health | Life & Health Combined` — updates prices client-side without page reload (`'use client'`)
- Features not included in a tier shown grayed out with `X` icon (Lucide `X` in `text-gray-300`)
- Each card shows: tier name, tagline, price, access duration, feature checklist, CTA button
- On course product pages, pass `courseType` prop to pre-select the toggle and optionally hide it
- Below the cards: "Enrolling a team?" callout strip linking to `/contact` (placeholder for future group/manager pricing in Phase 5)

```tsx
<PricingCards courseType="life" showToggle={true} />
```

### StateSelector

- Dropdown (Phase 1) with option to upgrade to interactive map later
- Links to `/states/[state]`
- Only Florida is active in Phase 1; other states show "Coming Soon"

---

## Content Data

### Key Stats (used across multiple pages)

```ts
export const STATS = {
  nationalPassRate: "57.9%",
  nationalPassRateSource: "NAIC 2020",
  tp4uPassRate: "TBD", // CLIENT ACTION REQUIRED
  targetPracticeScore: "80%+",
  preLicensingHoursLife: "~40",
  preLicensingHoursHealth: "~40",
  preLicensingHoursCombined: "~60",
  examQuestions: "100–150",
  passingScore: "70%",
  examDuration: "2–3 hours",
  examFeeRange: "$40–$150",
  fingerprintFeeRange: "$23–$90",
};
```

---

## Pricing & Packages

### Competitive Context

Industry standard is a 3-tier model. ExamFX starts ~$170, Kaplan ~$120. TestPrep4U targets the mid-premium range — same core course content across all tiers, differentiated by study tools, practice exam access, and support level.

### Tiers

**Essentials (~$149–169)** — Get licensed.

- Pre-licensing course content (state-approved)
- Chapter quizzes
- 3 full practice exams
- Progress tracking dashboard
- Completion certificate
- 24/7 chat support
- 6-month access

**Pro (~$219–259, highlighted/recommended)** — Pass the first time.

- Everything in Essentials
- Unlimited practice exam retakes
- AI-adaptive review (targets weak areas)
- Downloadable study guides (PDF)
- Digital flashcard decks
- Exam readiness predictor
- First-time pass guarantee
- 9-month access

**Premium (~$319–369)** — The full advantage.

- Everything in Pro
- Video instruction modules
- Priority support (email + phone)
- Printed study guide shipped to door
- Live review sessions (coming soon at launch)
- 12-month access

### Pricing by Course Type

Prices vary by course. Life and Health are the same price; Combined is ~$30–40 more.

All prices below are **CLIENT ACTION REQUIRED — confirm exact amounts before build.**

| Tier       | Life     | Health   | Combined  |
| ---------- | -------- | -------- | --------- |
| Essentials | $TBD     | $TBD     | $TBD      |
| Pro        | $TBD     | $TBD     | $TBD      |
| Premium    | $TBD     | $TBD     | $TBD      |

### Data Structure (`src/lib/pricing.ts`)

```ts
interface PricingTier {
  slug: "essentials" | "pro" | "premium";
  name: string;
  tagline: string;
  highlighted: boolean;
  features: {
    label: string;
    included: boolean;
  }[];
  accessMonths: number;
  hasGuarantee: boolean;
  prices: {
    life: number;     // CLIENT ACTION REQUIRED
    health: number;   // CLIENT ACTION REQUIRED
    combined: number; // CLIENT ACTION REQUIRED
  };
}

export const PRICING_TIERS: PricingTier[] = [
  {
    slug: "essentials",
    name: "Essentials",
    tagline: "Get licensed.",
    highlighted: false,
    accessMonths: 6,
    hasGuarantee: false,
    prices: { life: 0, health: 0, combined: 0 }, // TBD
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
      { label: "Live review sessions", included: false },
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    tagline: "Pass the first time.",
    highlighted: true,
    accessMonths: 9,
    hasGuarantee: true,
    prices: { life: 0, health: 0, combined: 0 }, // TBD
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
      { label: "Live review sessions", included: false },
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    tagline: "The full advantage.",
    highlighted: false,
    accessMonths: 12,
    hasGuarantee: true,
    prices: { life: 0, health: 0, combined: 0 }, // TBD
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
      { label: "Live review sessions", included: true },
    ],
  },
];
```

### Notes

- Each course product page (`/life-insurance-exam-prep`, etc.) should embed `<PricingCards courseType="life" />` pre-filtered to that course type
- Group/manager pricing is a Phase 5 feature. For now, show an "Enrolling a team?" callout below the pricing cards that links to `/contact`
- "Live review sessions" should display a "Coming Soon" badge in the feature list at launch
- Pricing page needs `Product` JSON-LD structured data for each tier

### Client Action Items (must be resolved before launch)

1. Insert verified TestPrep4U first-attempt pass rate (used in metric strips site-wide)
2. Finalize pass guarantee terms with legal
3. Finalize hero image
4. Replace all "Click here" button text with descriptive text
5. Confirm "Who is TestPrep4U for? U!" FAQ answer — intentional or placeholder?
6. Supply support contact information (email, chat platform, phone)
7. Confirm pricing tiers and exact prices for all 3 tiers x 3 course types
8. Confirm which Pro/Premium features exist at launch vs. are planned for later phases

---

## Conventions

### Code Style

- Functional components only, no class components
- Named exports for components, default export for pages
- Props interfaces defined above each component
- Tailwind classes directly on elements — no CSS modules, no styled-components
- Group Tailwind classes logically: layout → spacing → sizing → typography → colors → effects

### File Naming

- Components: PascalCase (`FeatureGrid.tsx`)
- Pages: `page.tsx` inside route directory (Next.js App Router convention)
- Utilities/data: camelCase (`states.ts`, `constants.ts`)

### Git

- Commit messages: short imperative (`Add homepage hero section`, `Wire up FAQ accordion`)
- Push to main after each working increment
- Vercel auto-deploys from main

---

## Important Notes

- **Do NOT build auth, dashboards, or SCORM integration in Phase 1.** The architecture should be compatible but no auth code, no Supabase client, no protected routes yet.
- **All copy comes from the client's content docs.** Do not rewrite or improvise marketing copy. Use the exact text provided by Jason Van Steenwyk. Annotations marked with ⚑ are client action items — use placeholder text where needed.
- **The amber CTA color is reserved for primary action buttons only.** Do not use amber for decorative elements, icons, borders, or secondary actions.
- **Server Components by default.** Only add `'use client'` when a component genuinely needs interactivity (accordion, mobile nav toggle, state selector dropdown). Keep the JS bundle minimal.
- **Images are TBD.** Use proper `next/image` components with placeholder dimensions so images can be swapped in without layout shift.
