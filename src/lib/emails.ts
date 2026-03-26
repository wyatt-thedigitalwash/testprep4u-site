// Branded HTML email templates for TestPrep4U transactional emails.
// All templates use inline styles for maximum email client compatibility.

/** Escape HTML special characters to prevent XSS in email templates */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const NAVY = "#003152";
const BLUE = "#447FF0";
const GRAY_500 = "#64748b";
const GRAY_700 = "#334155";
const SUCCESS = "#10b981";
const BG = "#f8fafc";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.testprep4u.com";

/** Shared email layout wrapper */
function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TestPrep4U</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${NAVY};padding:24px 32px;text-align:center;">
              <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">TestPrep4U</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                TestPrep4U &middot; Insurance Exam Prep<br />
                <a href="${SITE_URL}" style="color:${BLUE};text-decoration:none;">www.testprep4u.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Blue CTA button — escapes text and validates href */
function button(text: string, href: string): string {
  const safeText = esc(text);
  const safeHref = esc(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${BLUE};border-radius:8px;">
      <a href="${safeHref}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
        ${safeText}
      </a>
    </td>
  </tr>
</table>`;
}

/** Section divider */
function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}

// ─── Email Templates ──────────────────────────────────────────────

/** Welcome email — sent after signup confirmation */
export function welcomeEmail(name: string): {
  subject: string;
  html: string;
} {
  const firstName = esc(name.split(" ")[0] || "there");
  return {
    subject: "Welcome to TestPrep4U — Let's Get You Licensed!",
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${NAVY};line-height:1.3;">
        Welcome to TestPrep4U, ${firstName}!
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_700};line-height:1.6;">
        Your account is confirmed and you're ready to start your journey toward getting your Florida insurance license.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:${NAVY};">
        Here's how to get started:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:${GRAY_700};line-height:1.5;">
            <strong style="color:${BLUE};">1.</strong> Choose your course (Life, Health, or Combined)
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:${GRAY_700};line-height:1.5;">
            <strong style="color:${BLUE};">2.</strong> Enroll and access your study dashboard
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:${GRAY_700};line-height:1.5;">
            <strong style="color:${BLUE};">3.</strong> Complete modules at your own pace
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:${GRAY_700};line-height:1.5;">
            <strong style="color:${BLUE};">4.</strong> Pass the final exam and earn your certificate
          </td>
        </tr>
      </table>
      ${button("Browse Courses", `${SITE_URL}/pricing`)}
      <p style="margin:0;font-size:13px;color:${GRAY_500};line-height:1.5;">
        Questions? Reply to this email or reach us at support@testprep4u.com.
      </p>
    `),
  };
}

