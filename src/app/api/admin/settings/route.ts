import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/lib/supabase/server";

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

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;
  const supabase = createAdminClient();

  switch (action) {
    case "grant_admin": {
      const { email } = body;
      if (!email || typeof email !== "string") {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }

      // Find user by email via auth admin
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const target = (users || []).find(
        (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
      );

      if (!target) {
        return NextResponse.json(
          { error: "No user found with that email" },
          { status: 404 }
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", target.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        message: `Admin access granted to ${email}.`,
      });
    }

    case "revoke_admin": {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: false })
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Admin access revoked." });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
