import { NextResponse } from "next/server";
import { getResend, EMAIL_FROM, SUPPORT_EMAIL } from "@/lib/resend";
import {
  contactNotificationEmail,
  contactConfirmationEmail,
} from "@/lib/emails";

// In-memory rate limiter: email → timestamp of last submission
const recentSubmissions = new Map<string, number>();
const RATE_LIMIT_MS = 60_000; // 60 seconds between submissions per email

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_MS;
  for (const [key, ts] of recentSubmissions) {
    if (ts < cutoff) recentSubmissions.delete(key);
  }
}, 300_000);

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Length limits
    if (name.trim().length > 200 || subject.trim().length > 300 || message.trim().length > 5000) {
      return NextResponse.json(
        { error: "Input exceeds maximum length" },
        { status: 400 }
      );
    }

    // Rate limit: one submission per email per 60 seconds
    const normalizedEmail = email.trim().toLowerCase();
    const lastSubmission = recentSubmissions.get(normalizedEmail);
    if (lastSubmission && Date.now() - lastSubmission < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: "Please wait before submitting another message" },
        { status: 429 }
      );
    }
    recentSubmissions.set(normalizedEmail, Date.now());

    const resend = getResend();

    // Send notification to support
    const notification = contactNotificationEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    await resend.emails.send({
      from: EMAIL_FROM,
      to: SUPPORT_EMAIL,
      replyTo: email.trim(),
      subject: notification.subject,
      html: notification.html,
    });

    // Send confirmation to user
    const confirmation = contactConfirmationEmail(name.trim());

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email.trim(),
      subject: confirmation.subject,
      html: confirmation.html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
