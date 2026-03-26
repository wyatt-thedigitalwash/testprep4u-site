# CLAUDE.md — TestPrep4U

## Project Overview

TestPrep4U is an online insurance exam prep platform selling pre-licensing courses for Life, Health, and Life & Health Combined insurance licenses. The initial launch targets Florida only, with planned expansion to all 50 states, then continuing education and Property & Casualty courses.

This is a client project built and managed by The Digital Wash (Wyatt). The site is a Next.js application deployed on Vercel via GitHub auto-deploy under the `wyatt-thedigitalwash` GitHub org.

## Current Phase

**Phase 1 — Public Marketing Site** (COMPLETE)
Full public-facing marketing site built from provided content docs. SEO-first, conversion-optimized. All copy provided by the client's content strategist (Jason Van Steenwyk).

**Phase 2 — Demo Dashboard** (ACTIVE)
Building a prototype student dashboard with fake auth and mock data. Demonstrates the student experience (course progress, practice exams, SCORM viewer) without real backend infrastructure. Architecture mirrors production structure for easy swap to Supabase/Stripe later.

### Phase 1 Pages

- `/` — Homepage (hero + metric strip, feature grid, steps overview, guarantee, quick facts, FAQ preview, bottom CTA)
- `/how-to-get-your-insurance-license` — Process page (6-step guide, sticky sidebar nav, metric strips)
- `/life-insurance-exam-prep` — Life course product page
- `/health-insurance-exam-prep` — Health course product page
- `/life-and-health-insurance-exam-prep` — Combined course product page
- `/states/florida` — Florida state page (dynamic route template for future 50-state expansion)
- `/faq` — FAQ page (accordion, JSON-LD schema, search bar)
- `/about` — About / Why TestPrep4U page
- `/contact` — Contact / Support page
- `/pricing` — Pricing page (3-tier comparison, course type toggle)

### Phase 2 — Demo Dashboard

A prototype/demo of the student experience using fake auth and mock data. No Supabase, no Stripe, no real backend. The architecture should mirror the real production structure so swapping to real auth and data later is straightforward — same component structure, same routes, just different data sources.

#### Demo Auth

- **Login page** at `/login` with hardcoded credentials: `demo@testprep4u.com` / `demo123`
- Auth state stored in a cookie or localStorage — no real auth provider
- Protected routes under `/dashboard/*` redirect to `/login` if not authenticated
- Logout button clears auth state and redirects to homepage
- When logged in, the marketing site navbar CTA changes to "Dashboard" linking to `/dashboard`

#### Demo Pages

- `/login` — Login page (email + password form, hardcoded credentials)
- `/dashboard` — Student dashboard home
  - Welcome message: "Welcome back, Alex"
  - Enrolled courses with progress:
    - Florida Life Insurance (65% complete, 5 of 8 chapters done)
    - Florida Health Insurance (just enrolled, 0% complete)
  - Each course card: course name, progress bar, chapters completed, last activity date, "Continue" button
  - Quick stats: study hours (24hrs), practice exam average (76%), courses enrolled (2)
  - Upcoming milestone: "Score 80%+ on 3 practice exams to qualify for the Pass Guarantee"
- `/dashboard/courses/[courseId]` — Course detail page
  - Chapter list with completion status (completed ✓, in progress, locked)
  - Each chapter: number, title, estimated time, status
  - "Launch Course" button → loads SCORM content in iframe (or placeholder)
  - Practice exam section: available exams with previous attempt scores
  - Progress sidebar/header showing overall course completion %
- `/dashboard/courses/[courseId]/exams` — Practice exam results
  - Mock exam history: 3 attempts with scores (68%, 72%, 76%)
  - Score trend visualization (simple bar or line chart)
  - Breakdown by topic area (strong/weak areas)
  - Readiness indicator: "You're getting close — aim for 80%+ on your next attempt"
- `/dashboard/settings` — Profile & settings
  - Student info (name, email, state: Florida)
  - Enrolled plan: Pro (9-month access, features included)
  - Access expiration date
  - Support link

#### Dashboard Layout

Dashboard pages use a **separate layout** from the marketing site:
- **Sidebar navigation** (left): Dashboard, My Courses, Practice Exams, Settings, Logout
- **Top bar**: student name + avatar placeholder
- Marketing navbar and footer are **NOT** shown on dashboard pages

#### Mock Data (`src/lib/mock-data.ts`)

All demo student data, course progress, exam scores, and chapter lists live in a single mock data file. All dashboard components pull from this file. Designed for easy swap to real Supabase queries later.

#### SCORM Demo

- Download a free test SCORM package from scorm.com (Golf Examples SCORM 2004 Basic Runtime package)
- Place unzipped files in `public/scorm/demo-course/`
- "Launch Course" button loads SCORM content in an iframe pointing to the entry HTML file
- Proof of concept only — no SCORM runtime API tracking yet, just showing content loads inside the platform

