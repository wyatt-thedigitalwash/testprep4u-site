-- TestPrep4U — Initial Database Schema
-- Phase 3: Production Build
-- All tables use Row Level Security (RLS)

-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  state text not null,
  phone text,
  plan_tier text not null check (plan_tier in ('essentials', 'pro', 'premium')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Profile is created by a trigger, not by the user directly
create policy "Service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, state, plan_tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'state', ''),
    'essentials'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- COURSES
-- ============================================================

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type text not null check (type in ('life', 'health', 'combined')),
  state text not null,
  scorm_entry_path text not null,
  total_chapters integer not null,
  required_hours numeric not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

-- Courses are public read — anyone can browse the catalog
create policy "Anyone can read active courses"
  on public.courses for select
  using (active = true);

-- ============================================================
-- ENROLLMENTS
-- ============================================================

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  status text not null default 'active' check (status in ('active', 'completed', 'expired')),
  enrolled_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz
);

create index idx_enrollments_user_id on public.enrollments(user_id);
create index idx_enrollments_course_id on public.enrollments(course_id);

alter table public.enrollments enable row level security;

create policy "Users can read own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

-- Enrollments are created by the Stripe webhook (service role), not by users
create policy "Service role can insert enrollments"
  on public.enrollments for insert
  with check (true);

create policy "Service role can update enrollments"
  on public.enrollments for update
  using (true);

-- ============================================================
-- SCORM_PROGRESS
-- ============================================================

create table public.scorm_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid unique not null references public.enrollments(id) on delete cascade,
  cmi_data jsonb not null default '{}'::jsonb,
  completion_status text not null default 'not attempted'
    check (completion_status in ('not attempted', 'incomplete', 'completed')),
  success_status text not null default 'unknown'
    check (success_status in ('unknown', 'passed', 'failed')),
  score numeric check (score >= 0 and score <= 100),
  total_time_seconds integer not null default 0,
  last_accessed timestamptz,
  bookmark text
);

create index idx_scorm_progress_enrollment_id on public.scorm_progress(enrollment_id);

alter table public.scorm_progress enable row level security;

create policy "Users can read own scorm progress"
  on public.scorm_progress for select
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

create policy "Users can insert own scorm progress"
  on public.scorm_progress for insert
  with check (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

create policy "Users can update own scorm progress"
  on public.scorm_progress for update
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

-- ============================================================
-- CHAPTER_PROGRESS
-- ============================================================

create table public.chapter_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  chapter_number integer not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  time_spent_seconds integer not null default 0,
  completed_at timestamptz,
  unique (enrollment_id, chapter_number)
);

create index idx_chapter_progress_enrollment_id on public.chapter_progress(enrollment_id);

alter table public.chapter_progress enable row level security;

create policy "Users can read own chapter progress"
  on public.chapter_progress for select
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

create policy "Users can insert own chapter progress"
  on public.chapter_progress for insert
  with check (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

create policy "Users can update own chapter progress"
  on public.chapter_progress for update
  using (
    enrollment_id in (
      select id from public.enrollments where user_id = auth.uid()
    )
  );

-- ============================================================
-- EXAM_ATTEMPTS
-- ============================================================

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  exam_type text not null check (exam_type in ('practice', 'final')),
  score numeric not null check (score >= 0 and score <= 100),
  total_questions integer not null,
  passed boolean not null,
  topic_breakdown jsonb not null default '{}'::jsonb,
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
-- CERTIFICATES
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

-- Certificates are created server-side (service role) on course completion
create policy "Service role can insert certificates"
  on public.certificates for insert
  with check (true);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('scorm-packages', 'scorm-packages', false),
  ('certificates', 'certificates', false);

-- Authenticated users can read SCORM packages (signed URLs generated server-side)
create policy "Authenticated users can read scorm packages"
  on storage.objects for select
  using (bucket_id = 'scorm-packages' and auth.role() = 'authenticated');

-- Users can read their own certificates
create policy "Users can read own certificates"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
