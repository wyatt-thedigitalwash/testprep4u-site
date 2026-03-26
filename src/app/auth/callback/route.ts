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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

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
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login`);
}