#### Project Structure (Phase 2 additions)

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx                    # Demo login page
│   ├── dashboard/
│   │   ├── layout.tsx                  # Dashboard layout (sidebar, top bar, no marketing nav/footer)
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── courses/
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx            # Course detail (chapters, launch, progress)
│   │   │       └── exams/
│   │   │           └── page.tsx        # Practice exam results
│   │   └── settings/
│   │       └── page.tsx                # Profile & settings
│   └── ...
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.tsx                 # Dashboard sidebar navigation
│   │   ├── TopBar.tsx                  # Top bar with student name/avatar
│   │   ├── CourseCard.tsx              # Enrolled course card with progress bar
│   │   ├── StatsGrid.tsx              # Quick stats (study hours, avg score, etc.)
│   │   ├── ChapterList.tsx            # Chapter list with completion status
│   │   ├── ExamHistory.tsx            # Exam attempts list with scores
│   │   ├── ScoreTrend.tsx             # Score trend visualization
│   │   ├── TopicBreakdown.tsx         # Strong/weak area breakdown
│   │   ├── ScormViewer.tsx            # SCORM iframe wrapper
│   │   └── ProgressRing.tsx           # Circular progress indicator
│   └── ...
├── lib/
│   ├── mock-data.ts                    # All demo student/course/exam data
│   ├── auth.ts                         # Demo auth helpers (login, logout, check)
│   └── ...
public/
├── scorm/
│   └── demo-course/                    # Unzipped SCORM package files
└── ...
```

### Phase 3 — Production Build

Replaces the demo dashboard with real infrastructure. Supabase for auth, database, and storage. Stripe for payments. Real SCORM runtime tracking with Florida DFS compliance. Native quiz/exam engine. Auto-generated completion certificates with self-study affidavit and 3-year record retention.

#### FL Life Insurance Course Structure (30-hour program)

The course is organized into 6 course sections, each containing multiple SCORM modules (chapters). Part quizzes are SCORM-based and serve as progression gates. Practice Exam and Final Exam are **NOT SCORM** — they are built natively in the platform.

```
FL Life Insurance (30 hours, 24 SCORM modules)
├── Section 0: Course Introduction
│   └── Course Introduction                                    (SCORM module)
├── Section 1: General Insurance Concepts
│   ├── Ch 1: Purpose of Life Insurance                        (SCORM module)
│   ├── Ch 2: The Insurance Industry                           (SCORM module)
│   ├── Ch 3: Law and the Insurance Contract                   (SCORM module)
│   ├── Ch 4: Licensure Ethics and the Insurance Producer      (SCORM module)
│   └── Part 1 Quiz                                            (SCORM module — 70% gate)
├── Section 2: Life Insurance Products
│   ├── Ch 1: Life Insurance Policies                          (SCORM module)
│   ├── Ch 2: Policy Provisions Options and Riders             (SCORM module)
│   ├── Ch 3: Life Insurance Beneficiaries                     (SCORM module)
│   ├── Ch 4: Life Insurance Premiums and Proceeds             (SCORM module)
│   ├── Ch 5: Life Insurance Underwriting and Policy Issue     (SCORM module)
│   ├── Ch 6: Group Life Insurance                             (SCORM module)
│   ├── Ch 7: Annuities                                        (SCORM module)
│   └── Part 2 Quiz                                            (SCORM module — 70% gate)
├── Section 3: Social Security & Retirement
│   ├── Ch 1: Social Security                                  (SCORM module)
│   ├── Ch 2: Retirement Plans                                 (SCORM module)
│   ├── Ch 3: Uses of Life Insurance                           (SCORM module)
│   └── Part 3 Quiz                                            (SCORM module — 70% gate)
├── Section 4: Florida Laws & Rules
│   ├── Ch 1: FL Laws — Regulatory Foundations                 (SCORM module)
│   ├── Ch 2: Florida Replacement Rule                         (SCORM module)
│   ├── Ch 3: FL Laws — Variable Contracts                     (SCORM module)
│   └── Part 4 Quiz                                            (SCORM module — 70% gate)
├── Section 5: Exam Preparation
│   ├── Preparing for the Course Exam                          (SCORM module)
│   └── Preparing for the Florida State Exam                   (SCORM module)
├── Practice Exam                                              (NATIVE — quiz engine, unlimited retakes)
└── Final Exam (Course Exam)                                   (NATIVE — quiz engine, 70% to pass)
```

**Progression rules:**
1. Modules within a section are sequential — must complete module N before accessing N+1
2. Part quizzes require 70% to pass (unlimited retakes allowed)
3. All sections (0–5) must be completed before Practice Exam unlocks
4. Final Exam requires 70% to pass (unlimited retakes)
5. Completion requires: all SCORM modules done + Final Exam passed + 30 hours logged

**File organization on disk** (`docs/scorm/fl-life/`):
```
fl-life/
├── part0/Course Introduction/              → SCORM 2004 package
├── part1/
│   ├── Chapter 1 Purpose of Life Insurance/
│   ├── Chapter 2 The Insurance Industry/
│   ├── Chapter 3 Law and the Insurance Contract/
│   ├── Chapter 4 Licensure Ethics and the Insurance Producer/
│   └── Part 1 Quiz/
├── part2/
│   ├── Chapter 1 Life Insurance Policies/
│   ├── ... (7 chapters)
│   └── Part 2 Quiz/
├── part3/
│   ├── Chapter 1 Social Security/
│   ├── Chapter 2 Retirement Plans/
│   ├── Chapter 3 Uses of Life Insurance/
│   └── Part 3 Quiz/
├── part4/
│   ├── Chapter 1 FL Laws — Regulatory Foundations/
│   ├── Chapter 2 Florida Replacement Rule/
│   ├── Chapter 3 FL Laws — Variable Contracts/
│   └── Part 4 Quiz/
├── course-exam-prep/Preparing for the Course Exam/
└── state-exam-readiness/Preparing for the Florida State Exam/
```

Each folder is a standalone SCORM 2004 3rd Edition package (Articulate Rise export) with its own `imsmanifest.xml`, `scormdriver/`, and `scormcontent/`.

#### Database Schema (Supabase / PostgreSQL)

All tables use Row Level Security (RLS). Users can only read/write their own data. Service role key used in API routes and webhooks for admin-level operations.

**profiles**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, references `auth.users(id)` on delete cascade |
| full_name | text | |
| state | text | e.g. "FL" |
| phone | text | nullable |
| plan_tier | text | "essentials" / "pro" / "premium" |
| stripe_customer_id | text | nullable, set on first checkout |
| created_at | timestamptz | default `now()` |

**courses**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| slug | text | unique, e.g. "fl-life" |
| name | text | e.g. "Florida Life Insurance" |
| type | text | "life" / "health" / "combined" |
| state | text | e.g. "FL" |
| required_hours | numeric | state-mandated minimum (30 for FL Life) |
| active | boolean | default `true` |
| created_at | timestamptz | default `now()` |

**course_sections**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| course_id | uuid | references `courses(id)` on delete cascade |
| section_number | integer | 0-indexed (0 = Course Introduction, 1–4 = Parts 1–4, 5 = Exam Prep) |
| title | text | e.g. "General Insurance Concepts" |
| sort_order | integer | display order |
| | | unique constraint on `(course_id, section_number)` |

**course_modules**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| section_id | uuid | references `course_sections(id)` on delete cascade |
| module_type | text | "lesson" / "quiz" |
| title | text | e.g. "Chapter 1: Purpose of Life Insurance" |
| scorm_entry_path | text | path in Supabase Storage, e.g. "scorm/fl-life/part1/ch1/scormdriver/indexAPI.html" |
| sort_order | integer | sequential within section |
| quiz_pass_score | numeric | nullable, 70 for part quizzes, null for lessons |
| | | unique constraint on `(section_id, sort_order)` |

**enrollments**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| user_id | uuid | references `profiles(id)` on delete cascade |
| course_id | uuid | references `courses(id)` |
| status | text | "active" / "completed" / "expired" |
| enrolled_at | timestamptz | default `now()` |
| expires_at | timestamptz | based on plan tier (6/9/12 months) |
| completed_at | timestamptz | nullable, set on course completion |
| affidavit_accepted_at | timestamptz | nullable, when student signed self-study affidavit |
| affidavit_ip | text | nullable, IP address at time of signing |
| affidavit_user_agent | text | nullable, browser user-agent at time of signing |
| affidavit_typed_name | text | nullable, name typed by student to sign |
| stripe_session_id | text | nullable, Stripe Checkout session ID for idempotency (unique where not null) |

**module_progress**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| enrollment_id | uuid | references `enrollments(id)` on delete cascade |
| module_id | uuid | references `course_modules(id)` |
| status | text | "not_started" / "in_progress" / "completed" |
| cmi_data | jsonb | SCORM 2004 CMI data for this module |
| completion_status | text | "not attempted" / "incomplete" / "completed" |
| success_status | text | "unknown" / "passed" / "failed" |
| score | numeric | nullable, 0–100 (quiz score) |
| time_spent_seconds | integer | default `0` |
| last_accessed | timestamptz | |
| bookmark | text | nullable, SCORM bookmark/location |
| completed_at | timestamptz | nullable |
| | | unique constraint on `(enrollment_id, module_id)` |

**exam_attempts**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| enrollment_id | uuid | references `enrollments(id)` on delete cascade |
| exam_type | text | "practice" / "final" |
| score | numeric | 0–100 |
| total_questions | integer | |
| correct_answers | integer | |
| passed | boolean | score >= 70 for final |
| time_spent_seconds | integer | |
| answers | jsonb | `[{ question_id, selected, correct, topic }]` — for topic breakdown |
| attempted_at | timestamptz | default `now()` |

**time_logs**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| enrollment_id | uuid | references `enrollments(id)` on delete cascade |
| module_id | uuid | nullable, references `course_modules(id)` — null for exam time |
| started_at | timestamptz | |
| ended_at | timestamptz | |
| duration_seconds | integer | computed `ended_at - started_at`, capped at server |
| source | text | "scorm" / "practice_exam" / "final_exam" |

Audit-grade time log for Florida DFS compliance. Each row is a discrete session. `module_progress.time_spent_seconds` is the aggregated total per module. `time_logs` is the immutable audit trail. Records retained for 3 years minimum per Florida DFS requirements.

**certificates**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| enrollment_id | uuid | references `enrollments(id)` on delete cascade, unique |
| certificate_number | text | unique, generated (e.g. "TP4U-FL-LIFE-20260401-XXXX") |
| issued_at | timestamptz | default `now()` |
| hours_completed | numeric | total tracked hours at time of issuance |
| pdf_url | text | path in Supabase Storage |

**question_bank**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| course_id | uuid | references `courses(id)` on delete cascade |
| topic | text | e.g. "Life Insurance Policies", "Annuities", "FL Laws" |
| question_text | text | |
| options | jsonb | `["Option A", "Option B", "Option C", "Option D"]` |
| correct_index | integer | 0-based index into options array |
| explanation | text | shown after answering |
| exam_type | text | "practice" / "final" / "both" — which exams can draw this question |

#### Auth

- **Provider**: Supabase Auth with email/password sign-up
- **Email verification**: Required before first login; verification email sent via Resend
- **Password reset**: Supabase auth flow, reset email sent via Resend
- **Profile creation**: Database trigger on `auth.users` insert creates a `profiles` row
- **Session handling**: Supabase client-side auth with `@supabase/ssr` for cookie-based sessions in Next.js middleware
- **Protected routes**: Middleware checks session for `/dashboard/*` routes, redirects to `/login` if unauthenticated

#### Payments

- **Provider**: Stripe Checkout Sessions
- **Flow**: User selects a course + tier → redirected to Stripe Checkout → on success, redirected back to `/dashboard`
- **Webhook**: `POST /api/webhooks/stripe` listens for `checkout.session.completed`
  - Creates `enrollments` row with correct `expires_at` based on plan tier
  - Sets `stripe_customer_id` on `profiles` if not already set
  - Idempotent — checks for existing enrollment before creating
- **Products**: One Stripe Product per course × tier combination (9 total at launch)
- **Customer portal**: Link in settings page for subscription management (future recurring billing)

#### SCORM

- **Storage**: SCORM packages stored in Supabase Storage bucket (`scorm-packages`), one folder per module organized as `{course-slug}/{part}/{module-folder}/`
- **Delivery**: Signed URL generated per session, loaded in iframe via `ScormViewer` component
- **Runtime API**: SCORM 2004 API adapter in the iframe communicates with parent via `postMessage`
  - `POST /api/scorm/progress` — persists `cmi_data`, `completion_status`, `success_status`, `score`, `bookmark` to `module_progress`
  - `POST /api/scorm/time` — creates a `time_logs` row and increments `module_progress.time_spent_seconds`
- **Each SCORM module** is a standalone Articulate Rise package (SCORM 2004 3rd Edition) with its own `imsmanifest.xml`
- **Part quizzes** are SCORM modules that report scores via the SCORM API. The platform checks `score >= quiz_pass_score` (70%) to gate progression to the next section

#### Quiz & Exam Engine (Native)

Practice Exam and Final Exam are **NOT delivered via SCORM**. They are built natively in the platform using the `question_bank` table.

- **Question bank**: Imported per course, tagged by topic and exam type
- **Practice Exam**: Draws questions from the bank (tagged "practice" or "both"), unlimited retakes, shows explanations after each question, score breakdown by topic. Available after all SCORM sections complete
- **Final Exam (Course Exam)**: Draws questions from the bank (tagged "final" or "both"), 70% passing score, unlimited retakes, timed. Must pass to complete the course
- **Exam attempts** logged in `exam_attempts` with full answer data for topic breakdown analysis
- **Time tracking**: Exam time logged to `time_logs` with `source = "practice_exam"` or `"final_exam"`

#### Progression Logic

Sequential progression through the entire course:

1. **Within a section**: Modules unlock one at a time. Must complete module N (SCORM `completion_status = "completed"`) before module N+1 becomes available
2. **Part quizzes as gates**: Each part's quiz is the last module in its section. Must score ≥ 70% (`module_progress.score >= course_modules.quiz_pass_score`) to unlock the next section. Unlimited retakes allowed
3. **Section-to-section**: Must complete all modules in section N (including passing the part quiz) before section N+1 unlocks
4. **Practice Exam**: Unlocks after all SCORM sections (0–5) are complete. Not required but recommended
5. **Final Exam**: Unlocks after all SCORM sections (0–5) are complete. Must pass with ≥ 70%
6. **Course completion** requires ALL of:
   - All SCORM modules have `status = "completed"` in `module_progress`
   - All part quizzes passed (score ≥ 70%)
   - Final Exam passed (score ≥ 70% in `exam_attempts`)
   - Total tracked time ≥ `courses.required_hours` (30 hours for FL Life), calculated as `sum(time_logs.duration_seconds)` for the enrollment
   - Self-study affidavit accepted (`enrollments.affidavit_accepted_at` is not null)

#### Time Tracking (Florida DFS Compliance)

Florida Department of Financial Services requires students to complete the mandated hours. Time tracking must be audit-grade:

- **Granular logging**: Every study session creates a `time_logs` row with `started_at`, `ended_at`, `duration_seconds`, and `source`
- **Server-side validation**: Max session duration capped at reasonable limits (e.g., 4 hours) to prevent clock manipulation. Idle detection on the client sends heartbeats; if no heartbeat received for > 5 minutes, the session is ended server-side
- **Aggregation**: `module_progress.time_spent_seconds` is the running total per module. Total course hours = `sum(time_logs.duration_seconds) / 3600` across the enrollment
- **Minimum hours check**: Course completion is blocked until total hours ≥ `courses.required_hours`
- **3-year record retention**: `time_logs`, `exam_attempts`, `certificates`, and `enrollments` rows are never deleted. Soft-delete only. A scheduled job or Supabase Edge Function can archive records older than 3 years but must not destroy them

#### Self-Study Affidavit

Before receiving the completion certificate, the student must accept a self-study affidavit:

- Presented as a modal/page after all completion criteria are met (all modules done, final exam passed, hours logged)
- Text: Attestation that the student personally completed all coursework (exact legal text TBD — client action required)
- Student checks a box and submits → `enrollments.affidavit_accepted_at` is set
- Only after acceptance does the certificate generate

#### Certificates

- **Trigger**: Auto-generated when all completion criteria are satisfied (modules + final exam + hours + affidavit)
- **PDF generation**: Server-side using a PDF library (e.g. `@react-pdf/renderer` or `pdf-lib`)
- **Contents**: Student name, course name, state, hours completed, completion date, certificate number
- **Storage**: PDF uploaded to Supabase Storage bucket (`certificates`), URL saved to `certificates.pdf_url`
- **Access**: Download link on course detail page and settings page
- **Retention**: Certificate records retained for 3 years minimum per Florida DFS requirements

#### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scorm/progress` | POST | Persist SCORM CMI data, completion/success status, score, bookmark to `module_progress` |
| `/api/scorm/time` | POST | Create `time_logs` row, increment `module_progress.time_spent_seconds` |
| `/api/exams/start` | POST | Generate an exam instance (draw questions from bank), return questions |
| `/api/exams/submit` | POST | Score the exam, create `exam_attempts` row, log time |
| `/api/exams/[attemptId]` | GET | Retrieve a past exam attempt with answers and explanations |
| `/api/enrollments` | GET | List current user's enrollments with course/section/module progress |
| `/api/enrollments/[id]/progress` | GET | Full progression state for an enrollment (all modules, exams, time) |
| `/api/enrollments/[id]/affidavit` | POST | Accept self-study affidavit, trigger certificate generation |
| `/api/certificates` | GET | List/download current user's certificates |
| `/api/checkout` | POST | Create Stripe Checkout Session for a course + tier |
| `/api/webhooks/stripe` | POST | Handle `checkout.session.completed`, create enrollment |

All API routes (except the Stripe webhook) require authenticated Supabase session. The Stripe webhook verifies the `stripe-signature` header using `STRIPE_WEBHOOK_SECRET`.

#### Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=
```

All values set in Vercel environment settings. `NEXT_PUBLIC_` vars are exposed to the browser. `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `RESEND_API_KEY` are server-only.

#### Project Structure (Phase 3 additions)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              # Supabase auth (already built)
│   │   ├── signup/page.tsx             # Registration (already built)
│   │   ├── forgot-password/page.tsx    # Password reset request (already built)
│   │   └── reset-password/page.tsx     # New password form (already built)
│   ├── auth/callback/route.ts          # Supabase email confirm + reset redirect (already built)
│   ├── dashboard/
│   │   ├── courses/[courseId]/
│   │   │   ├── modules/[moduleId]/
│   │   │   │   └── page.tsx            # SCORM viewer for a specific module
│   │   │   ├── exams/
│   │   │   │   ├── practice/page.tsx   # Practice exam (native quiz engine)
│   │   │   │   └── final/page.tsx      # Final exam (native quiz engine)
│   │   │   └── affidavit/page.tsx      # Self-study affidavit acceptance
│   │   └── ...
│   └── api/
│       ├── scorm/
│       │   ├── progress/route.ts       # SCORM CMI data → module_progress
│       │   └── time/route.ts           # Time tracking → time_logs + module_progress
│       ├── exams/
│       │   ├── start/route.ts          # Draw questions, return exam instance
│       │   ├── submit/route.ts         # Score exam, create exam_attempts row
│       │   └── [attemptId]/route.ts    # Retrieve past attempt
│       ├── enrollments/
│       │   ├── route.ts                # List enrollments
│       │   └── [id]/
│       │       ├── progress/route.ts   # Full progression state
│       │       └── affidavit/route.ts  # Accept affidavit, trigger cert
│       ├── certificates/route.ts       # List/download certificates
│       ├── checkout/route.ts           # Stripe Checkout Session (already built)
│       └── webhooks/
│           └── stripe/route.ts         # Stripe webhook (already built)
├── components/
│   └── dashboard/
│       ├── ScormViewer.tsx             # SCORM iframe wrapper with postMessage bridge
│       ├── ExamRunner.tsx              # Native quiz engine component
│       ├── ProgressTimeline.tsx        # Section/module progression visualization
│       └── AffidavitModal.tsx          # Self-study affidavit acceptance UI
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client (already built)
│   │   └── server.ts                   # Server + admin Supabase clients (already built)
│   ├── stripe.ts                       # Stripe client + price ID map (already built)
│   ├── supabase-auth.ts               # Auth helpers (already built)
│   ├── certificates.ts                 # PDF generation + upload logic
│   ├── scorm-api.ts                    # SCORM 2004 runtime adapter (postMessage bridge)
│   ├── exam-engine.ts                  # Question selection, scoring, topic breakdown
│   └── progression.ts                  # Module unlock logic, completion checks, time validation
├── middleware.ts                        # Auth session check (already built)
└── ...
supabase/
├── migrations/
│   ├── 001_initial_schema.sql          # All tables, RLS policies, triggers
│   └── 002_course_structure.sql        # course_sections, course_modules, question_bank tables
└── seed.sql                            # FL Life course sections, modules, question bank
```

### Future Phases (do NOT build yet, but keep architecture compatible)

- **Phase 4**: Admin dashboard (student management, course uploads, analytics)
- **Phase 5**: Manager/affiliate portal (discount codes, referral tracking, manager dashboards)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 (CSS-based `@theme` configuration)
- **Fonts**: Plus Jakarta Sans (display/headlines), DM Sans (body/UI) — via `next/font/google`
- **Icons**: Lucide React
- **Forms/Email**: Resend (for contact form, email capture, auth emails)
- **Auth**: Supabase Auth (email/password) with `@supabase/ssr`
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage (SCORM packages, certificates)
- **Payments**: Stripe (Checkout Sessions, webhooks)
- **Deployment**: Vercel via GitHub auto-deploy

---

## Brand System

All theme values are configured via the `@theme inline` block in `src/app/globals.css` (Tailwind v4 convention — no `tailwind.config.ts`).

### Colors

```css
/* src/app/globals.css — inside @theme inline { } */

