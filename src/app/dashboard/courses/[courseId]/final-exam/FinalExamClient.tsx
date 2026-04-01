"use client";

import { useRouter } from "next/navigation";
import { QuizEngine } from "@/components/dashboard/QuizEngine";

interface FinalExamClientProps {
  courseId: string;
}

// ⚠ TODO (COMPLIANCE): Florida DFS may require a timed final exam.
// Before launch, confirm with legal whether a countdown timer and time limit
// enforcement are needed. If so, add a timer prop to QuizEngine and enforce
// the limit both client-side (UI countdown) and server-side (reject late submissions).
export function FinalExamClient({ courseId }: FinalExamClientProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl py-4">
      <QuizEngine
        title="Final Exam"
        courseId={courseId}
        quizType="final"
        passScore={70}
        mode="exam"
        onExit={() => router.push(`/dashboard/courses/${courseId}`)}
      />
    </div>
  );
}
