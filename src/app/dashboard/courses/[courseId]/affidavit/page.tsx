import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCourseDetail } from "@/lib/course-data";
import { AffidavitForm } from "@/components/dashboard/AffidavitForm";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function AffidavitPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const detail = await getCourseDetail(courseId);
  if (!detail) redirect("/dashboard");

  // Must have passed final exam and met seat time to access affidavit
  if (!detail.finalExamPassed || !detail.meetsHourRequirement) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  // Already signed — go to certificate
  if (detail.hasAffidavit) {
    redirect(`/dashboard/courses/${courseId}/certificate`);
  }

  const meta = user.user_metadata || {};
  const studentName =
    meta.full_name ||
    [meta.first_name, meta.last_name].filter(Boolean).join(" ") ||
    user.email ||
    "";

  const totalHours = Math.round((detail.totalTimeSeconds / 3600) * 10) / 10;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-navy"
      >
        <ArrowLeft size={16} /> Back to {detail.enrollment.courseName}
      </Link>

      <AffidavitForm
        enrollmentId={detail.enrollment.enrollmentId}
        courseName={detail.enrollment.courseName}
        studentName={studentName}
        totalHours={totalHours}
        courseSlug={courseId}
      />
    </div>
  );
}
