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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();
  const { action } = body;

  const supabase = createAdminClient();

  switch (action) {
    case "extend": {
      const { months } = body;
      if (!months || typeof months !== "number" || months < 1 || months > 24) {
        return NextResponse.json(
          { error: "Invalid months value" },
          { status: 400 }
        );
      }

      // Get active enrollment
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, expires_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!enrollment) {
        return NextResponse.json(
          { error: "No active enrollment found" },
          { status: 404 }
        );
      }

      const expiresAt = new Date(enrollment.expires_at);
      const targetMonth = expiresAt.getMonth() + months;
      expiresAt.setMonth(targetMonth);
      if (expiresAt.getMonth() !== targetMonth % 12) {
        expiresAt.setDate(0);
      }

      const { error } = await supabase
        .from("enrollments")
        .update({ expires_at: expiresAt.toISOString() })
        .eq("id", enrollment.id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to extend access" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Access extended by ${months} month${months !== 1 ? "s" : ""}. New expiration: ${expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      });
    }

    case "change_tier": {
      const { tier } = body;
      if (!["essentials", "pro", "premium"].includes(tier)) {
        return NextResponse.json(
          { error: "Invalid tier" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({ plan_tier: tier })
        .eq("id", userId);

      if (error) {
        return NextResponse.json(
          { error: "Failed to change tier" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Plan tier changed to ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`,
      });
    }

    case "revoke": {
      const { error } = await supabase
        .from("enrollments")
        .update({ status: "expired", expires_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) {
        return NextResponse.json(
          { error: "Failed to revoke access" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Access revoked. All active enrollments set to expired." });
    }

    default:
      return NextResponse.json(
        { error: "Unknown action" },
        { status: 400 }
      );
  }
}
