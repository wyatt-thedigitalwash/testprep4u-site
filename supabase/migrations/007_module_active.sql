-- Adds active toggle to course_modules for admin management.

alter table public.course_modules
  add column if not exists active boolean not null default true;
