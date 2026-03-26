"use client";

import { useRouter } from "next/navigation";
import { QuizEngine } from "@/components/dashboard/QuizEngine";

interface PracticeExamClientProps {
  courseId: string;
}

export function PracticeExamClient({ courseId }: PracticeExamClientProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl py-4">
      <QuizEngine
        title="Practice Exam"
        courseId={courseId}
        quizType="practice"
        passScore={80}
        onExit={() => router.push(`/dashboard/courses/${courseId}/exams`)}
      />
    </div>
  );
}
