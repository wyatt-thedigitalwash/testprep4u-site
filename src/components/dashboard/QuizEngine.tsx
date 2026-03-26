"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

export type QuizType = "section_quiz" | "practice" | "final";

interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  topic: string;
}

interface QuizResultDetail {
  questionId: string;
  question_text: string;
  options: string[];
  selectedIndex: number;
  correct_index: number;
  correct: boolean;
  explanation: string;
  topic: string;
}

interface TopicScore {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  results: QuizResultDetail[];
  topicBreakdown: TopicScore[];
}

interface QuizEngineProps {
  title: string;
  courseId: string;
  quizType: QuizType;
  sectionNumber?: number;
  passScore: number;
  onComplete?: (result: QuizResult) => void;
  onExit: () => void;
}

/* ── Component ─────────────────────────────────────────────── */

export function QuizEngine({
  title,
  courseId,
  quizType,
  sectionNumber,
  passScore,
  onComplete,
  onExit,
}: QuizEngineProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  /* Fetch questions on mount */
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/quiz/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: quizType, courseId, sectionNumber }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load questions");
        }

        const data = await res.json();
        setQuestions(data.questions);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load questions"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [quizType, courseId, sectionNumber]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasCurrentAnswer =
    currentQuestion && answers[currentQuestion.id] !== undefined;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (!currentQuestion || result) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
    },
    [currentQuestion, result]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: quizType,
          courseId,
          sectionNumber,
          answers: Object.entries(answers).map(
            ([questionId, selectedIndex]) => ({ questionId, selectedIndex })
          ),
          timeSpentSeconds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit quiz");
      }

      const data: QuizResult = await res.json();
      setResult(data);
      onComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }, [
    allAnswered,
    quizType,
    courseId,
    sectionNumber,
    answers,
    startTime,
    onComplete,
  ]);

  /* ── Loading state ──────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-blue-500" />
          <p className="mt-3 text-sm text-gray-500">Loading questions…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────── */

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-error">{error}</p>
          <button
            onClick={onExit}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-blue-500 px-6 py-2 font-body text-sm font-bold text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── No questions ───────────────────────────────────────── */

  if (questions.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            No questions available for this quiz.
          </p>
          <button
            onClick={onExit}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-blue-500 px-6 py-2 font-body text-sm font-bold text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Results state ──────────────────────────────────────── */

  if (result) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Score header */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
              result.passed ? "bg-success-light" : "bg-error-light"
            }`}
          >
            <span
              className={`font-display text-3xl font-extrabold ${
                result.passed ? "text-success" : "text-error"
              }`}
            >
              {result.score}%
            </span>
          </div>
          <div
            className={`mt-3 inline-block rounded-full px-4 py-1 text-sm font-bold ${
              result.passed
                ? "bg-success-light text-success"
                : "bg-error-light text-error"
            }`}
          >
            {result.passed ? "Passed" : "Not Passed"}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {result.correctAnswers} of {result.totalQuestions} correct ·{" "}
            {passScore}% required to pass
          </p>
        </div>

        {/* Topic breakdown */}
        {result.topicBreakdown.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-display text-lg font-semibold text-navy">
              Topic Breakdown
            </h3>
            <div className="space-y-4">
              {result.topicBreakdown.map((topic) => {
                const pct = topic.percentage;
                const color =
                  pct >= 80
                    ? "bg-success"
                    : pct >= 70
                      ? "bg-warning"
                      : "bg-error";
                const badge =
                  pct >= 80
                    ? {
                        bg: "bg-success-light",
                        text: "text-success",
                        label: "Strong",
                      }
                    : pct >= 70
                      ? {
                          bg: "bg-warning-light",
                          text: "text-warning",
                          label: "Moderate",
                        }
                      : {
                          bg: "bg-error-light",
                          text: "text-error",
                          label: "Weak",
                        };
                return (
                  <div key={topic.topic}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-navy">
                        {topic.topic}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy">
                          {topic.correct}/{topic.total}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question review */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-navy">
            Question Review
          </h3>
          <div className="space-y-4">
            {result.results.map((r, i) => (
              <div
                key={r.questionId}
                className={`rounded-lg border p-4 ${
                  r.correct
                    ? "border-success/30 bg-success-light/30"
                    : "border-error/30 bg-error-light/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {r.correct ? (
                    <CheckCircle
                      size={20}
                      className="mt-0.5 flex-shrink-0 text-success"
                    />
                  ) : (
                    <XCircle
                      size={20}
                      className="mt-0.5 flex-shrink-0 text-error"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy">
                      Q{i + 1}: {r.question_text}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Your answer:{" "}
                      <span
                        className={r.correct ? "text-success" : "text-error"}
                      >
                        {r.options[r.selectedIndex]}
                      </span>
                    </p>
                    {!r.correct && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Correct answer:{" "}
                        <span className="text-success">
                          {r.options[r.correct_index]}
                        </span>
                      </p>
                    )}
                    {r.explanation && (
                      <p className="mt-2 text-xs leading-relaxed text-gray-600">
                        {r.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return button */}
        <div className="flex justify-center">
          <button
            onClick={onExit}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-8 py-3 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
          >
            Return to Course
          </button>
        </div>
      </div>
    );
  }

  /* ── Active quiz state ──────────────────────────────────── */

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-navy">{title}</h2>
        <button
          onClick={onExit}
          className="text-sm text-gray-500 transition-colors hover:text-navy"
        >
          Exit Quiz
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-xs text-gray-400">
          {Object.keys(answers).length} of {questions.length} answered
        </span>
      </div>
      <div className="mb-8 h-2 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold leading-relaxed text-navy">
          {currentQuestion.question_text}
        </p>

        {/* Options */}
        <div className="mt-5 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = answers[currentQuestion.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-blue-500 bg-blue-100/40"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {letter}
                </span>
                <span className="text-sm text-gray-700">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-navy disabled:opacity-30 disabled:hover:text-gray-500"
          >
            <ArrowLeft size={16} /> Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-2.5 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />{" "}
                  Submitting…
                </>
              ) : (
                "Submit Quiz"
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasCurrentAnswer}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-6 py-2.5 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50"
            >
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Question navigator dots */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined;
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${
                isCurrent
                  ? "bg-blue-500 text-white"
                  : answered
                    ? "bg-blue-100 text-blue-500"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
