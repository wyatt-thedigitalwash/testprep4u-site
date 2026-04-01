# CLIENT_JOURNEY.md — How TestPrep4U Works

A plain-English walkthrough of the entire TestPrep4U platform experience, from first visit to certificate in hand.

---

## Table of Contents

1. [The Marketing Site](#1-the-marketing-site)
2. [Signing Up and Paying](#2-signing-up-and-paying)
3. [The Student Dashboard](#3-the-student-dashboard)
4. [Working Through the Course](#4-working-through-the-course)
5. [Quizzes and Exams](#5-quizzes-and-exams)
6. [Time Tracking](#6-time-tracking)
7. [Finishing the Course](#7-finishing-the-course)
8. [Upgrading Your Plan](#8-upgrading-your-plan)
9. [Emails Along the Way](#9-emails-along-the-way)
10. [Behind the Scenes](#10-behind-the-scenes)

---

## 1. The Marketing Site

### What a Visitor Sees

When someone lands on testprep4u.com, they see a public marketing site designed to explain what the platform offers and convert them into a student. The homepage walks them through several sections in order:

1. **Hero** — A full-screen navy banner with the main headline, key stats, and two call-to-action buttons ("Start Learning Now" and "Get Started").

2. **Feature Grid** — Six cards highlighting what makes the platform different (online and on-demand, state-specific content, structured learning, smart practice exams, study community, career-focused).

3. **Our Courses** — Three cards for the available courses: Florida Life Insurance, Florida Health Insurance, and Florida Life & Health Combined. Each card shows estimated hours, number of chapters, and a link to the course's product page.

4. **How It Works** — Three numbered steps explaining the process: pick your course, study at your own pace, pass and get licensed.

5. **Pass Guarantee** — A gradient banner explaining the first-time pass guarantee (available on Pro and Premium plans).

6. **After You Pass** — Three steps explaining what happens after the student passes the course exam: schedule the state exam, complete fingerprinting, and get appointed by an insurance company.

7. **Quick Facts** — Statistics about insurance licensing (national pass rates, exam details, study hours).

8. **FAQ Preview** — Seven common questions in an accordion format with a link to the full FAQ page.

9. **Bottom CTA** — A final navy banner encouraging visitors to get started.

### Other Marketing Pages

Beyond the homepage, visitors can browse:

- **Course product pages** — Dedicated pages for Life, Health, and Combined courses with detailed descriptions, curriculum outlines, and pricing.
- **How to Get Your Insurance License** — A six-step guide to the licensing process.
- **Pricing** — Side-by-side comparison of the three plans (Essentials, Pro, Premium) with a toggle to switch between course types.
- **About** — The story behind TestPrep4U.
- **FAQ** — Full searchable FAQ with structured data for search engines.
- **Contact** — A contact form that sends an email to the support team and a confirmation to the visitor.
- **Florida State Page** — State-specific information about Florida insurance licensing requirements.

### The Navbar

The navigation bar at the top is sticky and changes slightly based on whether the visitor is logged in:

- **Not logged in:** Shows "Log In" and a "Get Started" button that links to the pricing page.
- **Logged in:** The "Get Started" button changes to "Dashboard" and links directly to the student's dashboard.

---

## 2. Signing Up and Paying

### The Typical Journey

Most users first land on the pricing page (either directly or by clicking a CTA elsewhere on the site). Here's what happens step by step:

1. **They pick a plan.** The pricing page shows three tiers side by side. They can toggle between Life, Health, and Combined courses at the top. Each tier card shows the price, what's included, and a "Get Started" button. The course name (e.g., "Florida Life Insurance") appears below the price so it's clear which course they're buying.

2. **They click "Get Started."** Since they're not logged in yet, the platform saves their chosen plan and course, then sends them to the signup page.

3. **They create an account.** The signup form asks for their full name, email, password, and state (currently Florida only). There's a show/hide toggle on the password field. If they landed here by accident, there's a "Back to website" link at the bottom.

4. **They confirm their email.** After submitting the signup form, they see a "Check your email" screen. They need to click the confirmation link in their inbox before they can log in. The confirmation link remembers what plan and course they were trying to buy.

5. **They're redirected to checkout.** After clicking the email link, the platform logs them in and takes them back to the pricing page. Instead of showing the pricing cards again, it shows a branded loading screen ("Setting up your course...") and automatically starts the Stripe checkout process. This avoids any confusing flash of the pricing page.

6. **They pay on Stripe.** Stripe handles the actual payment on its own secure checkout page. It's a one-time payment (not a subscription).

7. **They land on their dashboard.** After paying, Stripe sends them back to their new student dashboard with a success message.

### What Happens Behind the Scenes During Payment

When Stripe processes the payment, it sends a notification back to TestPrep4U. The platform then:

- Creates an enrollment record for the student, linking them to the course they bought.
- Sets an access expiration date based on their plan (Essentials = 6 months, Pro = 9 months, Premium = 12 months).
- Saves their payment information for future reference.
- Sends them an enrollment confirmation email with their course details and access period.

This process is designed to only create one enrollment per payment, even if Stripe sends the notification more than once.

### Pricing

| Plan | Life / Health | Combined | Access Period |
|------|--------------|----------|---------------|
| Essentials | $149 | $179 | 6 months |
| Pro | $219 | $259 | 9 months |
| Premium | $319 | $369 | 12 months |

All plans include the same core course content. Higher tiers add study tools, more practice exams, support options, and longer access.

### Returning Users

If someone already has an account:

- **Logging in with a plan selected:** If they chose a plan on the pricing page first, they'll be taken straight to checkout after logging in.
- **Logging in without a plan:** The platform checks if they have any active enrollments. If yes, they go to the dashboard. If no, they go to the pricing page.

### Password Issues

- **Forgot password:** They enter their email on the forgot-password page, receive a reset link, and set a new password. Both password fields on the reset page have show/hide toggles.
- **Expired or invalid links:** If a confirmation or reset link has expired, the platform shows a friendly error message on the login page (e.g., "This link has expired. Please try again.") instead of a confusing error.
- **Unconfirmed email:** If someone tries to log in before confirming their email, the login page shows an error and a "Resend confirmation email" button.

---

## 3. The Student Dashboard

### What Students See When They Log In

The dashboard is a completely separate experience from the marketing site — it has its own layout with a sidebar navigation on the left and no marketing header or footer.

**Welcome Section:** A personalized greeting ("Welcome back, Alex") at the top.

**Quick Stats:** Three numbers at a glance:
- **Study Hours** — Total time spent studying across all courses.
- **Practice Exam Average** — Their average score on practice exams (or "—" if they haven't taken any yet).
- **Courses Enrolled** — How many courses they're signed up for.

**Milestone Callout:** A blue banner reminding them about the pass guarantee requirement ("Score 80%+ on 3 practice exams to qualify for the Pass Guarantee").

**Course Cards:** Each enrolled course appears as a card showing the course type (Life, Health, or Combined), the course name, enrollment and expiration dates, and a button that says either "Start Course" (if they haven't begun) or "Continue Course" (if they have).

**No Courses?** If they don't have any enrollments, the dashboard shows a message with a link to the pricing page.

### Sidebar Navigation

The left sidebar has four main navigation items:

| Item | What It Does |
|------|-------------|
| Dashboard | The main overview page described above |
| My Courses | A grid of all enrolled courses with the same Start/Continue logic |
| Practice Exams | Shows available practice exams (locked until course sections are complete) |
| Settings | Profile and account management |

On mobile, the sidebar becomes a slide-in drawer accessed via a hamburger menu.

A logout button at the bottom of the sidebar opens a confirmation dialog before signing out.

### Settings Page

The settings page has several sections:

- **Profile:** Students can edit their name, phone number, and state by clicking a pencil icon. Email is read-only (it's tied to their login). Changes save immediately.
- **Subscription:** Shows their current plan tier, status, enrollment date, expiration date, and a list of features included in their plan.
- **Upgrade:** If they're not on the highest tier, they'll see upgrade options here (more on this in Section 8).
- **Support:** A link to the contact page (opens in a new tab).

---

## 4. Working Through the Course

### How the Course Is Organized

The FL Life Insurance course (as an example) is a 30-hour program organized into sections:

| Section | Title | Contents |
|---------|-------|----------|
| 0 | Course Introduction | 1 lesson |
| 1 | General Insurance Concepts | 4 lessons + 1 quiz |
| 2 | Life Insurance Products | 7 lessons + 1 quiz |
| 3 | Social Security & Retirement | 3 lessons + 1 quiz |
| 4 | Florida Laws & Rules | 3 lessons + 1 quiz |
| 5 | Exam Preparation | 2 lessons |
| — | Practice Exam | Unlimited retakes |
| — | Final Exam | Must pass with 70%+ |

Each lesson is a self-contained learning module built with Articulate Rise 360 (an industry-standard e-learning tool). They load inside the platform in a full-screen viewer.

### How Students Progress

The course is strictly sequential — students can't skip ahead:

1. **Within a section:** They must complete each lesson in order. Lesson 2 doesn't unlock until Lesson 1 is done.
2. **Between sections:** Each section (except the Introduction and Exam Prep) ends with a quiz. They must score at least 70% on the quiz to unlock the next section. They can retake quizzes as many times as they need.
3. **Practice Exam:** Unlocks after all sections (0–5) are complete. Not required to pass, but highly recommended.
4. **Final Exam:** Also unlocks after all sections are complete. Must pass with 70% or higher. Unlimited retakes.

### The Course Detail Page

When a student clicks into a course, they see:

- **Progress overview:** A circular progress indicator and a seat time tracker showing how many hours they've logged out of the 30 required.
- **Section accordion:** Each section is expandable. Locked sections show a lock icon. Inside each section, every lesson and quiz shows its status (Not Started, In Progress, Done, or Locked), time spent, and score (for quizzes).
- **Final Exam card:** At the bottom, showing whether the student has met the prerequisites to take it.

### What Happens When They Open a Lesson

Clicking on an unlocked lesson opens a full-screen viewer with the lesson content. The student sees:

- The lesson content filling the screen (text, images, interactive elements from Articulate Rise).
- A close button and fullscreen toggle in the top bar.

The lesson content automatically tracks the student's progress. If they close the lesson partway through, their spot is saved — they'll pick up right where they left off next time.

### What Happens When They Finish a Lesson

When a lesson is completed:

1. The platform saves their progress instantly in the background (no waiting).
2. They're immediately taken back to the course detail page.
3. A green "Chapter completed!" banner appears briefly at the top (disappears after 3 seconds).
4. The next available lesson is automatically highlighted with a blue outline, and the page scrolls to it so they can jump right in.
5. If the next lesson is in a new section, that section automatically expands.

There's no summary screen or extra clicks between finishing one lesson and starting the next — the flow is designed to keep momentum.

### Saving and Resuming

- Progress saves automatically every ~20 seconds while the lesson is open.
- When the student finishes or closes a lesson, a final save captures everything.
- If the student closes the browser tab or navigates away unexpectedly, the platform attempts to save their progress one last time.
- When they return to a lesson later, it resumes exactly where they left off — same scroll position, same progress state.

---

## 5. Quizzes and Exams

### Three Types of Assessments

The platform has three kinds of tests, and they work slightly differently:

**1. Section Quizzes (after each section)**
- Delivered as part of the course content (same Articulate Rise format as lessons).
- Must score 70% or higher to pass.
- Unlimited retakes.
- Passing unlocks the next section.
- Student receives an email when they pass a section quiz.

**2. Practice Exams**
- Built directly into the platform (not in the Articulate Rise format).
- Available after completing all course sections.
- 50 questions drawn randomly from the question bank.
- Unlimited retakes — designed for repetition and improvement.
- Shows detailed explanations after each question.
- Provides a topic breakdown showing strong and weak areas.
- No passing requirement, but 80% is the recommended target.

**3. Final Exam (Course Exam)**
- Also built directly into the platform.
- Available after completing all course sections.
- 85 questions drawn from the question bank.
- Must score 70% or higher to pass.
- Unlimited retakes.
- Passing triggers an email and unlocks the completion process.

### How the Quiz Interface Works

For practice and final exams, students see:
- One question at a time with four answer options (A–D).
- A progress bar showing which question they're on.
- Previous/Next navigation buttons.
- A question navigator showing all questions at a glance (answered vs. unanswered).
- A submit button on the last question (only enabled when all questions are answered).

After submitting, they see their score, whether they passed, and a full review with:
- Each question with their answer and the correct answer.
- An explanation for each question.
- A topic breakdown showing how they performed in each subject area.

### Questions and Security

The question bank is stored securely. Students never see the correct answers until after they submit — the platform only sends the questions to the browser, grades everything on the server, and then returns the results.

---

## 6. Time Tracking

### Why It Matters

Florida's Department of Financial Services requires students to complete a minimum number of study hours before they can receive their completion certificate. For the Life Insurance course, that's 30 hours.

TestPrep4U tracks every minute of study time to satisfy this requirement.

### How It Works

Time is tracked automatically from two sources:

1. **Lesson time:** The clock starts when a student opens a lesson and stops when they close it or finish it. This happens automatically — the student doesn't need to do anything.

2. **Quiz/exam time:** The clock runs from when the student starts a quiz or exam until they submit it.

### What Students See

On the course detail page, there's a progress bar showing something like "12.5 / 30 hours" — how many hours they've logged out of the required total.

### Safeguards

- **Maximum session length:** No single study session can count for more than 4 hours. This prevents accidental over-counting if someone leaves a lesson open overnight.
- **Permanent records:** Every study session is logged individually and can never be edited or deleted. This creates an audit trail that satisfies Florida's record-keeping requirements (records are kept for at least 3 years).
- **Course completion is blocked** until the student has logged enough total hours. Even if they've passed every quiz and the final exam, they can't get their certificate until the hour requirement is met.

---

## 7. Finishing the Course

### The Five Requirements

To complete the course and receive a certificate, a student must satisfy all five of these:

| # | Requirement | What It Means |
|---|-------------|--------------|
| 1 | All lessons completed | Every lesson in every section must be finished |
| 2 | All section quizzes passed | Each section quiz must be passed with 70%+ |
| 3 | Final exam passed | Score 70% or higher on the final exam |
| 4 | 30 hours of study time | Total logged time must meet Florida's requirement |
| 5 | Self-study affidavit signed | Student must certify they personally completed all work |

### The Affidavit

Once the first four requirements are met, the student can access the self-study affidavit page. This is a legal attestation where the student confirms:

1. They personally completed all course modules.
2. They didn't receive unauthorized assistance.
3. Their logged study hours are accurate.
4. They understand the penalties for false statements.
5. They know their records may be subject to audit.

To sign, they check an "I agree" box and type their full name as a digital signature. The platform records the exact time, their IP address, browser information, and typed name for compliance purposes.

### The Certificate

After the affidavit is signed, the student can generate their completion certificate. The certificate includes:

- Their name
- The program name (e.g., "Florida 2-14 Life Including Annuities & Variable Contracts Pre-Licensing")
- Total hours completed
- Completion date
- A unique certificate number (e.g., TP4U-FL-LIFE-2026-48291037)

The certificate is generated as a PDF that they can download. It's also stored securely and can be re-downloaded at any time.

The student receives an email with their certificate number and next steps for getting their actual insurance license.

### After the Certificate

The certificate page also provides guidance on next steps:

1. **Schedule the state exam** through Pearson VUE (the testing provider).
2. **Complete fingerprinting** through FieldPrint.
3. **Get appointed** by an insurance company.

The completion certificate is proof of pre-licensing education — it's required to sit for the state licensing exam, but it's not the license itself.

---

## 8. Upgrading Your Plan

### How It Works

Students on Essentials or Pro can upgrade to a higher tier at any time from the Settings page. The upgrade section shows:

- What new features they'd get with the upgrade.
- How many additional months of access they'd receive.
- The price difference (they only pay the difference between what they already paid and the higher tier's price).
- A breakdown of the calculation (e.g., "Pro ($219) - Essentials ($149) = $70").

### The Upgrade Process

1. Student clicks the upgrade button on the Settings page.
2. They're taken to a Stripe checkout page showing just the price difference.
3. After paying, they're redirected back to Settings with a success banner.
4. Their plan tier is immediately updated.
5. Their access expiration date is extended by the difference in months (e.g., upgrading from Essentials to Pro adds 3 months to their current expiration).

---

## 9. Emails Along the Way

Students receive emails at key moments throughout their journey. All emails are branded with the TestPrep4U look and feel.

| When | Email | What It Says |
|------|-------|-------------|
| After confirming their email | **Welcome** | Greeting + 4-step onboarding guide + "Browse Courses" button |
| After purchasing a course | **Enrollment Confirmation** | Course name, plan tier, access period, expiration date, "Go to Dashboard" button |
| After passing a section quiz | **Section Complete** | Their score, a visual progress bar showing how far through the course they are, and what's next |
| After passing the final exam | **Final Exam Passed** | Celebration message, their score, and a prompt to sign the self-study affidavit |
| After generating their certificate | **Certificate Ready** | Certificate number, download link, and the three next steps (state exam, fingerprinting, appointment) |
| When they submit the contact form | **Contact Confirmation** (to them) | "We received your message" + response time expectation |
| When they submit the contact form | **Contact Notification** (to support) | The visitor's name, email, subject, and full message |

Emails are sent instantly and don't block whatever the student was doing — if the email fails to send for any reason, it doesn't affect the student's experience on the platform.

---

## 10. Behind the Scenes

This section covers how the platform stays secure and reliable. It's still non-technical, but covers things a stakeholder might want to know about.

### Account Security

- **Email verification required.** Nobody can access the platform without confirming their email address first.
- **Password security.** Passwords are handled entirely by Supabase (the authentication provider) — TestPrep4U never sees or stores passwords directly. Minimum 8 characters.
- **Session management.** Login sessions are maintained via secure cookies. The platform checks the session on every page load and logs users out if their session has expired.
- **Protected routes.** All dashboard pages require authentication. If someone tries to access a dashboard URL without being logged in, they're redirected to the login page.

### Data Protection

- **Row-level security.** Every student can only see their own data. Even if someone tried to manipulate requests, the database enforces that students can only read and write their own records.
- **Enrollment protection.** Students can't create their own enrollments — only the payment system can do that. This prevents anyone from getting free access.
- **Immutable audit trails.** Study time logs and exam attempts can never be edited or deleted, even by administrators. This satisfies Florida's regulatory requirements.
- **Question bank security.** The correct answers to quiz and exam questions are never sent to the student's browser. All grading happens on the server.

### Payment Security

- **Stripe handles all payment processing.** Credit card numbers never touch the TestPrep4U servers.
- **Duplicate payment protection.** The system checks for existing enrollments before creating new ones, so even if Stripe sends a payment notification twice, only one enrollment is created.
- **Webhook verification.** Every payment notification from Stripe is cryptographically verified to prevent forgery.

### Compliance (Florida DFS)

- **Granular time tracking.** Every study session is logged individually with start time, end time, and duration.
- **Session caps.** No single session can count for more than 4 hours, preventing clock manipulation.
- **3-year record retention.** Enrollment records, time logs, exam attempts, and certificates are retained for at least 3 years per Florida Department of Financial Services requirements.
- **Affidavit records.** The self-study affidavit captures the student's typed name, IP address, browser information, and exact timestamp.

### Infrastructure Overview

- **Hosting:** The platform runs on Vercel with automatic deployments whenever code changes are pushed.
- **Authentication:** Supabase handles user accounts, email verification, and password resets.
- **Database:** Supabase provides a PostgreSQL database with built-in security policies.
- **Payments:** Stripe processes all payments via one-time checkout sessions.
- **Email:** Resend delivers all transactional emails from noreply@testprep4u.com.
- **Course content:** Articulate Rise 360 exports are served as interactive web content within the platform.

### Pre-Launch Notes

The site currently blocks search engines from indexing it. Before the official launch, the search engine blocks need to be removed so the site appears in Google and other search results.
