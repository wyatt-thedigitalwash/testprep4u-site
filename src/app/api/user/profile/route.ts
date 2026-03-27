import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const VALID_STATES = ["FL"] as const;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, state } = body;

    // Validate inputs
    const update: Record<string, string | null> = {};

    if (fullName !== undefined) {
      const trimmed = String(fullName).trim();
      if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { error: `Name must be 1–${MAX_NAME_LENGTH} characters` },
          { status: 400 }
        );
      }
      update.full_name = trimmed;
    }

    if (phone !== undefined) {
      if (phone === null || phone === "") {
        update.phone = null;
      } else {
        const trimmed = String(phone).trim();
        if (trimmed.length > MAX_PHONE_LENGTH) {
          return NextResponse.json(
            { error: `Phone must be under ${MAX_PHONE_LENGTH} characters` },
            { status: 400 }
          );
        }
        update.phone = trimmed;
      }
    }

    if (state !== undefined) {
      if (!VALID_STATES.includes(state as (typeof VALID_STATES)[number])) {
        return NextResponse.json(
          { error: "Invalid state selection" },
          { status: 400 }
        );
      }
      update.state = state;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Also update auth user_metadata so it stays in sync
    const metaUpdate: Record<string, string> = {};
    if (update.full_name) metaUpdate.full_name = update.full_name;
    if (update.state) metaUpdate.state = update.state;
    if (Object.keys(metaUpdate).length > 0) {
      await supabase.auth.updateUser({ data: metaUpdate });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
