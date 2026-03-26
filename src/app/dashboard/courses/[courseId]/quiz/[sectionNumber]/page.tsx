"use client";

import { useParams, useRouter } from "next/navigation";
import { QuizEngine } from "@/components/dashboard/QuizEngine";

export default function SectionQuizPage() {
  const params = useParams<{ courseId: string; sectionNumber: string }>();
  const router = useRouter();

  const sectionNumber = parseInt(params.sectionNumber, 10);

  return (
    <div className="mx-auto max-w-5xl py-4">
      <QuizEngine
        title={`Part ${sectionNumber} Quiz`}
        courseId={params.courseId}
        quizType="section_quiz"
        sectionNumber={sectionNumber}
        passScore={70}
        onExit={() => router.push(`/dashboard/courses/${params.courseId}`)}
      />
    </div>
  );
}