/* Primary — matches logo */
--color-navy: #003152;

/* Blue Scale — blue-100, blue-500 match logo colors */
--color-blue-100: #D9E4FC;
--color-blue-200: #b5cdfd;
--color-blue-300: #93b1f7;
--color-blue-400: #6a9af7;
--color-blue-500: #447FF0;
--color-blue-600: #3669D8;

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
--color-info: #447FF0;
--color-info-light: #dbeafe;
```

### Color Usage Rules

**On dark backgrounds (navy, gradient):**
- **White**: Headlines, primary text
- **Blue 100 (#D9E4FC)**: Body text, subheadlines, nav links — readable without harsh white
- **Gray 300**: Secondary body text (metric labels, footer column headers, copyright)
- **Gray 400**: Tertiary text (source citations, timestamps)

**On light backgrounds (white, gray-50):**
- **Navy (#003152)**: All headlines (h1–h4), card titles, strong text
- **Gray 700**: Default body text (set in globals.css `body` rule)
- **Gray 800**: Emphasized body text (stat labels in QuickFacts)
- **Gray 500**: Secondary/supporting body text, descriptions, subheadlines
- **Gray 600**: FAQ answer text
- **Gray 200**: Borders, dividers
- **Gray 50**: Alternating section backgrounds

**Brand accent colors:**
- **Blue 500 (#447FF0)**: Primary CTA buttons (light bg), links, active nav indicators, icon accents, eyebrow labels
- **Blue 600 (#3669D8)**: Hover state for blue-500 buttons
- **Blue 200**: Decorative elements (step numbers in StepsOverview), accent bar hover states
- **Blue 100**: Icon container backgrounds (`bg-blue-100`)
- **Amber (#F59E0B)**: Semantic warning color ONLY. NOT for buttons, CTAs, badges, or decorative elements.

### Typography

```css
/* src/app/globals.css — inside @theme inline { } */
--font-display: var(--font-jakarta), sans-serif;
--font-body: var(--font-dm), sans-serif;
```

**Global rules in globals.css:**
```css
body { font-family: var(--font-body); color: var(--color-gray-700); }
h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -0.02em; line-height: 1.15; }
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

