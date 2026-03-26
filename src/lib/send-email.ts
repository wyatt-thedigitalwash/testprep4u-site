// Fire-and-forget email sender.
// Wraps Resend calls so email failures never block the main API response.

import { getResend, EMAIL_FROM } from "@/lib/resend";

export function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): void {
  // Fire and forget — don't await
  getResend()
    .emails.send({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    })
    .catch((err) => {
      console.error(`[Email] Failed to send "${opts.subject}" to ${opts.to}:`, err);
    });
}
