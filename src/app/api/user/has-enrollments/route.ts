import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasEnrollments: false }, { status: 401 });
  }

  const { count } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["active", "completed"])
    .gt("expires_at", new Date().toISOString());

  return NextResponse.json({ hasEnrollments: (count ?? 0) > 0 });
}
