"use client";

import { useRouter } from "next/navigation";
import { QuizEngine } from "@/components/dashboard/QuizEngine";

interface SectionQuizClientProps {
  courseId: string;
  sectionNumber: number;
}

export function SectionQuizClient({
  courseId,
  sectionNumber,
}: SectionQuizClientProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl py-4">
      <QuizEngine
        title={`Part ${sectionNumber} Quiz`}
        courseId={courseId}
        quizType="section_quiz"
        sectionNumber={sectionNumber}
        passScore={70}
        onExit={() => router.push(`/dashboard/courses/${courseId}`)}
      />
    </div>
  );
}
