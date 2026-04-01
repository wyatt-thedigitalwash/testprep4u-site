/**
 * One-time migration script: uploads SCORM files from public/scorm/ to
 * Supabase Storage (scorm-packages bucket) and updates course_modules
 * scorm_entry_path values to use the storage: prefix.
 *
 * Usage:
 *   npx tsx scripts/migrate-scorm-to-storage.ts
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readdirSync, statSync, readFileSync } from "fs";
import { join, relative } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "scorm-packages";
const SCORM_DIR = join(process.cwd(), "public", "scorm");

const CONTENT_TYPES: Record<string, string> = {
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
  txt: "text/plain",
};

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  console.log("=== SCORM Migration to Supabase Storage ===\n");

  // 1. Collect all files
  const files = collectFiles(SCORM_DIR);
  console.log(`Found ${files.length} files in ${SCORM_DIR}\n`);

  if (files.length === 0) {
    console.log("No files to upload. Exiting.");
    return;
  }

  // 2. Upload to Supabase Storage
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    // Storage key: relative to public/scorm/, so "fl-life/part1/Chapter 1.../file.html"
    const storageKey = relative(join(process.cwd(), "public", "scorm"), filePath);
    const fileBuffer = readFileSync(filePath);
    const contentType = getContentType(filePath);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      if (error.message.includes("already exists")) {
        skipped++;
      } else {
        console.error(`  ✗ ${storageKey}: ${error.message}`);
        failed++;
      }
    } else {
      uploaded++;
    }

    // Progress every 100 files
    if ((i + 1) % 100 === 0 || i === files.length - 1) {
      console.log(
        `  Progress: ${i + 1}/${files.length} (${uploaded} uploaded, ${skipped} skipped, ${failed} failed)`
      );
    }

    // Rate limit: ~10 files/sec to avoid overwhelming Supabase
    if ((i + 1) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log(
    `\nUpload complete: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed\n`
  );

  // 3. Update database — prefix all scorm_entry_path values with "storage:"
  // Current format: "scorm/fl-life/part1/Chapter 1.../scormdriver/indexAPI.html"
  // New format: "storage:fl-life/part1/Chapter 1.../scormdriver/indexAPI.html"
  // (strip the leading "scorm/" since the bucket is already "scorm-packages")
  console.log("Updating database scorm_entry_path values...\n");

  const { data: modules, error: fetchError } = await supabase
    .from("course_modules")
    .select("id, scorm_entry_path")
    .not("scorm_entry_path", "is", null);

  if (fetchError) {
    console.error("Failed to fetch modules:", fetchError.message);
    return;
  }

  let dbUpdated = 0;
  let dbSkipped = 0;

  for (const mod of modules || []) {
    if (!mod.scorm_entry_path) continue;

    // Skip if already migrated
    if (mod.scorm_entry_path.startsWith("storage:")) {
      dbSkipped++;
      continue;
    }

    // Convert "scorm/fl-life/..." to "storage:fl-life/..."
    const newPath = mod.scorm_entry_path.startsWith("scorm/")
      ? `storage:${mod.scorm_entry_path.replace(/^scorm\//, "")}`
      : `storage:${mod.scorm_entry_path}`;

    const { error: updateError } = await supabase
      .from("course_modules")
      .update({ scorm_entry_path: newPath })
      .eq("id", mod.id);

    if (updateError) {
      console.error(`  ✗ Module ${mod.id}: ${updateError.message}`);
    } else {
      dbUpdated++;
    }
  }

  console.log(
    `Database update: ${dbUpdated} updated, ${dbSkipped} already migrated\n`
  );
  console.log("=== Migration complete ===");
  console.log(
    "\nNext steps:\n" +
      "  1. Verify SCORM modules load correctly from Supabase Storage\n" +
      "  2. Delete public/scorm/ directory\n" +
      "  3. Commit and deploy\n"
  );
}

main().catch(console.error);
