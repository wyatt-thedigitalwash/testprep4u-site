-- TestPrep4U — Exam Modes
-- Adds learning mode vs exam mode support to the quiz/exam engine.
-- Learning mode: per-question rationale feedback.
-- Exam mode: no feedback, mark-for-review, review screen before submit.

-- ============================================================
-- EXAM_ATTEMPTS: add mode and marked_for_review columns
-- ============================================================

alter table public.exam_attempts
  add column if not exists mode text not null default 'learning'
    check (mode in ('learning', 'exam'));

alter table public.exam_attempts
  add column if not exists marked_for_review jsonb;
