"use client";

import { useRouter } from "next/navigation";
import { QuizEngine } from "@/components/dashboard/QuizEngine";

interface FinalExamClientProps {
  courseId: string;
}

// TODO: Add a countdown timer for the final exam (enforce time limit per FL DFS requirements).
export function FinalExamClient({ courseId }: FinalExamClientProps) {
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
