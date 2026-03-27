# CLIENT_JOURNEY.md — TestPrep4U Platform Documentation

Complete end-to-end documentation of every process in the TestPrep4U platform, traced through the actual codebase.

---

## Table of Contents

1. [New User Signup](#1-new-user-signup)
2. [Course Purchase](#2-course-purchase)
3. [Student Dashboard](#3-student-dashboard)
4. [Course Progression](#4-course-progression)
5. [SCORM Integration](#5-scorm-integration)
6. [Quiz & Exam Engine](#6-quiz--exam-engine)
7. [Time Tracking](#7-time-tracking)
8. [Completion Flow](#8-completion-flow)
9. [Upgrade Flow](#9-upgrade-flow)
10. [Email System](#10-email-system)
11. [Security](#11-security)
12. [Infrastructure](#12-infrastructure)

---

## 1. New User Signup

### Pages Involved

| Route | File | Type |
|-------|------|------|
| `/signup` | `src/app/(auth)/signup/page.tsx` | Client component |
| `/login` | `src/app/(auth)/login/page.tsx` | Client component |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Client component |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | Client component |
| `/auth/callback` | `src/app/auth/callback/route.ts` | API route (GET) |

### Signup Form Fields

1. **Full name** (`fullName`) — text, required, placeholder "Alex Johnson"
2. **Email** (`email`) — email, required, placeholder "you@example.com"
3. **Password** (`password`) — password, required, min 8 chars, with Eye/EyeOff visibility toggle
4. **State** (`state`) — select dropdown, required, currently only `[{ value: "FL", label: "Florida" }]`

A "Back to website" link below the form links to `/` for users who navigated here by mistake.

### Signup Flow Step by Step

1. **User submits the form.** Client-side validates password >= 8 characters.

2. **`signup()` helper** (`src/lib/supabase-auth.ts`) calls Supabase:
   ```
   supabase.auth.signUp({
     email,
     password,
     options: {
       data: { full_name: fullName, state: state },
       emailRedirectTo: `${origin}/auth/callback?next=${redirectTo}`
     }
   })
   ```
   - `redirectTo` is set when the user arrived with `?plan=...&course=...` query params (from pricing page). It encodes the return path as `/pricing?plan=pro&course=fl-life&autoCheckout=true`.
   - The `plan` and `course` params are also stored in `localStorage` as `"pendingCheckout"` as a fallback.

3. **Email-exists detection:** If Supabase returns a user with an empty `identities` array, the signup page shows "An account with this email already exists. Sign in instead."

4. **Success screen** displays: "Check your email — We sent a confirmation link to {email}."

5. **Supabase sends a confirmation email** with a link to `/auth/callback?code=XXX&next=/pricing?plan=pro&course=fl-life&autoCheckout=true`.

6. **User clicks the email link.** The callback route (`src/app/auth/callback/route.ts`) runs:
   - Exchanges the `code` for a session via `supabase.auth.exchangeCodeForSession(code)`.
   - Detects new user (created_at within last 5 minutes) and sends a **welcome email** via `welcomeEmail()` template.
   - Sanitizes the `next` param (must start with `/` and not `//` to prevent open redirects).
   - Redirects to the `next` URL, or falls back to `/pricing` for new users, `/dashboard` otherwise.
   - **Error handling:** If the link is expired, denied, or invalid, the callback detects `error_code` / `error_description` params from Supabase and redirects to `/login?error={friendlyMessage}`. Mapped errors include `otp_expired` ("This link has expired"), `access_denied` ("Access was denied"), and `otp_invalid` ("This link is invalid or has already been used").

7. **Database trigger fires** (`supabase/migrations/001_initial_schema.sql`): The `on_auth_user_created` trigger calls `handle_new_user()`, which inserts a row into `profiles`:
   ```sql
   INSERT INTO profiles (id, full_name, state, plan_tier)
   VALUES (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''),
           coalesce(new.raw_user_meta_data ->> 'state', ''), null);
   ```
   This runs as `SECURITY DEFINER` (service role context) so it bypasses RLS.

### Login Flow

1. User submits email + password (password field has Eye/EyeOff visibility toggle). `login()` helper calls `supabase.auth.signInWithPassword()`.
2. Specific error messages are mapped:
   - `"Invalid login credentials"` → "Incorrect email or password."
   - `"Email not confirmed"` → "Please confirm your email address before signing in." — also shows a **"Resend confirmation email"** button that calls `resendConfirmation()` (`supabase.auth.resend({ type: "signup", email })`). On success, displays "Confirmation email sent!" toast.
   - Rate limit errors → "Too many login attempts. Please wait."
3. **Callback error display:** If the user arrives with `?error=...` (from an expired/invalid auth callback link), the error message is displayed at the top of the form and cleaned from the URL via `history.replaceState`.
4. After successful login:
   - If `plan` + `course` params exist → redirect to `/pricing?plan=X&course=Y&autoCheckout=true`.
   - Otherwise → fetch `GET /api/user/has-enrollments` to check if user has active enrollments.
     - Has enrollments → redirect to `/dashboard`.
     - No enrollments → redirect to `/pricing`.

### Password Reset Flow

1. `/forgot-password` — User enters email. Calls `supabase.auth.resetPasswordForEmail()` with redirect to `/auth/callback?next=/reset-password`.
2. Supabase sends reset email with link to `/auth/callback?code=XXX&next=/reset-password`.
3. Callback exchanges code for session. Detects `"reset-password"` in the next param and skips the welcome email.
4. Redirects to `/reset-password` where user enters new password + confirmation. Both password fields have Eye/EyeOff visibility toggles.
5. Calls `supabase.auth.updateUser({ password })`, then redirects to `/dashboard`.

### Middleware Protection (`src/middleware.ts`)

Runs on every request matching the configured routes:

```
matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password", "/reset-password"]
```

| Condition | Action |
|-----------|--------|
| Unauthenticated + `/dashboard/*` | Redirect to `/login` |
| Authenticated + `/login`, `/signup`, or `/forgot-password` | Redirect to `/dashboard` (or `/pricing` if plan/course params present) |

The middleware also refreshes the Supabase session on every matched request.

### Navbar Integration (`src/components/layout/Navbar.tsx`)

The navbar checks for an active session on mount via `getSession()`:
- **Logged in:** Shows a "Dashboard" button linking to `/dashboard`.
- **Logged out:** Shows "Log In" link + "Get Started" button linking to `/pricing`.

---

## 2. Course Purchase

### Pricing Page Flow

**Files:** `src/app/(marketing)/pricing/page.tsx`, `src/components/ui/PricingCards.tsx`

The pricing page renders `<PricingCards>` which reads URL query params:
- `?course=life|health|combined` — pre-selects course type toggle
- `?plan=essentials|pro|premium` — pre-selects tier
- `?autoCheckout=true` — auto-triggers checkout on load (used after signup redirect)

**Auto-Checkout Loading State:** When `autoCheckout=true` is detected with a valid `plan` param, the component renders a full-screen `<AutoCheckoutLoader>` instead of the pricing cards. This branded loading screen shows the TestPrep4U logo, a spinner, and "Setting up your course..." message. It checks for existing enrollments first (redirects to dashboard if already enrolled), then initiates the Stripe checkout. If the checkout fails, it reloads without the `autoCheckout` param to show the normal pricing cards.

Each tier card displays the **course full name** (e.g., "Florida Life Insurance") below the price via `COURSE_FULL_NAMES[courseType]` from `src/lib/pricing.ts`, so toggling between Life/Health shows a visible change even when prices are identical.

### Tier Structure (`src/lib/pricing.ts`)

| Tier | Access | Life/Health Price | Combined Price |
|------|--------|-------------------|----------------|
| Essentials | 6 months | $149 | $179 |
| Pro | 9 months | $219 | $259 |
| Premium | 12 months | $319 | $369 |

### Stripe Price IDs (`src/lib/stripe.ts`)

Each tier + course type maps to a Stripe Price ID:
```
essentials-life    → price_1TFHFmDpayTd63L242sqQPIQ
pro-life           → price_1TFHTTDpayTd63L2KP4CvRCX
premium-life       → price_1TFHTTDpayTd63L2qqQBXf8A
essentials-health  → price_1TFHGzDpayTd63L2GrHVjCZC
pro-health         → price_1TFHUCDpayTd63L2VSAMjZn7
premium-health     → price_1TFHUCDpayTd63L2nQOOYhix
essentials-combined→ price_1TFHHYDpayTd63L22KAIJrp6
pro-combined       → price_1TFHVDDpayTd63L2F85ZIAbG
premium-combined   → price_1TFHVDDpayTd63L2vdktgL3c
```

### Checkout Button Behavior

When user clicks "Get Started" on a tier:

1. **Check enrollment status** via `GET /api/user/has-enrollments`.
2. If **401 (not logged in)**:
   - Store `{ plan, course }` in localStorage as `"pendingCheckout"`.
   - Redirect to `/signup?plan={tier}&course={courseType}`.
3. If **logged in**:
   - Call `POST /api/checkout` with `{ tier, courseType }`.
   - Redirect to the Stripe Checkout URL returned.
4. After checkout redirect, clear `autoCheckout` from URL to prevent re-trigger on back navigation.

### Checkout API Route (`src/app/api/checkout/route.ts`)

**POST /api/checkout**

Request: `{ tier: string, courseType: string }`

1. Authenticates via Supabase. Returns 401 if not logged in.
2. Validates tier and courseType values.
3. Looks up the Stripe Price ID via `getStripePriceId(tier, courseType)`.
4. Fetches user's `stripe_customer_id` and `state` from `profiles`.
5. Looks up course by type + user's state (defaults to "FL").
6. Creates a Stripe Checkout Session:

```
mode: "payment" (one-time)
payment_method_types: ["card"]
success_url: {origin}/dashboard?checkout=success
cancel_url: {origin}/pricing?checkout=cancelled&plan={tier}&course={courseType}
metadata: {
  user_id: <uuid>,
  tier: "pro",
  course_type: "life",
  course_slug: "fl-life"
}
```

If the user has an existing `stripe_customer_id`, it's passed as `customer`. Otherwise, `customer_email` is used.

Returns: `{ url: "https://checkout.stripe.com/..." }`

### Stripe Webhook — Enrollment Creation (`src/app/api/webhooks/stripe/route.ts`)

**POST /api/webhooks/stripe** — handles `checkout.session.completed`

1. **Verify signature** using `STRIPE_WEBHOOK_SECRET`. Returns 400 if invalid. Returns 500 if secret is not configured.

2. **Extract metadata** from the session: `user_id`, `tier`, `course_type`, `course_slug`, and `upgrade` flag.

3. **Check for upgrade** — if `metadata.upgrade === "true"`, delegate to upgrade handler (see [Section 9](#9-upgrade-flow)).

4. **Look up course** by slug (preferred) or by type (legacy fallback). Only active courses.

5. **Idempotency checks:**
   - Primary: Check if an enrollment already exists with this `stripe_session_id`.
   - Secondary: Check if an active enrollment exists for this user + course.

6. **Calculate expiration** with month-overflow clamping:
   ```js
   const TIER_ACCESS_MONTHS = { essentials: 6, pro: 9, premium: 12 };
   const accessMonths = TIER_ACCESS_MONTHS[tier] ?? 6;
   const expiresAt = new Date();
   const targetMonth = expiresAt.getMonth() + accessMonths;
   expiresAt.setMonth(targetMonth);
   // Clamp: e.g., Jan 31 + 1 month = Feb 28, not Mar 3
   if (expiresAt.getMonth() !== targetMonth % 12) {
     expiresAt.setDate(0); // last day of previous month
   }
   ```

7. **Create enrollment:**
   ```sql
   INSERT INTO enrollments (user_id, course_id, status, expires_at, stripe_session_id)
   VALUES ($1, $2, 'active', $3, $4)
   ```

8. **Update profile:** Sets `plan_tier` and `stripe_customer_id` (if available).

9. **Send enrollment email** via `enrollmentEmail()` template with course name, tier, access months, and expiration date.

### Complete Purchase Journey (New User)

```
User clicks "Get Started" on Pro Life tier
  → /api/user/has-enrollments returns 401
  → Store pendingCheckout, redirect to /signup?plan=pro&course=life
  → User fills signup form
  → Supabase sends confirmation email (link: /auth/callback?next=/pricing?plan=pro&course=life&autoCheckout=true)
  → User clicks email link
  → /auth/callback exchanges code, sends welcome email, redirects to pricing
  → PricingCards detects autoCheckout=true, triggers handleCheckout
  → POST /api/checkout → Stripe Checkout URL
  → User completes payment on Stripe
  → Stripe fires checkout.session.completed webhook
  → Webhook creates enrollment (expires in 9 months), updates profile, sends enrollment email
  → User redirected to /dashboard?checkout=success
```

---

## 3. Student Dashboard

### Dashboard Home (`src/app/dashboard/page.tsx`)

**Data loading** (parallel queries via `Promise.all`):
- `getUserEnrollments()` — fetches all active/completed enrollments that haven't expired
- `getDashboardStats()` — aggregates study hours, practice exam average, enrollment count

**Welcome section:** "Welcome back, {firstName}" — extracted from `user.user_metadata.full_name` or email prefix.

**Milestone callout:** Blue alert with ShieldCheck icon — "Score 80%+ on 3 practice exams to qualify for the Pass Guarantee."

**Stats grid** (3 columns):

| Stat | Source | Display |
|------|--------|---------|
| Study Hours | `SUM(time_logs.duration_seconds)` across all enrollments, converted to hours | e.g., "24.5" |
| Practice Exam Avg | `AVG(exam_attempts.score)` where `exam_type = 'practice'` | e.g., "76%" or "—" if none |
| Courses Enrolled | `COUNT(enrollments)` where status in ('active', 'completed') | e.g., "2" |

**Enrolled courses section:** 2-column responsive grid of course cards.
- Each card shows: course type badge, course name, enrollment date, expiration date, and a CTA button.
- CTA is **"Start Course"** if `hasStarted === false`, otherwise **"Continue Course"**.
- Links to `/dashboard/courses/{courseSlug}`.

The My Courses page (`/dashboard/courses`) uses the same "Start Course" / "Continue Course" logic.

**Empty state:** If no enrollments, shows "You don't have any active courses yet" with a link to `/pricing`.

### Dashboard Layout (`src/app/dashboard/layout.tsx`)

Server component that wraps all `/dashboard/*` pages:
- Authenticates via `createServerSupabaseClient()`. Redirects to `/login` if no session.
- Extracts `userName` from user metadata.
- Renders `<DashboardShell>` with sidebar + top bar (no marketing navbar or footer).

### Sidebar (`src/components/dashboard/Sidebar.tsx`)

Navigation items:

| Label | Route | Icon |
|-------|-------|------|
| Dashboard | `/dashboard` | LayoutDashboard |
| My Courses | `/dashboard/courses` | BookOpen |
| Practice Exams | `/dashboard/exams` | FileQuestion |
| Settings | `/dashboard/settings` | Settings |

- Desktop: fixed 256px left sidebar.
- Mobile: slide-in drawer with overlay, toggled by hamburger.
- Active state: blue left border + blue background tint.
- Logout button at bottom opens a confirmation modal.

### Settings Page (`src/app/dashboard/settings/page.tsx`)

Displays:
- **Profile:** Editable via `<ProfileEditor>` component (`src/components/dashboard/ProfileEditor.tsx`). Shows name, email (read-only), phone, and state. A pencil icon toggles edit mode; Cancel reverts to saved values. Saves via `PATCH /api/user/profile` which updates both the `profiles` table and syncs `full_name`/`state` to auth `user_metadata`. Input validation: name 1–100 chars, phone ≤ 20 chars, state must be `"FL"`.
- **Subscription:** Current tier badge, active status, enrollment date, expiration date, included features list from `PRICING_TIERS`.
- **Upgrade section:** `<UpgradeSection>` component if not at max tier (see [Section 9](#9-upgrade-flow)).
- **Support:** Link to `/contact` (opens in new tab).
- **Upgrade success banner:** Shown when `?upgrade=success` query param is present.

### Practice Exams Index (`src/app/dashboard/exams/page.tsx`)

For each enrolled course:
- If all sections complete → clickable card with attempt count and latest score, linking to `/dashboard/courses/{slug}/exams`.
- If sections not complete → grayed-out card with Lock icon and "Complete all course sections to unlock."

---

## 4. Course Progression

### Course Structure

The FL Life Insurance course is organized as:

```
Course (e.g., "fl-life")
├── Section 0: Course Introduction (1 lesson)
├── Section 1: General Insurance Concepts (4 lessons + 1 quiz)
├── Section 2: Life Insurance Products (7 lessons + 1 quiz)
├── Section 3: Social Security & Retirement (3 lessons + 1 quiz)
├── Section 4: Florida Laws & Rules (3 lessons + 1 quiz)
├── Section 5: Exam Preparation (2 lessons)
├── Practice Exam (native, not SCORM)
└── Final Exam (native, not SCORM)
```

**Database tables:** `course_sections` → `course_modules` (one-to-many)

Each module has:
- `module_type`: `"lesson"` (SCORM content) or `"quiz"` (can be SCORM or native)
- `scorm_entry_path`: path to SCORM entry HTML; `null` for native quizzes
- `sort_order`: sequential position within its section
- `quiz_pass_score`: `70` for section quizzes, `null` for lessons

### Sequential Unlock Logic (`src/lib/course-data.ts` — `computeUnlockState()`)

**Section unlock rules:**
- Section 0 (Introduction) is always unlocked.
- Section N (N > 0) unlocks when the previous section's quiz module has `success_status === "passed"`.
- If the previous section has no quiz, all its modules must have `status === "completed"`.

**Module unlock rules within an unlocked section:**
- First module is always unlocked (if its section is unlocked).
- Each subsequent lesson requires the previous module to have `status === "completed"`.
- Quiz modules require all lesson modules in the same section to be completed.

### Completion Tracking Per Module

Progress is stored in `module_progress` with a unique constraint on `(enrollment_id, module_id)`:

| Field | Values | Notes |
|-------|--------|-------|
| `status` | `not_started`, `in_progress`, `completed` | Overall progression |
| `completion_status` | `not attempted`, `incomplete`, `completed` | SCORM completion |
| `success_status` | `unknown`, `passed`, `failed` | SCORM success / quiz pass |
| `score` | 0–100 or null | Quiz score; highest score is preserved |
| `time_spent_seconds` | integer | Accumulated module time |
| `bookmark` | text | SCORM `cmi.location` for resume |
| `cmi_data` | jsonb | Full SCORM CMI data snapshot |
| `completed_at` | timestamp | When first completed |

**Downgrade prevention:** The SCORM save route (`src/app/api/scorm/save/route.ts`) never changes `status` from `"completed"` back to `"in_progress"`, and never changes `success_status` from `"passed"` back to anything else. Score is always `Math.max(newScore, existingScore)`.

### Quiz Gates Between Sections

Section quizzes (the last module in sections 1–4) act as gates:
- Students must score >= 70% to pass (unlimited retakes allowed).
- A passed quiz sets `success_status = "passed"` on the quiz module's `module_progress` row.
- The next section's unlock depends on this `success_status`.
- On pass, a `sectionCompletedEmail()` is sent.

### Course Detail View (`src/components/dashboard/CourseDetailView.tsx`)

Renders an accordion of sections, each expandable to show modules:
- Locked sections show a Lock icon and disabled expand.
- Each module shows status (Not Started / In Progress / Done / Locked), time spent, and score (for quizzes).
- SCORM modules link to `/dashboard/courses/{slug}/module/{moduleId}`.
- Native quizzes link to `/dashboard/courses/{slug}/quiz/{sectionNumber}`.
- A seat time tracker shows progress toward the 30-hour requirement.
- The Final Exam & Certificate card at the bottom shows contextual CTAs based on completion state.

**Module completion UX:** When a student returns from completing a SCORM module (via `?completed=moduleId` query param):
1. A green **completion toast** ("Chapter completed!") appears at the top and auto-dismisses after 3 seconds (CSS `animate-fade-in-down` animation).
2. The `?completed` param is immediately cleaned from the URL via `history.replaceState`.
3. The **next available module** is identified by `findNextModule()` — walks sections sequentially to find the next unlocked, incomplete module.
4. The section containing the next module is **auto-expanded**.
5. The next module row is **highlighted** with `ring-2 ring-blue-500 ring-offset-1 bg-blue-50`.
6. After a 300ms delay, the page **auto-scrolls** to the highlighted module via `scrollIntoView({ behavior: "smooth", block: "center" })`.

---

## 5. SCORM Integration

### How Modules Are Launched

**Route:** `/dashboard/courses/[courseId]/module/[moduleId]` (`src/app/dashboard/courses/[courseId]/module/[moduleId]/page.tsx`)

The server component:
1. Authenticates the user and verifies enrollment.
2. Fetches the module and its section from the database.
3. Checks sequential prerequisites — previous module must be completed, section must be unlocked.
4. If the module is a native quiz (type `"quiz"` without `scorm_entry_path`), redirects to `/dashboard/courses/{slug}/quiz/{sectionNumber}`.
5. Formats the learner name as "Last, First" for SCORM compliance.
6. Renders `<ModuleLauncher>`.

### ModuleLauncher Component (`src/components/dashboard/ModuleLauncher.tsx`)

A full-screen overlay that:
1. **Fetches saved progress** via `GET /api/scorm/load?enrollmentId=...&moduleId=...` to get previous `cmi_data` for resume.
2. **Creates a `ScormAPI` instance** with the saved data and mounts it on `window.API_1484_11`.
3. **Renders an iframe** pointing to the SCORM entry HTML (currently served from `public/` directory).
4. **Tracks session start time** (`Date.now()`) for elapsed time calculation.
5. **Immediate navigation on completion:** When the SCORM content calls `Terminate()`, the component fires a **fire-and-forget** save (no `await`) and immediately navigates back to the course detail page with `?completed={moduleId}` if the module was completed. A `hasNavigatedRef` prevents double navigation. There is no session summary overlay — the student returns to the course page instantly.

### API_1484_11 Discovery

SCORM 2004 content (Articulate Rise 360) searches for `window.API_1484_11` when it loads. The `ScormAPI` class (`src/lib/scorm-api.ts`) implements the full SCORM 2004 3rd Edition API:

| Method | Purpose |
|--------|---------|
| `Initialize("")` | Starts the session. Returns `"true"`. |
| `Terminate("")` | Ends the session. Accumulates total_time, fires `onTerminate`. |
| `GetValue(element)` | Reads a CMI data element. Blocks write-only elements. |
| `SetValue(element, value)` | Sets a CMI data element. Blocks read-only elements. |
| `Commit("")` | Persists data. Fires `onCommit` for intermediate server save. |
| `GetLastError()` | Returns the last error code. |
| `GetErrorString(code)` | Returns human-readable error description. |
| `GetDiagnostic(code)` | Returns empty string (not implemented). |

### What Data Is Captured

**CMI Data Model** — default values initialized in `CMI_DEFAULTS`:
- `cmi.completion_status` — "not attempted" / "incomplete" / "completed"
- `cmi.success_status` — "unknown" / "passed" / "failed"
- `cmi.score.raw`, `cmi.score.scaled`, `cmi.score.min`, `cmi.score.max`
- `cmi.location` — bookmark for resume
- `cmi.suspend_data` — content-specific state for resume
- `cmi.session_time` — ISO 8601 duration for current session
- `cmi.total_time` — accumulated across all sessions
- `cmi.exit` — "suspend" / "" / other
- `cmi.interactions.*` — interaction tracking
- `cmi.objectives.*` — objective tracking

**Read-only elements** (SetValue rejects): `cmi.completion_threshold`, `cmi.credit`, `cmi.entry`, `cmi.launch_data`, `cmi.learner_id`, `cmi.learner_name`, `cmi.max_time_allowed`, `cmi.mode`, `cmi.scaled_passing_score`, `cmi.time_limit_action`, `cmi.total_time`, `cmi.interactions._count`, `cmi.objectives._count`.

**Write-only elements** (GetValue rejects): `cmi.exit`, `cmi.session_time`.

### How Resume Works

When `initialData` is provided (from a previous session's `cmi_data`):
1. All saved CMI values are merged on top of defaults.
2. `previousTotalSeconds` is parsed from `cmi.total_time` for accumulation.
3. `cmi.entry` is set to `"resume"` if:
   - The previous session set `cmi.exit = "suspend"`, OR
   - The content was started but not completed (`completion_status` is not "completed" or "unknown").
4. `cmi.session_time` and `cmi.exit` are reset for the new session.
5. Interaction and objective counts are restored.

On `Terminate()`:
- `cmi.total_time` is updated: `toDuration(previousTotalSeconds + parseDuration(cmi.session_time))`.
- The `parseDuration()` function handles ISO 8601 durations including days: `P[nD]T[nH][nM][nS]`.

### How Progress Saves

**Intermediate saves (every ~20s):**
- Rise 360 calls `Commit()` approximately every 20 seconds.
- `onCommit` callback fires `saveProgress(data, isFinal=false)`.
- Posts to `POST /api/scorm/save` with `isFinal: false`.
- Server upserts `module_progress` with CMI data, status, score, bookmark.
- Time is NOT accumulated on intermediate saves (avoids double-counting).
- A debounce flag (`saveInFlightRef`) prevents overlapping requests.

**Final save (on Terminate or close):**
- When content calls `Terminate()`, `onTerminate` fires `saveProgress(data, isFinal=true)` as **fire-and-forget** (no `await`) and immediately navigates back to the course detail page. If the module was completed, the URL includes `?completed={moduleId}` to trigger the completion toast and next-module highlighting.
- If the user clicks the close button before `Terminate()`, `handleClose()` also fires a fire-and-forget save and navigates back immediately.
- A `hasNavigatedRef` prevents double navigation if both `onTerminate` and `handleClose` fire in quick succession.
- With `isFinal: true`, the server:
  1. Fetches the existing `time_spent_seconds` and adds the new session time.
  2. Creates a `time_logs` row for the audit trail.

**Tab close / browser navigation:**
- `beforeunload` event triggers `navigator.sendBeacon("/api/scorm/save", payload)` with `isFinal: true`.
- sendBeacon is fire-and-forget — it survives page unload.

### SCORM Save Route Details (`src/app/api/scorm/save/route.ts`)

1. Verifies user owns the enrollment.
2. Maps SCORM statuses to database values.
3. Computes score: prefers `scoreScaled * 100`, falls back to `scoreRaw`.
4. Derives `success_status`: uses SCORM-reported value; for quiz modules, falls back to `score >= quiz_pass_score`.
5. Caps session time at 4 hours (14,400 seconds).
6. Preserves highest score via `Math.max(newScore, existingScore)`.
7. Never downgrades `status` from "completed" or `success_status` from "passed".
8. Only accumulates `time_spent_seconds` and inserts `time_logs` when `isFinal === true`.

### SCORM Load Route (`src/app/api/scorm/load/route.ts`)

**GET /api/scorm/load?enrollmentId=...&moduleId=...**

Returns: `{ cmiData, bookmark, timeSpentSeconds, completionStatus, successStatus, score }` or `{ cmiData: null }` if no prior progress. Uses `.maybeSingle()` so missing rows return null instead of an error.

### Logging

All SCORM API console logging is gated behind `NODE_ENV === "development"` via `scormLog()` / `scormWarn()` helper functions. No SCORM debug output in production.

---

## 6. Quiz & Exam Engine

### Overview

Practice Exams and Final Exams are **NOT delivered via SCORM**. They are built natively using the `question_bank` table and the `<QuizEngine>` component.

Section quizzes can be either SCORM-based (with `scorm_entry_path`) or native. When native (no `scorm_entry_path`), they use the same quiz engine.

### Question Loading (`src/app/api/quiz/start/route.ts`)

**POST /api/quiz/start** — `{ type, courseId, sectionNumber? }`

**Input validation:**
- `sectionNumber` must be a non-negative integer when `type === "section_quiz"`.

**For section quizzes (`type: "section_quiz"`):**
1. Verifies all lesson modules in the section are completed.
2. Gets lesson module titles from the section — these are used as topic keys.
3. Fetches questions from `question_bank` where `exam_type` is `"practice"` or `"both"` and the course matches.
4. Filters by topic using case-insensitive matching against section lesson titles.
5. Shuffles and limits to **10 questions**.

**For practice exams (`type: "practice"`):**
1. Verifies all course modules are completed (all sections done).
2. Fetches questions with `exam_type` in `["practice", "both"]`.
3. Shuffles and limits to **50 questions**.

**For final exams (`type: "final"`):**
1. Same prerequisite check as practice exams.
2. Fetches questions with `exam_type` in `["final", "both"]`.
3. Shuffles and limits to **85 questions**.

Questions are fetched via admin client (service role) because `question_bank` RLS restricts access to service role only — this prevents students from reading `correct_index` directly.

**Returns:** `{ questions: [{ id, question_text, options, topic }] }` — note that `correct_index` is NOT included.

### QuizEngine Component (`src/components/dashboard/QuizEngine.tsx`)

A single-question-at-a-time interface:
- Progress bar showing question X of Y.
- Answer options A–D with selection highlighting.
- Previous/Next navigation and question navigator dots.
- Submit button on the last question (requires all questions answered).
- Tracks elapsed time from mount: `Math.round((Date.now() - startTime) / 1000)`.

### Scoring & Submission (`src/app/api/quiz/submit/route.ts`)

**POST /api/quiz/submit** — `{ type, courseId, sectionNumber?, answers, timeSpentSeconds }`

**Validation:**
- `type` must be one of `["section_quiz", "practice", "final"]`.
- Each answer must have `questionId` (string) and `selectedIndex` (number).

**Grading:**
1. Fetches full question data (including `correct_index`, `explanation`) from `question_bank` via admin client.
2. Compares each `selectedIndex` to `correct_index`.
3. Calculates: `score = Math.round((correctAnswers / totalQuestions) * 100)`.
4. Pass thresholds:
   - Section quiz: >= 70%
   - Practice exam: >= 80% (for display label only)
   - Final exam: >= 70%
5. Builds per-topic breakdown: `{ topic, correct, total, percentage }`.

**Storage:**

For **section quizzes**:
- Finds the quiz module in the section.
- Fetches existing `time_spent_seconds` and adds the new time (accumulated across retakes).
- Upserts `module_progress` — only marks as "completed" if passed, otherwise "in_progress".
- On pass: sends `sectionCompletedEmail()`.

For **practice and final exams**:
- Inserts an `exam_attempts` row with: score, total_questions, correct_answers, passed, time_spent_seconds, and full answer data as JSON.
- On final exam pass: sends `finalExamPassedEmail()`.

**Time logging:** Inserts a `time_logs` row with source `"quiz"`, `"practice_exam"`, or `"final_exam"`. Capped at 4 hours.

**Returns:** `{ score, passed, totalQuestions, correctAnswers, results, topicBreakdown }`

The `results` array includes each question with the student's answer, correct answer, explanation, and topic — this powers the review screen in QuizEngine.

### Page-Level Access Control

| Page | File | Prerequisites |
|------|------|---------------|
| Section Quiz | `src/app/dashboard/courses/[courseId]/quiz/[sectionNumber]/page.tsx` | Section unlocked + all lessons in section completed |
| Practice Exam | `src/app/dashboard/courses/[courseId]/practice-exam/page.tsx` | `canTakeFinalExam` (all sections complete) |
| Final Exam | `src/app/dashboard/courses/[courseId]/final-exam/page.tsx` | `canTakeFinalExam` (all sections complete) |

All pages redirect to the course detail page if prerequisites aren't met.

---

## 7. Time Tracking

### How Seat Time Is Recorded

Time is tracked from two sources:

**1. SCORM module sessions** (`source: "scorm"`):
- Elapsed time calculated client-side: `Date.now() - sessionStartRef.current`.
- Sent to `/api/scorm/save` with `isFinal: true` on Terminate, close, or tab close.
- Server caps at 4 hours (14,400 seconds) per session.
- A `time_logs` row is created with `started_at` (back-calculated), `ended_at`, and `duration_seconds`.
- `module_progress.time_spent_seconds` is incremented by the capped session time.

**2. Quiz/exam sessions** (`source: "quiz"`, `"practice_exam"`, or `"final_exam"`):
- Elapsed time calculated client-side in QuizEngine: `Math.round((Date.now() - startTime) / 1000)`.
- Sent to `/api/quiz/submit` as `timeSpentSeconds`.
- Server caps at 4 hours (14,400 seconds).
- A `time_logs` row is created.
- For section quizzes: `module_progress.time_spent_seconds` is accumulated across retakes.

### 4-Hour Session Cap

Both the SCORM save route and quiz submit route enforce a maximum of 14,400 seconds per session:

```js
const MAX_SESSION_SECONDS = 14400;
const cappedTime = Math.min(Math.floor(rawTime), MAX_SESSION_SECONDS);
```

The SCORM save route also validates the input is a positive finite number:
```js
const rawSessionTime =
  typeof sessionTimeSeconds === "number" &&
  Number.isFinite(sessionTimeSeconds) &&
  sessionTimeSeconds > 0
    ? sessionTimeSeconds
    : 0;
```

### time_logs Audit Trail

The `time_logs` table is the immutable audit trail for Florida DFS compliance:

| Column | Type | Notes |
|--------|------|-------|
| `enrollment_id` | uuid | FK to enrollments |
| `module_id` | uuid | nullable (null for exam time) |
| `started_at` | timestamptz | Session start |
| `ended_at` | timestamptz | Session end |
| `duration_seconds` | integer | Capped session duration |
| `source` | text | `"scorm"`, `"quiz"`, `"practice_exam"`, `"final_exam"`, or `"upgrade:*"` |

**Immutability:** The table has RLS policies for SELECT and INSERT only — no UPDATE or DELETE policies exist. Records are never modified or removed.

**Retention:** Records are retained for 3+ years per Florida DFS requirements.

### 30-Hour Requirement for Florida DFS

The total seat time for an enrollment is calculated as:
```sql
SELECT SUM(duration_seconds) FROM time_logs WHERE enrollment_id = $1
```

This is compared against `courses.required_hours * 3600` (30 hours = 108,000 seconds for FL Life).

The seat time progress is displayed on the course detail page as a progress bar with "X.X / 30h" format.

Course completion is blocked until this requirement is met — it's one of the 5 prerequisites checked by the affidavit and certificate routes.

---

## 8. Completion Flow

### The 5 Prerequisites

All 5 conditions must be true before a student can receive their certificate:

| # | Requirement | How It's Checked |
|---|-------------|-----------------|
| 1 | All SCORM modules completed | Every `module_progress` row has `status = "completed"` |
| 2 | All section quizzes passed | Every quiz module's `module_progress` has `success_status = "passed"` |
| 3 | Final exam passed (>= 70%) | At least one `exam_attempts` row with `exam_type = "final"` and `passed = true` |
| 4 | 30 hours of seat time | `SUM(time_logs.duration_seconds) >= courses.required_hours * 3600` |
| 5 | Self-study affidavit signed | `enrollments.affidavit_accepted_at IS NOT NULL` |

These are validated independently by:
- `src/lib/course-data.ts` — `getCourseDetail()` computes boolean flags for the UI
- `src/app/api/affidavit/route.ts` — validates prerequisites 1–4 before allowing signing
- `src/app/api/certificates/route.ts` — validates all 5 prerequisites before generating

### Step 1: Affidavit Page

**Route:** `/dashboard/courses/[courseId]/affidavit` (`src/app/dashboard/courses/[courseId]/affidavit/page.tsx`)

**Access control:** Server-side checks:
- `allSectionsComplete` — all modules done
- `finalExamPassed` — final exam passed
- `meetsHourRequirement` — 30 hours met
- `!hasAffidavit` — not already signed (redirects to certificate page if already signed)

### Step 2: Affidavit Form (`src/components/dashboard/AffidavitForm.tsx`)

The form presents 5 numbered attestation points:
1. Personal completion of all course modules
2. No unauthorized assistance
3. Total hours logged accurately
4. Understanding of penalties for false statements
5. Knowledge of audit records and potential regulatory disclosure

The student must:
- Check an "I agree" checkbox
- Type their full name (digital signature, min 2 characters)
- Click "Sign & Submit"

### Step 3: Affidavit API (`src/app/api/affidavit/route.ts`)

**POST /api/affidavit** — `{ enrollmentId, typedName }`

Validation:
- `typedName` must be non-empty and <= 200 characters.
- Verifies enrollment ownership.
- Checks affidavit not already signed (409 if duplicate).
- Validates all 5 prerequisites except #5 (this IS step 5).

**Special for L12:** Also verifies quiz modules have `success_status === "passed"`, not just `status === "completed"`.

Records:
```sql
UPDATE enrollments SET
  affidavit_accepted_at = now(),
  affidavit_ip = <x-forwarded-for>,
  affidavit_user_agent = <user-agent>,
  affidavit_typed_name = <trimmed name>
WHERE id = $1
```

Uses admin client (service role) because enrollment updates are restricted to service role via RLS.

### Step 4: Certificate Page

**Route:** `/dashboard/courses/[courseId]/certificate` (`src/app/dashboard/courses/[courseId]/certificate/page.tsx`)

Displays:
- Congratulations header
- Certificate preview card (number, student name, program, hours, date)
- `<CertificateActions>` component for generate/download
- Completion checklist (all 5 prerequisites + certificate generated)
- Next steps: schedule state exam (Pearson VUE), fingerprinting (FieldPrint), get appointed

### Step 5: Certificate Generation (`src/app/api/certificates/route.ts`)

**POST /api/certificates** — `{ enrollmentId }`

1. **Validates all 5 prerequisites** (affidavit signed, final exam passed, seat time met, all modules completed, all quizzes passed).

2. **Idempotency:** Checks if a certificate already exists for this enrollment. If so, returns the existing record.

3. **Generates certificate number:** `TP4U-{STATE}-{TYPE}-{YEAR}-{8-DIGIT-SERIAL}`
   - Example: `TP4U-FL-LIFE-2026-48291037`
   - Retries up to 3 times on collision with existing numbers.

4. **Generates PDF** using `pdfkit`:
   - Letter size, landscape orientation
   - Navy double border with blue accent lines
   - "TESTPREP4U" header
   - "Certificate of Completion" title
   - Student name (28pt)
   - Program name (mapped from course type):
     - `life` → "Florida 2-14 Life Including Annuities & Variable Contracts Pre-Licensing"
     - `health` → "Florida 2-15 Health Insurance Pre-Licensing"
     - `combined` → "Florida 2-15 Life, Health & Variable Annuity Pre-Licensing"
   - Total hours completed, completion date, certificate number
   - Footer disclaimer: "This certificate confirms completion of the pre-licensing course. It does not constitute an insurance license."

5. **Uploads PDF** to Supabase Storage bucket `certificates` at path `{userId}/{enrollmentId}.pdf`.

6. **Inserts certificate record:**
   ```sql
   INSERT INTO certificates (enrollment_id, certificate_number, issued_at, hours_completed, pdf_url)
   VALUES ($1, $2, $3, $4, $5)
   ```

7. **Updates enrollment status:**
   ```sql
   UPDATE enrollments SET status = 'completed', completed_at = $1 WHERE id = $2
   ```

8. **Sends `certificateReadyEmail()`** with certificate number and next steps.

### Step 6: Certificate Download (`src/app/api/certificates/download/route.ts`)

**GET /api/certificates/download?enrollmentId=...**

1. Verifies enrollment ownership.
2. Fetches `pdf_url` from `certificates` table.
3. Generates a signed URL from Supabase Storage (valid for 1 hour).
4. Returns `{ url: "https://..." }`.

The `<CertificateActions>` client component creates a temporary `<a>` element and triggers the download with filename "TestPrep4U-Certificate.pdf".

---

## 9. Upgrade Flow

### How Upgrades Are Initiated

On the Settings page (`src/app/dashboard/settings/page.tsx`), if the user isn't on the highest tier, the `<UpgradeSection>` component displays available upgrade options.

**Upgrade options are computed server-side:**
- Tier rank: `{ essentials: 1, pro: 2, premium: 3 }`
- Only tiers with a higher rank than the current tier are shown.
- For each option, calculates:
  - `priceDifference` = target price - current price (from `PRICING_TIERS`)
  - `additionalMonths` = target months - current months
  - `newExpiresAt` = current expiration + additional months

### UpgradeSection Component (`src/components/dashboard/UpgradeSection.tsx`)

For each upgrade option, shows:
- Tier name and tagline
- New features (features in target tier not in current)
- Additional months badge with new expiration date
- Price difference with calculation breakdown (e.g., "Pro ($219) - Essentials ($179)")
- "Pay ${difference} to upgrade" button

### Upgrade API Route (`src/app/api/upgrade/route.ts`)

**POST /api/upgrade** — `{ targetTier, courseType, enrollmentId }`

1. Authenticates user.
2. Verifies enrollment exists, belongs to user, and is active.
3. Validates target tier is higher than current tier.
4. Calculates prorated price difference.
5. Creates a Stripe Checkout Session with `price_data` (not a pre-set Price ID) for the difference amount:
   ```
   line_items[0].price_data.unit_amount = priceDifference * 100  (cents)
   product_data.name = "Upgrade from {Old} to {New}"
   ```
6. Metadata includes: `upgrade: "true"`, `enrollment_id`, `old_tier`, `tier` (new), `user_id`, `course_type`.
7. Success URL: `/dashboard/settings?upgrade=success`
8. Cancel URL: `/dashboard/settings?upgrade=cancelled`

### Upgrade Webhook Handler

When the Stripe webhook receives a `checkout.session.completed` with `metadata.upgrade === "true"`:

1. **Idempotency:** Checks `time_logs` for an entry with `source = "upgrade:{sessionId}"`.

2. **Ownership verification:** Confirms `enrollment.user_id` matches `metadata.user_id`.

3. **Extends expiration:**
   ```js
   const oldMonths = TIER_ACCESS_MONTHS[oldTier];  // e.g., 6
   const newMonths = TIER_ACCESS_MONTHS[newTier];   // e.g., 9
   const additionalMonths = newMonths - oldMonths;  // e.g., 3
   // Add additionalMonths to current expires_at (with month overflow clamping)
   ```

4. **Updates:**
   - `enrollments.expires_at` — extended by the month difference
   - `profiles.plan_tier` — updated to new tier
   - `profiles.stripe_customer_id` — updated if available

5. **Writes idempotency marker:** Inserts a `time_logs` row with `duration_seconds: 0` and `source: "upgrade:{sessionId}"`.

---

## 10. Email System

### All 7 Email Templates (`src/lib/emails.ts`)

| # | Template | Trigger | Subject |
|---|----------|---------|---------|
| 1 | `welcomeEmail(name)` | Email confirmation callback (new user) | "Welcome to TestPrep4U — Let's Get You Licensed!" |
| 2 | `enrollmentEmail({name, courseName, tier, accessMonths, expiresAt})` | Stripe webhook: enrollment created | "You're Enrolled — {courseName}" |
| 3 | `sectionCompletedEmail({name, sectionTitle, sectionNumber, score, totalSections, completedSections, courseSlug})` | Quiz submit: section quiz passed | "Section {N} Complete — {score}%!" |
| 4 | `finalExamPassedEmail({name, score, courseName, courseSlug})` | Quiz submit: final exam passed | "You Passed the Final Exam! — {score}%" |
| 5 | `certificateReadyEmail({name, courseName, certificateNumber, courseSlug})` | Certificate generated | "Your Completion Certificate Is Ready!" |
| 6 | `contactNotificationEmail({name, email, subject, message})` | Contact form submitted (sent to support) | "[Contact Form] {subject} — from {name}" |
| 7 | `contactConfirmationEmail(name)` | Contact form submitted (sent to user) | "We Received Your Message — TestPrep4U" |

### Email Contents

**Welcome (#1):** Greeting, 4-step onboarding guide, "Browse Courses" CTA to `/pricing`.

**Enrollment (#2):** Confirmation with details table (program, plan, access period, expiration), "Go to Your Dashboard" CTA.

**Section Complete (#3):** Score badge, visual progress bar showing sections completed, "What's next?" guidance, "Continue Studying" CTA.

**Final Exam Passed (#4):** Celebration emoji, score, "Next Step: Sign the Self-Study Affidavit" guidance, "Sign Affidavit" CTA.

**Certificate Ready (#5):** Trophy emoji, certificate number in monospace font, "Download Certificate" CTA, 3 next steps (Pearson VUE, FieldPrint, appointment).

**Contact Notification (#6):** Contact details table + full message. Subject line strips newlines to prevent header injection.

**Contact Confirmation (#7):** "Thanks for reaching out" + "within one business day" promise + FAQ link.

### Resend Setup (`src/lib/resend.ts`, `src/lib/send-email.ts`)

**Client initialization:**
```js
getResend() → new Resend(process.env.RESEND_API_KEY)
```
Throws a clear error if `RESEND_API_KEY` is not set.

**Sending:**
```js
sendEmail({ to, subject, html, replyTo? })
```
- Fire-and-forget: does not `await` the result.
- Errors are caught and logged to console (never block the API response).
- `from` address: `"TestPrep4U <noreply@testprep4u.com>"`
- Contact form emails use `await` (not fire-and-forget) since they're the primary response.

### XSS Prevention

The `esc()` function escapes all dynamic content in templates:
```js
function esc(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

The `button()` helper escapes both text and href. All user-provided values (names, email addresses, course names) are escaped before insertion into HTML.

Contact form email subject additionally strips newlines: `.replace(/[\r\n]+/g, " ").trim()`.

---

## 11. Security

### RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Own row (`auth.uid() = id`) | Own row | Own row | — |
| `courses` | Public (`active = true`) | — | — | — |
| `course_sections` | Public (`true`) | — | — | — |
| `course_modules` | Public (`true`) | — | — | — |
| `enrollments` | Own rows (`user_id = auth.uid()`) | Service role only | Service role only | — |
| `module_progress` | Own enrollment | Own enrollment | Own enrollment | — |
| `time_logs` | Own enrollment | Own enrollment | **None (immutable)** | **None (immutable)** |
| `exam_attempts` | Own enrollment | Own enrollment | — | — |
| `question_bank` | **Service role only** | — | — | — |
| `certificates` | Own enrollment | Service role only | — | — |

**Key restrictions:**
- Students cannot read `question_bank` directly (prevents reading `correct_index`).
- Students cannot create enrollments (only Stripe webhook via service role).
- Students cannot update enrollments (only service role — affidavit, completion).
- `time_logs` are immutable — no update or delete policies.
- Certificate inserts are service role only.

### Auth Checks on API Routes

Every API route (except the Stripe webhook) follows this pattern:
```js
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

Additionally, routes that operate on enrollment data verify ownership:
```js
const { data: enrollment } = await supabase.from("enrollments")...
if (!enrollment || enrollment.user_id !== user.id) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

The Stripe webhook verifies the `stripe-signature` header:
```js
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
```

### Input Validation

| Route | Validation |
|-------|-----------|
| `/api/quiz/start` | `sectionNumber` must be non-negative integer; `type` is implicitly validated by branching |
| `/api/quiz/submit` | `type` must be in `["section_quiz", "practice", "final"]`; each answer must have `questionId` (string) and `selectedIndex` (number) |
| `/api/scorm/save` | `sessionTimeSeconds` validated as positive finite number; capped at 14,400s; score kept in 0–100 range |
| `/api/user/profile` | `fullName` 1–100 chars; `phone` ≤ 20 chars; `state` must be in `["FL"]` |
| `/api/affidavit` | `typedName` max 200 characters |
| `/api/contact` | Name max 200, subject max 300, message max 5000; email format regex; all fields required |
| `/api/checkout` | `tier` and `courseType` validated against allowed values |
| `/api/upgrade` | Target tier must be higher rank than current; enrollment must be active |

### Rate Limiting

- **Contact form** (`src/app/api/contact/route.ts`): In-memory rate limiter — 1 submission per email per 60 seconds. Stale entries cleaned every 5 minutes.
- Other routes rely on Supabase Auth's built-in rate limiting for login attempts.

### Security Headers (`next.config.ts`)

Applied to all routes via `headers()`:
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

Note: `X-Frame-Options` is set to `SAMEORIGIN` (not `DENY`) to allow SCORM content to load in iframes within the platform.

### Additional Security Measures

- **Admin client isolation** (`src/lib/supabase/server.ts`): Uses `createClient` from `@supabase/supabase-js` (not `createServerClient` from `@supabase/ssr`) — no cookie handling, no session auto-refresh, no session persistence.
- **Open redirect prevention** in auth callback: `next` param must start with `/` and not `//`.
- **Score preservation:** SCORM save route never downgrades completed status or passed status.
- **Time manipulation prevention:** Session time capped at 4 hours; server-side enforcement.
- **Webhook idempotency:** `stripe_session_id` unique index prevents duplicate enrollments; upgrade handler uses `time_logs` entry as idempotency marker.
- **Certificate number collision:** Generates 8-digit random serial with up to 3 retries on collision.
- **Environment variable guards:** `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` throw clear errors if missing.
- **Robots blocked:** `public/robots.txt` disallows all crawlers and root layout metadata sets `noindex, nofollow` until launch.

---

## 12. Infrastructure

### Supabase

**Auth:**
- Email/password authentication via `@supabase/ssr` for cookie-based sessions.
- Email confirmation required before first login.
- Password reset via Supabase auth flow.
- Profile auto-creation via database trigger on `auth.users` insert.

**Database (PostgreSQL):**
- 10 tables with Row Level Security on all.
- Foreign key cascades on delete for data cleanup.
- Unique constraints for idempotency (`stripe_session_id`, `certificate_number`, `enrollment_id + module_id`).
- CHECK constraints on enum-like columns (`status`, `module_type`, `exam_type`, etc.).

**Storage:**
- `scorm-packages` bucket — SCORM course files (private, authenticated read).
- `certificates` bucket — generated certificate PDFs (private, user reads own folder via `storage.foldername(name)[1] = auth.uid()`).

### Stripe

**Payments:**
- One-time payment via Stripe Checkout Sessions (`mode: "payment"`).
- 9 pre-configured Price IDs (3 tiers x 3 course types).
- Upgrade payments use dynamic `price_data` for the prorated difference.

**Webhooks:**
- Single endpoint: `POST /api/webhooks/stripe`.
- Handles `checkout.session.completed` event.
- Routes to new enrollment creation or upgrade handler based on `metadata.upgrade` flag.
- Signature verification via `STRIPE_WEBHOOK_SECRET`.
- Idempotent via `stripe_session_id` unique index.

### Resend

**Email delivery:**
- Singleton Resend client initialized with `RESEND_API_KEY`.
- From address: `TestPrep4U <noreply@testprep4u.com>`.
- 7 HTML email templates with inline styles for compatibility.
- Fire-and-forget pattern (non-blocking) for transactional emails.
- Contact form emails use `await` for reliable delivery.

### Vercel

**Hosting:**
- Next.js 16 App Router deployed via GitHub auto-deploy.
- GitHub org: `wyatt-thedigitalwash`.
- Branch: `main` (auto-deploys on push).
- Server-side rendering for dashboard pages (auth checks, data fetching).
- API routes run as serverless functions.

### Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase admin key (bypasses RLS) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client + Server | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Server only | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signature secret |
| `RESEND_API_KEY` | Server only | Resend email API key |
| `NEXT_PUBLIC_SITE_URL` | Client + Server | Site URL for email links (default: `https://www.testprep4u.com`) |

All values are configured in Vercel environment settings. `NEXT_PUBLIC_` variables are exposed to the browser bundle. All others are server-only.

### Missing Environment Variable Guards

- `RESEND_API_KEY` — `getResend()` throws `"RESEND_API_KEY environment variable is not set"`.
- `STRIPE_SECRET_KEY` — `getStripe()` throws `"STRIPE_SECRET_KEY environment variable is not set"`.
- `STRIPE_WEBHOOK_SECRET` — webhook route returns 500 with `"Server misconfiguration"`.
