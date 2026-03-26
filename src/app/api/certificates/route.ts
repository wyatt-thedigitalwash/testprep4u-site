import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/lib/supabase/server";
import PDFDocument from "pdfkit";
import { sendEmail } from "@/lib/send-email";
import { certificateReadyEmail } from "@/lib/emails";

/** Generate a unique certificate number: TP4U-FL-LIFE-2026-XXXXXXXX */
function generateCertificateNumber(
  courseState: string,
  courseType: string
): string {
  const year = new Date().getFullYear();
  const stateCode = courseState.toUpperCase().slice(0, 2);
  const typeCode =
    courseType === "life"
      ? "LIFE"
      : courseType === "health"
        ? "HLTH"
        : "COMB";
  const serial = String(
    Math.floor(10000000 + Math.random() * 90000000)
  );
  return `TP4U-${stateCode}-${typeCode}-${year}-${serial}`;
}

/** Format date as "Month Day, Year" */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Build the certificate PDF and return it as a Buffer */
async function generateCertificatePDF(opts: {
  studentName: string;
  courseName: string;
  certificateNumber: string;
  totalHours: number;
  completionDate: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const centerX = pageW / 2;

    // ── Background & border ──
    // Navy border
    doc
      .rect(20, 20, pageW - 40, pageH - 40)
      .lineWidth(3)
      .strokeColor("#003152")
      .stroke();

    // Inner border
    doc
      .rect(30, 30, pageW - 60, pageH - 60)
      .lineWidth(1)
      .strokeColor("#447FF0")
      .stroke();

    // ── Header decorative line ──
    doc
      .moveTo(60, 80)
      .lineTo(pageW - 60, 80)
      .lineWidth(2)
      .strokeColor("#447FF0")
      .stroke();

    // ── Provider name ──
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#447FF0")
      .text("TESTPREP4U", 0, 95, { align: "center", width: pageW });

    // ── Title ──
    doc
      .fontSize(32)
      .font("Helvetica-Bold")
      .fillColor("#003152")
      .text("Certificate of Completion", 0, 125, {
        align: "center",
        width: pageW,
      });

    // ── Subtitle ──
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("This certifies that", 0, 175, {
        align: "center",
        width: pageW,
      });

    // ── Student name ──
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#003152")
      .text(opts.studentName, 0, 200, {
        align: "center",
        width: pageW,
      });

    // ── Decorative line under name ──
    const nameWidth = Math.min(400, opts.studentName.length * 16);
    doc
      .moveTo(centerX - nameWidth / 2, 240)
      .lineTo(centerX + nameWidth / 2, 240)
      .lineWidth(1)
      .strokeColor("#447FF0")
      .stroke();

    // ── "has successfully completed" ──
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("has successfully completed the", 0, 258, {
        align: "center",
        width: pageW,
      });

    // ── Course name ──
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#003152")
      .text(opts.courseName, 60, 285, {
        align: "center",
        width: pageW - 120,
      });

    // ── Hours and date ──
    const detailY = 330;
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#475569")
      .text(
        `Total Hours Completed: ${opts.totalHours} hours`,
        0,
        detailY,
        { align: "center", width: pageW }
      );

    doc.text(
      `Completion Date: ${formatDate(opts.completionDate)}`,
      0,
      detailY + 20,
      { align: "center", width: pageW }
    );

    doc.text(
      `Certificate Number: ${opts.certificateNumber}`,
      0,
      detailY + 40,
      { align: "center", width: pageW }
    );

    // ── Bottom decorative line ──
    doc
      .moveTo(60, pageH - 120)
      .lineTo(pageW - 60, pageH - 120)
      .lineWidth(2)
      .strokeColor("#447FF0")
      .stroke();

    // ── Provider info at bottom ──
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        "TestPrep4U  •  Insurance Exam Prep  •  www.testprep4u.com",
        0,
        pageH - 105,
        { align: "center", width: pageW }
      );

    doc
      .fontSize(9)
      .fillColor("#94a3b8")
      .text(
        "This certificate confirms completion of the pre-licensing course. It does not constitute an insurance license.",
        60,
        pageH - 85,
        { align: "center", width: pageW - 120 }
      );

    doc.end();
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enrollmentId } = await request.json();

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "Missing enrollmentId" },
        { status: 400 }
      );
    }

    // Get enrollment with course info
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select(
        `
        id, user_id, course_id, status, affidavit_accepted_at,
        courses (id, slug, name, type, state, required_hours)
      `
      )
      .eq("id", enrollmentId)
      .single();

    if (!enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const course = enrollment.courses as unknown as {
      id: string;
      slug: string;
      name: string;
      type: string;
      state: string;
      required_hours: number;
    };

    // ── Validate all prerequisites ──

    // 1. Affidavit signed
    if (!enrollment.affidavit_accepted_at) {
      return NextResponse.json(
        { error: "Affidavit not signed" },
        { status: 403 }
      );
    }

    // 2. Final exam passed
    const { data: examAttempts } = await supabase
      .from("exam_attempts")
      .select("passed")
      .eq("enrollment_id", enrollmentId)
      .eq("exam_type", "final")
      .eq("passed", true);

    if (!examAttempts || examAttempts.length === 0) {
      return NextResponse.json(
        { error: "Final exam not passed" },
        { status: 403 }
      );
    }

    // 3. Seat time met
    const { data: timeLogs } = await supabase
      .from("time_logs")
      .select("duration_seconds")
      .eq("enrollment_id", enrollmentId);

    const totalSeconds = (timeLogs || []).reduce(
      (sum, t) => sum + t.duration_seconds,
      0
    );
    const requiredSeconds = course.required_hours * 3600;

    if (totalSeconds < requiredSeconds) {
      return NextResponse.json(
        { error: "Seat time requirement not met" },
        { status: 403 }
      );
    }

    // 4. All modules completed + all quizzes passed
    const { data: sections } = await supabase
      .from("course_sections")
      .select(
        `
        id,
        course_modules (id, module_type)
      `
      )
      .eq("course_id", course.id);

    const allModuleIds = (sections || []).flatMap((s) =>
      (
        s.course_modules as unknown as Array<{
          id: string;
          module_type: string;
        }>
      ).map((m) => m.id)
    );

    const { data: progressRows } = await supabase
      .from("module_progress")
      .select("module_id, status, success_status")
      .eq("enrollment_id", enrollmentId)
      .in("module_id", allModuleIds);

    const progressMap = new Map(
      (progressRows || []).map((p) => [p.module_id, p])
    );

    for (const section of sections || []) {
      const modules = section.course_modules as unknown as Array<{
        id: string;
        module_type: string;
      }>;
      for (const mod of modules) {
        const progress = progressMap.get(mod.id);
        if (!progress || progress.status !== "completed") {
          return NextResponse.json(
            { error: "Not all modules completed" },
            { status: 403 }
          );
        }
        if (
          mod.module_type === "quiz" &&
          progress.success_status !== "passed"
        ) {
          return NextResponse.json(
            { error: "Not all quizzes passed" },
            { status: 403 }
          );
        }
      }
    }

    // ── Check if certificate already exists ──
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("id, certificate_number, pdf_url")
      .eq("enrollment_id", enrollmentId)
      .single();

    if (existingCert) {
      return NextResponse.json({
        certificateId: existingCert.id,
        certificateNumber: existingCert.certificate_number,
        pdfUrl: existingCert.pdf_url,
        alreadyExists: true,
      });
    }

    // ── Generate certificate ──
    const admin = createAdminClient();
    const meta = user.user_metadata || {};
    const studentName =
      meta.full_name ||
      [meta.first_name, meta.last_name].filter(Boolean).join(" ") ||
      user.email ||
      "Student";

    // Generate certificate number with retry on collision (up to 3 attempts)
    let certificateNumber = "";
    const MAX_CERT_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_CERT_RETRIES; attempt++) {
      const candidate = generateCertificateNumber(course.state, course.type);
      const { data: collision } = await admin
        .from("certificates")
        .select("id")
        .eq("certificate_number", candidate)
        .maybeSingle();
      if (!collision) {
        certificateNumber = candidate;
        break;
      }
    }
    if (!certificateNumber) {
      return NextResponse.json(
        { error: "Failed to generate unique certificate number" },
        { status: 500 }
      );
    }

    const completionDate = new Date().toISOString();
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    // Program name mapping
    const programNames: Record<string, string> = {
      life: "Florida 2-14 Life Including Annuities & Variable Contracts Pre-Licensing",
      health: "Florida 2-15 Health Insurance Pre-Licensing",
      combined:
        "Florida 2-15 Life, Health & Variable Annuity Pre-Licensing",
    };
    const programName = programNames[course.type] || course.name;

    const pdfBuffer = await generateCertificatePDF({
      studentName,
      courseName: programName,
      certificateNumber,
      totalHours,
      completionDate,
    });

    // ── Upload to Supabase Storage ──
    const storagePath = `${user.id}/${enrollmentId}.pdf`;

    const { error: uploadError } = await admin.storage
      .from("certificates")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Certificate upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload certificate" },
        { status: 500 }
      );
    }

    // ── Save certificate record ──
    const { data: cert, error: insertError } = await admin
      .from("certificates")
      .insert({
        enrollment_id: enrollmentId,
        certificate_number: certificateNumber,
        issued_at: completionDate,
        hours_completed: totalHours,
        pdf_url: storagePath,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Certificate insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save certificate record" },
        { status: 500 }
      );
    }

    // ── Update enrollment status to completed ──
    const { error: enrollUpdateError } = await admin
      .from("enrollments")
      .update({
        status: "completed",
        completed_at: completionDate,
      })
      .eq("id", enrollmentId);

    if (enrollUpdateError) {
      console.error("Enrollment status update error:", enrollUpdateError);
    }

    // ── Send certificate ready email ──
    if (user.email) {
      const certEmail = certificateReadyEmail({
        name: studentName,
        courseName: programName,
        certificateNumber,
        courseSlug: course.slug,
      });
      sendEmail({
        to: user.email,
        subject: certEmail.subject,
        html: certEmail.html,
      });
    }

    return NextResponse.json({
      certificateId: cert.id,
      certificateNumber,
      pdfUrl: storagePath,
      alreadyExists: false,
    });
  } catch (err) {
    console.error("Certificate generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
