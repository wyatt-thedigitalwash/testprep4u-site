"use client";

import { useParams, useRouter } from "next/navigation";
import { QuizEngine } from "@/components/dashboard/QuizEngine";

export default function FinalExamPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl py-4">
      <QuizEngine
        title="Final Exam"
        courseId={courseId}
        quizType="final"
        passScore={70}
        onExit={() => router.push(`/dashboard/courses/${courseId}`)}
      />
    </div>
  );
}
