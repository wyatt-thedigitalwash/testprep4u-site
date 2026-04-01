import { NextResponse } from "next/server";
import { execSync } from "child_process";
import {
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
  statSync,
} from "fs";
import { join } from "path";
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

// Extracts SCORM zip to public/scorm/ for local dev.
// On Vercel, the filesystem is read-only — SCORM uploads must be done
// locally and committed, or a Supabase Storage approach added later.

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const moduleId = formData.get("moduleId") as string | null;
    const courseSlug = formData.get("courseSlug") as string | null;

    if (!file || !moduleId || !courseSlug) {
      return NextResponse.json(
        { error: "Missing file, moduleId, or courseSlug" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "File must be a .zip archive" },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 50MB limit" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: mod } = await supabase
      .from("course_modules")
      .select(
        "id, title, section_id, course_sections!inner(section_number, course_id)"
      )
      .eq("id", moduleId)
      .single();

    if (!mod) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    const section = mod.course_sections as unknown as {
      section_number: number;
      course_id: string;
    };

    const sanitizedTitle = mod.title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, " ");
    const partFolder = `part${section.section_number}`;
    const relativePath = `scorm/${courseSlug}/${partFolder}/${sanitizedTitle}`;
    const projectRoot = process.cwd();
    const targetDir = join(projectRoot, "public", relativePath);

    const buffer = Buffer.from(await file.arrayBuffer());
    const tmpZip = join(projectRoot, "public", "scorm", `_upload_${Date.now()}.zip`);

    // Ensure the scorm directory exists
    mkdirSync(join(projectRoot, "public", "scorm"), { recursive: true });
    writeFileSync(tmpZip, buffer);

    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
    mkdirSync(targetDir, { recursive: true });

    try {
      execSync(`unzip -o -q "${tmpZip}" -d "${targetDir}"`, {
        timeout: 30000,
      });
    } catch (unzipErr) {
      rmSync(tmpZip, { force: true });
      rmSync(targetDir, { recursive: true, force: true });
      console.error("Unzip error:", unzipErr);
      return NextResponse.json(
        { error: "Failed to extract zip file" },
        { status: 500 }
      );
    }

    rmSync(tmpZip, { force: true });

    // Find SCORM entry file
    const entryNames = [
      join(targetDir, "scormdriver", "indexAPI.html"),
      join(targetDir, "index.html"),
      join(targetDir, "scormcontent", "index.html"),
    ];

    let entryFile: string | null = null;
    for (const p of entryNames) {
      if (existsSync(p)) {
        entryFile = p.replace(join(projectRoot, "public") + "/", "");
        break;
      }
    }

    if (!entryFile) {
      const contents = readdirSync(targetDir);
      const dirs = contents.filter((f: string) =>
        statSync(join(targetDir, f)).isDirectory()
      );

      if (dirs.length === 1) {
        const nestedDir = join(targetDir, dirs[0]);
        const nestedEntries = [
          join(nestedDir, "scormdriver", "indexAPI.html"),
          join(nestedDir, "index.html"),
          join(nestedDir, "scormcontent", "index.html"),
        ];
        for (const p of nestedEntries) {
          if (existsSync(p)) {
            entryFile = p.replace(join(projectRoot, "public") + "/", "");
            break;
          }
        }
      }
    }

    if (!entryFile) {
      rmSync(targetDir, { recursive: true, force: true });
      return NextResponse.json(
        {
          error:
            "Could not find SCORM entry file (scormdriver/indexAPI.html or index.html).",
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("course_modules")
      .update({ scorm_entry_path: entryFile })
      .eq("id", moduleId);

    if (updateError) {
      return NextResponse.json(
        { error: "Files extracted but failed to update database: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "SCORM package uploaded successfully.",
      scorm_entry_path: entryFile,
    });
  } catch (err) {
    console.error("SCORM upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