### Type Scale (as implemented)

| Element              | Classes                                        | Usage                                      |
| -------------------- | ---------------------------------------------- | ------------------------------------------ |
| H1 Hero              | `text-4xl md:text-6xl lg:text-7xl font-extrabold` | Hero headline only                         |
| H2 Section Title     | `text-3xl md:text-4xl font-bold text-navy`     | All section headings (consistent everywhere) |
| H3 Card/Step Title   | `text-xl font-bold text-navy`                  | FeatureGrid cards, StepsOverview steps     |
| Subheadline          | `text-lg text-gray-500`                        | Below section h2, no font-weight override  |
| Eyebrow Label        | `text-sm font-semibold uppercase tracking-widest text-blue-500` | QuickFacts "By the Numbers"    |
| Body Large           | `text-lg leading-relaxed`                      | Hero body, guarantee body, CTA body        |
| Body                 | `text-sm leading-relaxed`                      | Card descriptions, step descriptions       |
| Body Small           | `text-xs`                                      | Source citations, context text             |

### Buttons (`src/components/ui/Button.tsx`)

Five variants via a single component. All share: `inline-flex items-center justify-center font-bold font-body transition-all duration-300 ease-out`.

**Primary (light backgrounds):**
```
bg-blue-500 text-white px-8 py-3.5 rounded-lg shadow-sm
hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]
```

