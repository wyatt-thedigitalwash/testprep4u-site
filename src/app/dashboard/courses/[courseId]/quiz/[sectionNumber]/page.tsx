import { redirect } from "next/navigation";
import { getCourseDetail } from "@/lib/course-data";
import { SectionQuizClient } from "./SectionQuizClient";

interface PageProps {
  params: Promise<{ courseId: string; sectionNumber: string }>;
}

export default async function SectionQuizPage({ params }: PageProps) {
  const { courseId, sectionNumber: sectionNumStr } = await params;
  const sectionNumber = parseInt(sectionNumStr, 10);

  if (isNaN(sectionNumber)) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  const detail = await getCourseDetail(courseId);

  // No enrollment or course not found → redirect
  if (!detail) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  // Find the target section
  const targetSection = detail.sections.find(
    (s) => s.sectionNumber === sectionNumber
  );

  if (!targetSection) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  // Verify section is unlocked
  if (!targetSection.isUnlocked) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  // Verify all lesson modules in this section are completed
  const allLessonsComplete = targetSection.modules
    .filter((m) => m.moduleType === "lesson")
    .every((m) => m.progress?.status === "completed");

  if (!allLessonsComplete) {
    redirect(`/dashboard/courses/${courseId}`);
  }

  return <SectionQuizClient courseId={courseId} sectionNumber={sectionNumber} />;
}
