import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCourseDetail } from "@/lib/course-data";
import { CourseDetailView } from "@/components/dashboard/CourseDetailView";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId);

  if (!detail) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-navy"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <CourseDetailView detail={detail} courseSlug={courseId} />
    </div>
  );
}