**Primary Dark (dark/navy backgrounds):**
```
bg-white text-navy px-8 py-3.5 rounded-lg shadow-sm
hover:bg-white/95 hover:shadow-[0_4px_16px_rgba(255,255,255,0.25)]
```

**Secondary / Outline (light backgrounds):**
```
border-2 border-blue-500 text-blue-500 px-8 py-3.5 rounded-lg
hover:bg-blue-500 hover:text-white
```

**Outline Dark (dark/navy backgrounds — used for navbar CTA):**
```
border-2 border-white text-white px-8 py-3.5 rounded-lg
hover:bg-white hover:text-navy
```

**Text Link:**
```
text-blue-500 font-semibold
```
Uses `.btn-text-link` CSS class for underline slide-in from left via `::after` pseudo-element.

```tsx
<Button variant="primary">Start Learning Now</Button>
<Button variant="primary-dark">Start Learning Now</Button>
<Button variant="secondary" href="/faq">See All FAQs →</Button>
<Button variant="outline-dark">Get Started</Button>
<Button variant="text" href="/faq">See All FAQs →</Button>
```

**Important:** No `hover:scale` or `active:scale` on any buttons. Hover effects use glow shadows and color fills only.

### Cards

```
bg-white border border-gray-200 rounded-xl p-6
shadow-sm
```

