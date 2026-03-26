import { redirect } from "next/navigation";
import { getCourseDetail } from "@/lib/course-data";
import { FinalExamClient } from "./FinalExamClient";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function FinalExamPage({ params }: PageProps) {
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId);

  // No enrollment or course not found → redirect
  if (!detail) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  // Must have all sections complete to take final exam
  if (!detail.canTakeFinalExam) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  return <FinalExamClient courseId={courseId} />;
}
