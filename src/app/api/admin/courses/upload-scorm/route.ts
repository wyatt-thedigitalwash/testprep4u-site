import { NextResponse } from "next/server";
import { execSync } from "child_process";
import {
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
  statSync,
  readFileSync,
} from "fs";
import { join, relative } from "path";
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

// Uses /tmp for extraction (works on Vercel) and uploads to Supabase Storage.
// Existing SCORM packages in public/scorm/ continue to work via direct serving.
// Newly uploaded packages are served via Supabase Storage signed URLs.

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const tmpBase = join("/tmp", `scorm-upload-${Date.now()}`);

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

    // 50MB max
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 50MB limit" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify module exists and get section info for path construction
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

    // Build the storage path: {courseSlug}/part{N}/{sanitized-title}/
    const sanitizedTitle = mod.title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, " ");
    const partFolder = `part${section.section_number}`;
    const storagePath = `${courseSlug}/${partFolder}/${sanitizedTitle}`;

    // Extract zip in /tmp
    mkdirSync(tmpBase, { recursive: true });
    const tmpZip = join(tmpBase, "upload.zip");
    const extractDir = join(tmpBase, "extracted");
    mkdirSync(extractDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(tmpZip, buffer);

    try {
      execSync(`unzip -o -q "${tmpZip}" -d "${extractDir}"`, {
        timeout: 30000,
      });
    } catch (unzipErr) {
      console.error("Unzip error:", unzipErr);
      return NextResponse.json(
        { error: "Failed to extract zip file" },
        { status: 500 }
      );
    }

    // Find the SCORM entry file
    let contentRoot = extractDir;
    let entryRelative: string | null = null;

    // Check common entry points at extract root
    const entryNames = [
      "scormdriver/indexAPI.html",
      "index.html",
      "scormcontent/index.html",
    ];

    for (const name of entryNames) {
      if (existsSync(join(contentRoot, name))) {
        entryRelative = name;
        break;
      }
    }

    // If not found, check for a single wrapper folder
    if (!entryRelative) {
      const contents = readdirSync(contentRoot);
      const dirs = contents.filter((f) =>
        statSync(join(contentRoot, f)).isDirectory()
      );

      if (dirs.length === 1) {
        const nestedDir = join(contentRoot, dirs[0]);
        for (const name of entryNames) {
          if (existsSync(join(nestedDir, name))) {
            contentRoot = nestedDir;
            entryRelative = name;
            break;
          }
        }
      }
    }

    if (!entryRelative) {
      return NextResponse.json(
        {
          error:
            "Could not find SCORM entry file (scormdriver/indexAPI.html or index.html). Make sure the zip contains a valid SCORM package.",
        },
        { status: 400 }
      );
    }

    // Upload all extracted files to Supabase Storage
    const filesToUpload = collectFiles(contentRoot);
    let uploaded = 0;
    let uploadErrors = 0;

    for (const filePath of filesToUpload) {
      const relativeName = relative(contentRoot, filePath);
      const storageKey = `${storagePath}/${relativeName}`;
      const fileBuffer = readFileSync(filePath);

      // Determine content type
      const contentType = getContentType(relativeName);

      const { error: uploadError } = await supabase.storage
        .from("scorm-packages")
        .upload(storageKey, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error(
          `[upload-scorm] Failed to upload ${storageKey}:`,
          uploadError.message
        );
        uploadErrors++;
      } else {
        uploaded++;
      }
    }

    if (uploaded === 0) {
      return NextResponse.json(
        { error: `Upload failed — 0 of ${filesToUpload.length} files uploaded` },
        { status: 500 }
      );
    }

    // The entry path in storage
    const entryStoragePath = `${storagePath}/${entryRelative}`;

    // Update the module's scorm_entry_path to use storage: prefix
    // The SCORM viewer will detect this prefix and use signed URLs
    const scormEntryPath = `storage:${entryStoragePath}`;

    const { error: updateError } = await supabase
      .from("course_modules")
      .update({ scorm_entry_path: scormEntryPath })
      .eq("id", moduleId);

    if (updateError) {
      return NextResponse.json(
        {
          error:
            "Files uploaded but failed to update database: " +
            updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `SCORM package uploaded — ${uploaded} files${uploadErrors > 0 ? `, ${uploadErrors} failed` : ""}.`,
      scorm_entry_path: scormEntryPath,
    });
  } catch (err) {
    console.error("SCORM upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  } finally {
    // Clean up /tmp
    try {
      if (existsSync(tmpBase)) {
        rmSync(tmpBase, { recursive: true, force: true });
      }
    } catch {
      // best effort cleanup
    }
  }
}

/** Recursively collect all file paths under a directory */
function collectFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      results.push(full);
    }
  }

  return results;
}

/** Map file extension to MIME type for Supabase Storage */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    xsd: "application/xml",
    dtd: "application/xml-dtd",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    pdf: "application/pdf",
    zip: "application/zip",
    txt: "text/plain",
  };
  return map[ext] || "application/octet-stream";
}
