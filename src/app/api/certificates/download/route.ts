import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get("enrollmentId");

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "Missing enrollmentId" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, user_id")
      .eq("id", enrollmentId)
      .single();

    if (!enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get certificate
    const { data: cert } = await supabase
      .from("certificates")
      .select("pdf_url")
      .eq("enrollment_id", enrollmentId)
      .single();

    if (!cert) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const admin = createAdminClient();
    const { data: signedUrl, error: signError } = await admin.storage
      .from("certificates")
      .createSignedUrl(cert.pdf_url, 3600);

    if (signError || !signedUrl) {
      console.error("Signed URL error:", signError);
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signedUrl.signedUrl });
  } catch (err) {
    console.error("Certificate download error:", err);
    return NextResponse.json(
      { error: "Failed to get certificate" },
      { status: 500 }
    );
  }
}
