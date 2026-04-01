import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/lib/supabase/server";
import {
  getRevenueFromSession,
  captureBillingAddress,
} from "@/lib/stripe-revenue";

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

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Find enrollments missing revenue data that have a Stripe session
  const { data: enrollments, error: fetchError } = await supabase
    .from("enrollments")
    .select("id, user_id, stripe_session_id")
    .is("gross_amount", null)
    .not("stripe_session_id", "is", null);

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch enrollments: " + fetchError.message },
      { status: 500 }
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({
      message: "No enrollments need backfilling.",
      backfilled: 0,
      failed: 0,
      errors: [],
    });
  }

  let backfilled = 0;
  let failed = 0;
  const errors: Array<{ enrollmentId: string; error: string }> = [];

  for (const enrollment of enrollments) {
    const sessionId = enrollment.stripe_session_id;
    if (!sessionId) continue;

    try {
      // Get revenue data from Stripe
      const revenue = await getRevenueFromSession(sessionId);

      // Skip if Stripe returned zeroes (session may no longer exist)
      if (revenue.gross_amount === 0 && revenue.net_amount === 0) {
        errors.push({
          enrollmentId: enrollment.id,
          error: "Stripe returned zero revenue — session may have expired",
        });
        failed++;
        continue;
      }

      // Update enrollment with revenue fields
      const { error: updateError } = await supabase
        .from("enrollments")
        .update({
          gross_amount: revenue.gross_amount,
          discount_amount: revenue.discount_amount,
          tax_amount: revenue.tax_amount,
          fee_amount: revenue.fee_amount,
          net_amount: revenue.net_amount,
        })
        .eq("id", enrollment.id);

      if (updateError) {
        errors.push({
          enrollmentId: enrollment.id,
          error: "DB update failed: " + updateError.message,
        });
        failed++;
        continue;
      }

      // Capture billing address if available
      await captureBillingAddress(sessionId, enrollment.user_id, supabase);

      backfilled++;
    } catch (err) {
      errors.push({
        enrollmentId: enrollment.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      failed++;
    }

    // Rate limit: avoid hitting Stripe API too fast
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return NextResponse.json({
    message: `Backfill complete. ${backfilled} updated, ${failed} failed out of ${enrollments.length} total.`,
    backfilled,
    failed,
    total: enrollments.length,
    errors: errors.slice(0, 50), // Cap error list to prevent huge responses
  });
}