- Hover (after entrance animation): `hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg transition-all duration-300 ease-out`
- Requires `translate-y-0` base state so browser knows the transition starting point
- Icon container: `w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center` (icons at size={24})
- Equal height in grids: use `grid` with `items-stretch`
- **Important:** Cards using `fadeUp()` inline styles must implement the `entranceDone` pattern (see Animation Patterns below) for hover effects to work

### Spacing

- Between major page sections: `py-20 md:py-24` (consistent across ALL sections except Hero)
- Hero: `min-h-[calc(100svh-4rem)]` flex layout, content centered via `flex-1 items-center`, metrics pinned to bottom
- Between section heading and content: `mt-12`
- Card grid gaps: `gap-6`
- Max content width: `max-w-7xl mx-auto` (1280px) — except centered sections (Guarantee, FAQ, BottomCta) use `max-w-3xl`
- Side padding: `px-6` mobile, `md:px-10` tablet, `lg:px-16` desktop
- Navbar: `max-w-[1440px] px-8 lg:px-12 py-5`

### Shadows

- `shadow-sm`: Default card/element resting state
- `shadow-lg`: Card hover-lift state, elevated dropdowns
- `shadow-xl`: Navbar dropdown
- `shadow-[0_4px_16px_rgba(...)]`: Custom glow shadows on button hover

---

## Project Structure (actual files)

```
testprep4u-site/
├── public/
│   └── assets/
│       └── testprep4u-logo-light.svg     # SVG logo (light/white version for nav)
├── src/
│   ├── app/
│   │   ├── globals.css                    # Tailwind v4 @theme + global styles + CSS animations
│   │   ├── layout.tsx                     # Root layout (fonts, Navbar, Footer)
│   │   ├── page.tsx                       # Homepage (composes section components)
│   │   └── favicon.ico
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                 # Sticky nav, SVG logo, hover dropdown, scroll effect
│   │   │   └── Footer.tsx                 # 4-column footer, navy bg
│   │   ├── ui/
│   │   │   ├── Button.tsx                 # 5 variants (primary, primary-dark, secondary, outline-dark, text)
│   │   │   ├── CountUp.tsx                # Animated number count-up (easeOutCubic, skips ranges)
│   │   │   └── MetricStrip.tsx            # 3-col stat strip (standalone, used on future pages)
│   │   └── sections/
│   │       ├── Hero.tsx                   # Full-viewport hero + integrated metric strip
│   │       ├── FeatureGrid.tsx            # 3x2 card grid with entranceDone hover pattern
│   │       ├── StepsOverview.tsx          # 3-column steps with large decorative numbers
│   │       ├── Guarantee.tsx              # Full-width gradient section with shield icon
│   │       ├── QuickFacts.tsx             # Two-column: stat rows (left) + image placeholder (right)
│   │       ├── FaqPreview.tsx             # Controlled accordion with CSS grid animation
│   │       └── BottomCta.tsx              # Navy CTA section
│   ├── hooks/
│   │   ├── useInView.ts                   # IntersectionObserver hook (fires once by default)
│   │   └── useScrolled.ts                 # Scroll threshold detection hook
│   └── lib/
│       ├── animations.ts                  # fadeUp() and slideLeft() transition style helpers
│       ├── constants.ts                   # STATS, SITE, NAV_LINKS, FOOTER_LINKS
│       ├── content.ts                     # All marketing copy organized by page
│       └── pricing.ts                     # PRICING_TIERS data structure
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── CLAUDE.md
```

