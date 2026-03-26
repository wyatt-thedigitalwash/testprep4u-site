-- ============================================================
-- 002_course_architecture.sql
-- Replaces the simple course/chapter/scorm_progress tables from 001
-- with the full section → module architecture, native exam engine,
-- audit-grade time logging, and self-study affidavit support.
-- ============================================================

-- ── Drop old tables that are being replaced ─────────────────
drop table if exists public.chapter_progress cascade;
drop table if exists public.scorm_progress cascade;
drop table if exists public.exam_attempts cascade;
drop table if exists public.certificates cascade;

-- ── Alter courses: remove fields moved to module level ──────
alter table public.courses drop column if exists scorm_entry_path;
alter table public.courses drop column if exists total_chapters;

-- ── Alter enrollments: add affidavit field ──────────────────
alter table public.enrollments
  add column if not exists affidavit_accepted_at timestamptz;

-- ============================================================
-- COURSE_SECTIONS
-- ============================================================

create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_number integer not null,
  title text not null,
  sort_order integer not null,
  unique (course_id, section_number)
);

create index idx_course_sections_course_id on public.course_sections(course_id);

alter table public.course_sections enable row level security;

-- Sections are public read (part of course catalog)
create policy "Anyone can read course sections"
  on public.course_sections for select
  using (true);

-- ============================================================
-- COURSE_MODULES
-- ============================================================

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.course_sections(id) on delete cascade,
  module_type text not null check (module_type in ('lesson', 'quiz')),
  title text not null,
  scorm_entry_path text not null,
  sort_order integer not null,
  quiz_pass_score numeric check (quiz_pass_score >= 0 and quiz_pass_score <= 100),
  unique (section_id, sort_order)
);

create index idx_course_modules_section_id on public.course_modules(section_id);

alter table public.course_modules enable row level security;

-- Modules are public read (part of course catalog)
create policy "Anyone can read course modules"
  on public.course_modules for select
  using (true);

-- ============================================================
-- MODULE_PROGRESS
-- Replaces both scorm_progress and chapter_progress.
-- One row per enrollment × module with full SCORM CMI data.
-- ============================================================

create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  module_id uuid not null references public.course_modules(id),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  cmi_data jsonb not null default '{}'::jsonb,
  completion_status text not null default 'not attempted'
    check (completion_status in ('not attempted', 'incomplete', 'completed')),
  success_status text not null default 'unknown'
    check (success_status in ('unknown', 'passed', 'failed')),
  score numeric check (score >= 0 and score <= 100),
  time_spent_seconds integer not null default 0,
  last_accessed timestamptz,
  bookmark text,
  completed_at timestamptz,
  unique (enrollment_id, module_id)
);

create index idx_module_progress_enrollment_id on public.module_progress(enrollment_id);
create index idx_module_progress_module_id on public.module_progress(module_id);

alter table public.module_progress enable row level security;

create policy "Users can read own module progress"
  on public.module_progress for select
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

create policy "Users can insert own module progress"
  on public.module_progress for insert
  with check (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

create policy "Users can update own module progress"
  on public.module_progress for update
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

-- ============================================================
-- TIME_LOGS
-- Immutable audit trail for Florida DFS compliance.
-- Each row is a discrete study session. Records retained 3+ years.
-- ============================================================

create table public.time_logs (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  module_id uuid references public.course_modules(id),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  source text not null check (source in ('scorm', 'practice_exam', 'final_exam'))
);

create index idx_time_logs_enrollment_id on public.time_logs(enrollment_id);
create index idx_time_logs_module_id on public.time_logs(module_id);

alter table public.time_logs enable row level security;

create policy "Users can read own time logs"
  on public.time_logs for select
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

-- Time logs are written by API routes (service role) or user context
create policy "Users can insert own time logs"
  on public.time_logs for insert
  with check (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

-- Time logs are NEVER updated or deleted (immutable audit trail)

-- ============================================================
-- EXAM_ATTEMPTS (recreated with expanded schema)
-- Native quiz engine — Practice Exam and Final Exam are NOT SCORM.
-- ============================================================

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  exam_type text not null check (exam_type in ('practice', 'final')),
  score numeric not null check (score >= 0 and score <= 100),
  total_questions integer not null,
  correct_answers integer not null,
  passed boolean not null,
  time_spent_seconds integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  attempted_at timestamptz not null default now()
);

create index idx_exam_attempts_enrollment_id on public.exam_attempts(enrollment_id);

alter table public.exam_attempts enable row level security;

create policy "Users can read own exam attempts"
  on public.exam_attempts for select
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

create policy "Users can insert own exam attempts"
  on public.exam_attempts for insert
  with check (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

-- ============================================================
-- QUESTION_BANK
-- Questions for the native Practice Exam and Final Exam.
-- ============================================================

create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  topic text not null,
  question_text text not null,
  options jsonb not null,
  correct_index integer not null,
  explanation text not null default '',
  exam_type text not null default 'both'
    check (exam_type in ('practice', 'final', 'both'))
);

create index idx_question_bank_course_id on public.question_bank(course_id);
create index idx_question_bank_topic on public.question_bank(topic);

alter table public.question_bank enable row level security;

-- Questions are read by authenticated users during exams
create policy "Authenticated users can read questions"
  on public.question_bank for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- CERTIFICATES (recreated — same schema as 001, no changes)
-- ============================================================

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid unique not null references public.enrollments(id) on delete cascade,
  certificate_number text unique not null,
  issued_at timestamptz not null default now(),
  hours_completed numeric not null,
  pdf_url text not null
);

create index idx_certificates_enrollment_id on public.certificates(enrollment_id);

alter table public.certificates enable row level security;

create policy "Users can read own certificates"
  on public.certificates for select
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

create policy "Service role can insert certificates"
  on public.certificates for insert
  with check (true);
