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
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;
  const supabase = createAdminClient();

  switch (action) {
    /* ── Course metadata ────────────────────────────────────── */
    case "update_course": {
      const { courseId, name, required_hours, active } = body;
      if (!courseId) {
        return NextResponse.json(
          { error: "Missing courseId" },
          { status: 400 }
        );
      }

      const update: Record<string, unknown> = {};
      if (typeof name === "string" && name.trim()) update.name = name.trim();
      if (typeof required_hours === "number" && required_hours > 0)
        update.required_hours = required_hours;
      if (typeof active === "boolean") update.active = active;

      if (Object.keys(update).length === 0) {
        return NextResponse.json(
          { error: "Nothing to update" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("courses")
        .update(update)
        .eq("id", courseId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Course updated." });
    }

    /* ── Section operations ─────────────────────────────────── */
    case "update_section": {
      const { sectionId, title } = body;
      if (!sectionId || !title?.trim()) {
        return NextResponse.json(
          { error: "Missing sectionId or title" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("course_sections")
        .update({ title: title.trim() })
        .eq("id", sectionId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Section updated." });
    }

    case "reorder_section": {
      const { sectionId, direction } = body;
      if (!sectionId || !["up", "down"].includes(direction)) {
        return NextResponse.json({ error: "Invalid params" }, { status: 400 });
      }

      // Get current section
      const { data: current } = await supabase
        .from("course_sections")
        .select("id, course_id, sort_order")
        .eq("id", sectionId)
        .single();
      if (!current) {
        return NextResponse.json(
          { error: "Section not found" },
          { status: 404 }
        );
      }

      // Get adjacent section
      const { data: siblings } = await supabase
        .from("course_sections")
        .select("id, sort_order")
        .eq("course_id", current.course_id)
        .order("sort_order");

      const idx = (siblings || []).findIndex((s) => s.id === sectionId);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;

      if (!siblings || swapIdx < 0 || swapIdx >= siblings.length) {
        return NextResponse.json(
          { error: "Cannot move further" },
          { status: 400 }
        );
      }

      const swap = siblings[swapIdx];

      // Swap sort_order values — use a temp to avoid unique constraint
      const tempOrder = -1;
      await supabase
        .from("course_sections")
        .update({ sort_order: tempOrder })
        .eq("id", current.id);
      await supabase
        .from("course_sections")
        .update({ sort_order: current.sort_order })
        .eq("id", swap.id);
      await supabase
        .from("course_sections")
        .update({ sort_order: swap.sort_order })
        .eq("id", current.id);

      return NextResponse.json({ message: "Section reordered." });
    }

    /* ── Module operations ──────────────────────────────────── */
    case "add_module": {
      const { sectionId, title, module_type } = body;
      if (!sectionId || !title?.trim()) {
        return NextResponse.json(
          { error: "Missing sectionId or title" },
          { status: 400 }
        );
      }

      const type = module_type === "quiz" ? "quiz" : "lesson";

      // Get max sort_order in section
      const { data: existing } = await supabase
        .from("course_modules")
        .select("sort_order")
        .eq("section_id", sectionId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

      const insertData: Record<string, unknown> = {
        section_id: sectionId,
        title: title.trim(),
        module_type: type,
        sort_order: nextOrder,
        active: true,
      };
      if (type === "quiz") insertData.quiz_pass_score = 70;

      const { error } = await supabase
        .from("course_modules")
        .insert(insertData);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Module added." });
    }

    case "update_module": {
      const { moduleId, title, module_type, quiz_pass_score } = body;
      if (!moduleId) {
        return NextResponse.json(
          { error: "Missing moduleId" },
          { status: 400 }
        );
      }

      const update: Record<string, unknown> = {};
      if (typeof title === "string" && title.trim())
        update.title = title.trim();
      if (module_type === "lesson" || module_type === "quiz")
        update.module_type = module_type;
      if (typeof quiz_pass_score === "number")
        update.quiz_pass_score = quiz_pass_score;

      if (Object.keys(update).length === 0) {
        return NextResponse.json(
          { error: "Nothing to update" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("course_modules")
        .update(update)
        .eq("id", moduleId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Module updated." });
    }

    case "remove_module": {
      const { moduleId } = body;
      if (!moduleId) {
        return NextResponse.json(
          { error: "Missing moduleId" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", moduleId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Module removed." });
    }

    case "reorder_module": {
      const { moduleId, direction } = body;
      if (!moduleId || !["up", "down"].includes(direction)) {
        return NextResponse.json({ error: "Invalid params" }, { status: 400 });
      }

      const { data: current } = await supabase
        .from("course_modules")
        .select("id, section_id, sort_order")
        .eq("id", moduleId)
        .single();
      if (!current) {
        return NextResponse.json(
          { error: "Module not found" },
          { status: 404 }
        );
      }

      const { data: siblings } = await supabase
        .from("course_modules")
        .select("id, sort_order")
        .eq("section_id", current.section_id)
        .order("sort_order");

      const idx = (siblings || []).findIndex((m) => m.id === moduleId);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;

      if (!siblings || swapIdx < 0 || swapIdx >= siblings.length) {
        return NextResponse.json(
          { error: "Cannot move further" },
          { status: 400 }
        );
      }

      const swap = siblings[swapIdx];
      const tempOrder = -1;
      await supabase
        .from("course_modules")
        .update({ sort_order: tempOrder })
        .eq("id", current.id);
      await supabase
        .from("course_modules")
        .update({ sort_order: current.sort_order })
        .eq("id", swap.id);
      await supabase
        .from("course_modules")
        .update({ sort_order: swap.sort_order })
        .eq("id", current.id);

      return NextResponse.json({ message: "Module reordered." });
    }

    case "toggle_module_active": {
      const { moduleId, active } = body;
      if (!moduleId || typeof active !== "boolean") {
        return NextResponse.json({ error: "Invalid params" }, { status: 400 });
      }

      const { error } = await supabase
        .from("course_modules")
        .update({ active })
        .eq("id", moduleId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        message: `Module ${active ? "activated" : "deactivated"}.`,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
