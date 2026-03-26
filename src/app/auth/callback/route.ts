import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/send-email";
import { welcomeEmail } from "@/lib/emails";

/** Only allow relative paths (no protocol-relative redirects) */
function sanitizeRedirect(
  raw: string | null,
  fallback: string = "/dashboard"
): string {
  if (!raw) return fallback;
  // Must start with / and must NOT start with // (protocol-relative)
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

/** Map Supabase error codes/descriptions to user-friendly messages */
function friendlyError(
  errorCode: string | null,
  errorDescription: string | null
): string {
  const code = errorCode || "";
  const desc = (errorDescription || "").toLowerCase();

  if (code === "otp_expired" || desc.includes("expired")) {
    return "Your confirmation link has expired. Please sign up again or request a new link.";
  }
  if (code === "access_denied" || desc.includes("access_denied")) {
    return "Access denied. The link may have already been used or is invalid.";
  }
  if (desc.includes("invalid") || code === "otp_invalid") {
    return "This link is invalid or has already been used. Please request a new one.";
  }
  return "Something went wrong with your link. Please try signing in or request a new link.";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  // Supabase redirects with error params when confirmation/reset links fail
  const errorCode = searchParams.get("error_code") || searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorCode || errorDescription) {
    const message = friendlyError(errorCode, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email for new users (created within the last 5 minutes)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let isNewUser = false;
      const isResetFlow = nextParam?.includes("reset-password");

      if (user && !isResetFlow) {
        const createdAt = new Date(user.created_at).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        if (createdAt > fiveMinutesAgo) {
          isNewUser = true;
          if (user.email) {
            const name =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email ||
              "";
            const welcomeMsg = welcomeEmail(name);
            sendEmail({
              to: user.email,
              subject: welcomeMsg.subject,
              html: welcomeMsg.html,
            });
          }
        }
      }

      // New users with no explicit next param default to /pricing
      const redirect = sanitizeRedirect(
        nextParam,
        isNewUser ? "/pricing" : "/dashboard"
      );
      return NextResponse.redirect(`${origin}${redirect}`);
    }

    // Code exchange failed — provide a helpful message
    const message = "Your link has expired or is invalid. Please try signing in or request a new link.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }

  // No code and no error — redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