---

## Animation Patterns

All scroll-triggered animations use `useInView` hook + inline `style` props from `src/lib/animations.ts`.

### fadeUp(visible, delay)

Fades in and rises 16px. Duration 0.6s ease-out. Used on all section content.

```tsx
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";

const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

<div ref={ref}>
  <h2 style={fadeUp(isInView, 0)}>Headline</h2>       {/* appears first */}
  <p style={fadeUp(isInView, 150)}>Subheadline</p>     {/* 150ms delay */}
  <div style={fadeUp(isInView, 150 + i * 100)}>Card</div> {/* staggered */}
</div>
```

### slideLeft(visible, delay)

Slides in 20px from left and fades in. Duration 0.5s ease-out. Used on Hero metric strip items.

### Stagger pattern (standardized)

- Section heading: delay `0`
- Subheadline: delay `150`
- Grid items: delay `150 + i * 100` (consistent across FeatureGrid, StepsOverview, QuickFacts)
- CTA below grid: delay `650`

### entranceDone Pattern (required for cards with hover effects)

Inline `fadeUp()` styles have higher CSS specificity than Tailwind hover utilities. To fix: after the entrance animation completes, clear inline styles so Tailwind hover classes take effect.

```tsx
const [entranceDone, setEntranceDone] = useState(false);

useEffect(() => {
  if (isInView && !entranceDone) {
    const timer = setTimeout(() => setEntranceDone(true), 1300);
    return () => clearTimeout(timer);
  }
}, [isInView, entranceDone]);

// On the card element:
className={entranceDone
  ? "translate-y-0 ... hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out"
  : "..."}
style={entranceDone ? undefined : fadeUp(isInView, 150 + i * 100)}
```

### CountUp Component

Animates numbers from 0 to target. Skips ranges containing en-dash/hyphen (e.g., "20–60 hrs" renders instantly). easeOutCubic easing, 1200ms default duration.

```tsx
<CountUp value="57.9%" trigger={isInView} />
<CountUp value="70%" trigger={isInView} />
<CountUp value="20–60 hrs" trigger={isInView} />  {/* renders instantly, no animation */}
```

### CSS Animations (in globals.css)

- `.nav-link::after` — Blue-500 underline slides in via `scaleX(0)` → `scaleX(1)`, transform-origin left, 300ms ease
- `.nav-dropdown` — Fade-in + slide-down keyframe animation, 200ms ease-out
- `.faq-answer` / `.faq-answer.open` — CSS `grid-template-rows: 0fr → 1fr` with opacity, 300ms ease
- `.btn-text-link::after` — Underline width 0 → 100%, 300ms ease

---

## Homepage Section Flow

The homepage renders these sections in order. Background colors alternate for visual separation:

| # | Section          | Background                                    | Layout            |
|---|------------------|-----------------------------------------------|-------------------|
| 1 | Hero             | `bg-navy` (full viewport)                     | Left-aligned, metrics pinned to bottom |
| 2 | FeatureGrid      | white (implicit)                              | Centered header, 3x2 card grid |
| 3 | StepsOverview    | `bg-gray-50`                                  | Centered header, 3-col with decorative numbers |
| 4 | Guarantee        | `bg-gradient-to-br from-navy via-[#003d6b] to-blue-500` | Centered, narrow max-w-3xl |
| 5 | QuickFacts       | white                                         | Left-aligned header, 2-col (stats + image) |
| 6 | FaqPreview       | `bg-gray-50`                                  | Centered, narrow max-w-3xl, accordion |
| 7 | BottomCta        | `bg-navy`                                     | Centered, narrow max-w-3xl |
| 8 | Footer           | `bg-navy` + `border-t border-white/10`        | 4-column grid |

---

## Component Patterns

### Navbar (`src/components/layout/Navbar.tsx`)

- `'use client'` — uses `usePathname()`, `useScrolled()`, hover state
- SVG logo via `next/image` from `/public/assets/testprep4u-logo-light.svg` (160×34)
- Desktop links: `text-blue-100` default, `hover:text-white`, active page gets `.active` class (blue-500 underline via CSS)
- Courses dropdown: CSS `group-hover` based (not click), navy bg with `border-white/10`, invisible bridge div prevents close gap
- CTA: `Button variant="outline-dark" className="!px-5 !py-2 text-sm"` — `!important` needed to override variant's baked-in `py-3.5`
- Scroll effect: `bg-navy/95 backdrop-blur-md shadow-lg shadow-black/10` when scrolled past 50px
- Mobile: hamburger toggle, full-width menu with `border-t border-white/10`

### Hero (`src/components/sections/Hero.tsx`)

- `'use client'` — uses `useState` for mount animation, `useInView` for metrics
- Full viewport: `min-h-[calc(100svh-4rem)] flex flex-col bg-navy`
- Content vertically centered via `flex-1 items-center`
- Metric strip pinned to bottom with `border-t border-white/10`
- Hero content uses `fadeUp(mounted, delay)` triggered on mount (not scroll)
- Metrics use `slideLeft(metricsVisible, i * 200)` triggered by scroll
- Metric items: `border-l-4 border-blue-500 pl-5`, numbers in white, labels in `gray-300`
- Two CTAs: `primary-dark` + `outline-dark`

### FeatureGrid (`src/components/sections/FeatureGrid.tsx`)

- `'use client'` — uses `useInView`, `entranceDone` state for hover
- 6 cards in 3x2 grid (`md:grid-cols-2 lg:grid-cols-3`)
- Icons: `[Monitor, MapPin, GraduationCap, BrainCircuit, Users, Target]` from Lucide
- Bullets use `Check` icon in `text-blue-500`
- Card content from `homePage.featureGrid.cards` in content.ts
- Uses `entranceDone` pattern — hover effects only work after 1300ms

### StepsOverview (`src/components/sections/StepsOverview.tsx`)

