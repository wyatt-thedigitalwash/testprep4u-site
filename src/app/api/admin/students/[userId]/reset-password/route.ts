import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await params;
  const supabase = createAdminClient();

  // Get user email
  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  if (!authData?.user?.email) {
    return NextResponse.json(
      { error: "User not found or has no email" },
      { status: 404 }
    );
  }

  // Generate a password reset link via admin API
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: authData.user.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.testprep4u.com"}/auth/callback?next=/reset-password`,
    },
  });

  if (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to generate reset link" },
      { status: 500 }
    );
  }

  // Send the reset email via Resend
  const { sendEmail } = await import("@/lib/send-email");
  const resetUrl = data.properties?.action_link;

  sendEmail({
    to: authData.user.email,
    subject: "Reset Your TestPrep4U Password",
    html: `
      <p>Hi ${authData.user.user_metadata?.full_name || "there"},</p>
      <p>An administrator has requested a password reset for your account.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Reset Password</a></p>
      <p>If you didn't expect this, you can safely ignore this email.</p>
      <p>— TestPrep4U</p>
    `,
  });

  return NextResponse.json({
    message: `Password reset email sent to ${authData.user.email}.`,
  });
}