/** Enrollment confirmation — sent after Stripe checkout */
export function enrollmentEmail(opts: {
  name: string;
  courseName: string;
  tier: string;
  accessMonths: number;
  expiresAt: string;
}): { subject: string; html: string } {
  const firstName = esc(opts.name.split(" ")[0] || "there");
  const safeCourseName = esc(opts.courseName);
  const tierLabel = esc(
    opts.tier.charAt(0).toUpperCase() + opts.tier.slice(1)
  );
  const expiresFormatted = new Date(opts.expiresAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return {
    subject: `You're Enrolled — ${opts.courseName}`,
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${NAVY};line-height:1.3;">
        You're in, ${firstName}!
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:${GRAY_700};line-height:1.6;">
        Your enrollment is confirmed. Here are your details:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BG};border-radius:8px;margin:0 0 20px;">
        <tr>
          <td style="padding:16px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:${GRAY_500};">Program</td>
                <td style="padding:6px 0;font-size:14px;font-weight:600;color:${NAVY};text-align:right;">${safeCourseName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:${GRAY_500};">Plan</td>
                <td style="padding:6px 0;font-size:14px;font-weight:600;color:${NAVY};text-align:right;">${tierLabel}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:${GRAY_500};">Access Period</td>
                <td style="padding:6px 0;font-size:14px;font-weight:600;color:${NAVY};text-align:right;">${opts.accessMonths} months</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:${GRAY_500};">Expires</td>
                <td style="padding:6px 0;font-size:14px;font-weight:600;color:${NAVY};text-align:right;">${expiresFormatted}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ${button("Go to Your Dashboard", `${SITE_URL}/dashboard`)}
      <p style="margin:0;font-size:13px;color:${GRAY_500};line-height:1.5;">
        Your course content is ready. Start with Section 1 and work through the modules at your own pace.
      </p>
    `),
  };
}

/** Section completed — sent when a section quiz is passed */
export function sectionCompletedEmail(opts: {
  name: string;
  sectionTitle: string;
  sectionNumber: number;
  score: number;
  totalSections: number;
  completedSections: number;
  courseSlug: string;
}): { subject: string; html: string } {
  const firstName = esc(opts.name.split(" ")[0] || "there");
  const progressPercent = Math.round(
    (opts.completedSections / opts.totalSections) * 100
  );

  return {
    subject: `Section ${opts.sectionNumber} Complete — ${opts.score}%!`,
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${NAVY};line-height:1.3;">
        Nice work, ${firstName}!
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:${GRAY_700};line-height:1.6;">
        You passed the <strong>Part ${opts.sectionNumber}: ${esc(opts.sectionTitle)}</strong> quiz with a score of <strong style="color:${SUCCESS};">${opts.score}%</strong>.
      </p>
      <!-- Progress bar -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 8px;">
        <tr>
          <td style="background-color:#e2e8f0;border-radius:4px;height:8px;">
            <div style="background-color:${BLUE};border-radius:4px;height:8px;width:${progressPercent}%;"></div>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 20px;font-size:13px;color:${GRAY_500};">
        ${opts.completedSections} of ${opts.totalSections} sections complete (${progressPercent}%)
      </p>
      ${divider()}
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${NAVY};">
        What's next?
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:${GRAY_700};line-height:1.5;">
        ${opts.completedSections < opts.totalSections
          ? `Continue to Section ${opts.sectionNumber + 1} — you're making great progress!`
          : "All sections are complete! Time to tackle the final exam."}
      </p>
      ${button("Continue Studying", `${SITE_URL}/dashboard/courses/${opts.courseSlug}`)}
    `),
  };
}

/** Final exam passed — sent when the final exam is passed at 70%+ */
export function finalExamPassedEmail(opts: {
  name: string;
  score: number;
  courseName: string;
  courseSlug: string;
}): { subject: string; html: string } {
  const firstName = esc(opts.name.split(" ")[0] || "there");

  return {
    subject: `You Passed the Final Exam! — ${opts.score}%`,
    html: layout(`
      <div style="text-align:center;margin:0 0 24px;">
        <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:50%;background-color:#d1fae5;font-size:28px;text-align:center;">
          🎉
        </div>
      </div>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${NAVY};line-height:1.3;text-align:center;">
        Congratulations, ${firstName}!
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:${GRAY_700};line-height:1.6;text-align:center;">
        You passed the <strong>${esc(opts.courseName)}</strong> final exam with a score of <strong style="color:${SUCCESS};">${opts.score}%</strong>.
      </p>
      ${divider()}
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${NAVY};">
        Next Step: Sign the Self-Study Affidavit
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:${GRAY_700};line-height:1.5;">
        To receive your completion certificate, you need to sign the self-study affidavit confirming you personally completed all course work. This takes less than a minute.
      </p>
      ${button("Sign Affidavit", `${SITE_URL}/dashboard/courses/${opts.courseSlug}/affidavit`)}
      <p style="margin:0;font-size:13px;color:${GRAY_500};line-height:1.5;">
        Make sure you've also met the 30-hour seat time requirement before signing.
      </p>
    `),
  };
}

/** Certificate ready — sent after certificate is generated */
export function certificateReadyEmail(opts: {
  name: string;
  courseName: string;
  certificateNumber: string;
  courseSlug: string;
}): { subject: string; html: string } {
  const firstName = esc(opts.name.split(" ")[0] || "there");

  return {
    subject: "Your Completion Certificate Is Ready!",
    html: layout(`
      <div style="text-align:center;margin:0 0 24px;">
        <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:50%;background-color:#d1fae5;font-size:28px;text-align:center;">
          🏆
        </div>
      </div>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${NAVY};line-height:1.3;text-align:center;">
        Your Certificate Is Ready, ${firstName}!
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:${GRAY_700};line-height:1.6;text-align:center;">
        You've completed the <strong>${esc(opts.courseName)}</strong> pre-licensing course.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BG};border-radius:8px;margin:0 0 20px;">
        <tr>
          <td style="padding:16px 20px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:${GRAY_500};text-transform:uppercase;letter-spacing:0.05em;">Certificate Number</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:${NAVY};font-family:monospace;">${esc(opts.certificateNumber)}</p>
          </td>
        </tr>
      </table>
      ${button("Download Certificate", `${SITE_URL}/dashboard/courses/${opts.courseSlug}/certificate`)}
      ${divider()}
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${NAVY};">
        Next Steps to Get Your License
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        <tr>
          <td style="padding:6px 0;font-size:14px;color:${GRAY_700};line-height:1.5;">
            <strong style="color:${BLUE};">1.</strong> Schedule your state exam at <a href="https://home.pearsonvue.com/fl/insurance" style="color:${BLUE};text-decoration:none;">Pearson VUE</a>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:${GRAY_700};line-height:1.5;">
            <strong style="color:${BLUE};">2.</strong> Complete fingerprinting at an <a href="https://www.fieldprintflorida.com" style="color:${BLUE};text-decoration:none;">approved location</a>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:${GRAY_700};line-height:1.5;">
            <strong style="color:${BLUE};">3.</strong> Get appointed by an insurance company or agency
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:${GRAY_500};line-height:1.5;">
        You'll need your certificate number when registering for the state exam. Good luck!
      </p>
    `),
  };
}

/** Contact form submission notification — sent to support */
export function contactNotificationEmail(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): { subject: string; html: string } {
  const safeName = esc(opts.name);
  const safeEmail = esc(opts.email);
  const safeSubject = esc(opts.subject);
  const safeMessage = esc(opts.message);

  // Strip newlines to prevent header injection in email subject
  const cleanSubject = opts.subject.replace(/[\r\n]+/g, " ").trim();
  const cleanName = opts.name.replace(/[\r\n]+/g, " ").trim();

  return {
    subject: `[Contact Form] ${cleanSubject} — from ${cleanName}`,
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${NAVY};line-height:1.3;">
        New Contact Form Submission
      </h1>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BG};border-radius:8px;margin:0 0 20px;">
        <tr>
          <td style="padding:16px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:${GRAY_500};width:80px;">Name</td>
                <td style="padding:6px 0;font-size:14px;color:${NAVY};font-weight:600;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:${GRAY_500};">Email</td>
                <td style="padding:6px 0;font-size:14px;color:${NAVY};">
                  <a href="mailto:${safeEmail}" style="color:${BLUE};text-decoration:none;">${safeEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:${GRAY_500};">Subject</td>
                <td style="padding:6px 0;font-size:14px;color:${NAVY};">${safeSubject}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:${GRAY_500};text-transform:uppercase;letter-spacing:0.05em;">Message</p>
      <div style="background-color:${BG};border-radius:8px;padding:16px 20px;margin:0 0 16px;">
        <p style="margin:0;font-size:14px;color:${GRAY_700};line-height:1.6;white-space:pre-wrap;">${safeMessage}</p>
      </div>
      <p style="margin:0;font-size:13px;color:${GRAY_500};">
        Reply directly to this email to respond to the sender.
      </p>
    `),
  };
}

/** Contact form confirmation — sent to the user */
export function contactConfirmationEmail(name: string): {
  subject: string;
  html: string;
} {
  const firstName = esc(name.split(" ")[0] || "there");
  return {
    subject: "We Received Your Message — TestPrep4U",
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${NAVY};line-height:1.3;">
        Thanks for reaching out, ${firstName}!
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_700};line-height:1.6;">
        We've received your message and will get back to you within one business day.
      </p>
      <p style="margin:0;font-size:13px;color:${GRAY_500};line-height:1.5;">
        In the meantime, check out our <a href="${SITE_URL}/faq" style="color:${BLUE};text-decoration:none;">FAQ page</a> — your question may already be answered there.
      </p>
    `),
  };
}