- `'use client'` — uses `useInView`
- 3-column grid on desktop
- Large decorative numbers: `text-7xl font-extrabold text-blue-200` formatted as "01", "02", "03"
- Step title and description below each number, left-aligned
- CTA: `Button variant="secondary"`

### Guarantee (`src/components/sections/Guarantee.tsx`)

- `'use client'` — uses `useInView`
- Full-width gradient: `bg-gradient-to-br from-navy via-[#003d6b] to-blue-500`
- Decorative blurred orbs for depth (absolute positioned, `blur-3xl`)
- Centered layout with `max-w-3xl`
- ShieldCheck icon (size={40}) in frosted circle (`bg-white/10 ring-2 ring-white/20`)
- CTA: `Button variant="primary-dark"`

### QuickFacts (`src/components/sections/QuickFacts.tsx`)

- `'use client'` — uses `useInView`, `CountUp`
- Two-column layout: stats (55%) + image placeholder (45%)
- Eyebrow label: "By the Numbers" in `text-blue-500 uppercase tracking-widest`
- Left-aligned header (different from other centered sections)
- Stat rows: vertical accent bar (`w-1 h-10 bg-blue-500/30`, `group-hover:bg-blue-500`), number in navy, label in `gray-800`, context in `gray-500`
- Rows separated by `border-b border-gray-100`
- Image placeholder: `rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-200/60`, stretches full height via `lg:items-stretch`

### FaqPreview (`src/components/sections/FaqPreview.tsx`)

- `'use client'` — uses `useState` for controlled accordion, `useInView`
- 7 FAQ items from `homePage.faqPreview.items` in content.ts
- Controlled React accordion (NOT native `<details>`) — single open at a time
- Animation: CSS `grid-template-rows: 0fr → 1fr` via `.faq-answer` / `.faq-answer.open` classes
- Plus icon rotates 45° to become × when open (`rotate-45`, `duration-300`)
- Questions: `font-display text-base font-bold text-navy`
- Answers: `font-body text-sm leading-relaxed text-gray-600`
- Closed items: `hover:bg-gray-50`
- Items: `rounded-lg border border-gray-200 bg-white shadow-sm`, gap `gap-2.5`
- CTA: `Button variant="secondary"`

### BottomCta (`src/components/sections/BottomCta.tsx`)

- `'use client'` — uses `useInView`
- Navy background, centered text, `max-w-3xl`
- Headline in white, body in `text-blue-100`
- CTA: `Button variant="primary-dark"`

### Footer (`src/components/layout/Footer.tsx`)

- Server Component (no `'use client'`)
- Navy bg with `border-t border-white/10` (separates from BottomCta)
- 4-column grid: Brand, Courses, Company, Resources
- Links: `text-blue-100 hover:text-white`
- Column headers: `text-gray-300 uppercase tracking-wider`
- Brand text logo (not SVG) in footer: `font-display text-2xl font-extrabold`

### MetricStrip (`src/components/ui/MetricStrip.tsx`)

Standalone reusable component for use on future pages (process page, course pages). Not used on the homepage — the hero has its own integrated metrics. Accepts `items` prop with `value`, `label`, `source`, `tone`.

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

## Content Data

All marketing copy lives in `src/lib/content.ts`, organized by page (`homePage`, `processPage`, `aboutPage`, `faqPage`, `pricingPage`, `coursePage`). Shared data (metric strip, guarantee, quick facts) lives in `shared` export.

Site-wide constants (stats, URLs, nav links) live in `src/lib/constants.ts`.

Pricing tier data lives in `src/lib/pricing.ts`.

### Key Stats (`src/lib/constants.ts`)

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

All prices below are **CLIENT ACTION REQUIRED — confirm exact amounts before build.**

| Tier       | Life     | Health   | Combined  |
| ---------- | -------- | -------- | --------- |
| Essentials | $TBD     | $TBD     | $TBD      |
| Pro        | $TBD     | $TBD     | $TBD      |
| Premium    | $TBD     | $TBD     | $TBD      |

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
- `'use client'` only when component needs interactivity (hooks, state, event handlers)

### File Naming

- Components: PascalCase (`FeatureGrid.tsx`)
- Pages: `page.tsx` inside route directory (Next.js App Router convention)
- Utilities/data: camelCase (`states.ts`, `constants.ts`)
- Hooks: camelCase with `use` prefix (`useInView.ts`)

### Git

- Commit messages: short imperative (`Add homepage hero section`, `Wire up FAQ accordion`)
- Push to main after each working increment
- Vercel auto-deploys from main

---

## Important Notes

- **Phase 2 is a demo only.** All dashboard features use mock data and fake auth. No Supabase, no Stripe, no real backend. Structure code so swapping to real providers later is straightforward.
- **All copy comes from the client's content docs.** Do not rewrite or improvise marketing copy. Use the exact text provided by Jason Van Steenwyk. Annotations marked with ⚑ are client action items — use placeholder text where needed.
- **Amber is a semantic warning color only.** Do not use amber for buttons, CTAs, badges, or decorative elements. Primary CTAs use blue-500 (light bg) or white (dark bg).
- **Server Components by default.** Only add `'use client'` when a component genuinely needs interactivity (accordion, mobile nav toggle, state selector dropdown). Keep the JS bundle minimal.
- **Images are TBD.** Use proper `next/image` components with placeholder dimensions so images can be swapped in without layout shift.
- **No hover:scale effects on buttons.** Use glow shadows and color transitions only.
- **fadeUp inline styles override Tailwind hover.** Any component using `fadeUp()` that also needs hover effects MUST implement the `entranceDone` pattern to clear inline styles after animation.
- **Navbar CTA padding requires `!important`.** The outline-dark variant has `py-3.5` baked in; the navbar overrides it with `!py-2`.
- **Search engines are blocked until launch.** `public/robots.txt` disallows all crawlers and root layout metadata sets `noindex, nofollow`. Both contain "REMOVE BEFORE LAUNCH" comments. Delete the robots disallow rule and remove the `robots` metadata field before going live.
