import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasEnrollments: false, isAdmin: false }, { status: 401 });
  }

  const [{ count }, { data: profile }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["active", "completed"])
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single(),
  ]);

  return NextResponse.json({
    hasEnrollments: (count ?? 0) > 0,
    isAdmin: profile?.is_admin === true,
  });
}
