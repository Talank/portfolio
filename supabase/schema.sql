-- supabase/schema.sql
-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).
-- Creates the three tables used for optional cross-device sync. Nothing here
-- gates access to quiz content — these tables only ever hold progress/notes/
-- attempt history for signed-in users, and every row is owner-only via RLS.

-- ── DSA_tool: "module complete" progress ────────────────────────────────
create table if not exists dsa_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  completed  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table dsa_progress enable row level security;

create policy "select own dsa_progress" on dsa_progress
  for select using (auth.uid() = user_id);
create policy "insert own dsa_progress" on dsa_progress
  for insert with check (auth.uid() = user_id);
create policy "update own dsa_progress" on dsa_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own dsa_progress" on dsa_progress
  for delete using (auth.uid() = user_id);

-- ── DSA_tool: per-module free-text notes ────────────────────────────────
create table if not exists dsa_notes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table dsa_notes enable row level security;

create policy "select own dsa_notes" on dsa_notes
  for select using (auth.uid() = user_id);
create policy "insert own dsa_notes" on dsa_notes
  for insert with check (auth.uid() = user_id);
create policy "update own dsa_notes" on dsa_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own dsa_notes" on dsa_notes
  for delete using (auth.uid() = user_id);

-- ── AI Engineer Course: "lesson complete" progress ──────────────────────
create table if not exists ai_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  completed  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table ai_progress enable row level security;

create policy "select own ai_progress" on ai_progress
  for select using (auth.uid() = user_id);
create policy "insert own ai_progress" on ai_progress
  for insert with check (auth.uid() = user_id);
create policy "update own ai_progress" on ai_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own ai_progress" on ai_progress
  for delete using (auth.uid() = user_id);

-- ── AI Engineer Course: per-lesson free-text notes ──────────────────────
create table if not exists ai_notes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table ai_notes enable row level security;

create policy "select own ai_notes" on ai_notes
  for select using (auth.uid() = user_id);
create policy "insert own ai_notes" on ai_notes
  for insert with check (auth.uid() = user_id);
create policy "update own ai_notes" on ai_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own ai_notes" on ai_notes
  for delete using (auth.uid() = user_id);

-- ── NCLEX: quiz attempt history (append-only log) ───────────────────────
create table if not exists nclex_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  score           numeric not null,
  correct_answers int not null,
  total_questions int not null,
  max_difficulty  int not null,
  taken_at        timestamptz not null default now()
);

alter table nclex_attempts enable row level security;

create policy "select own nclex_attempts" on nclex_attempts
  for select using (auth.uid() = user_id);
create policy "insert own nclex_attempts" on nclex_attempts
  for insert with check (auth.uid() = user_id);
create policy "delete own nclex_attempts" on nclex_attempts
  for delete using (auth.uid() = user_id);

create index if not exists nclex_attempts_user_taken_idx
  on nclex_attempts (user_id, taken_at desc);

-- ── Full-Stack Java Course: "lesson complete" progress ───────────────────
create table if not exists java_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  completed  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table java_progress enable row level security;

create policy "select own java_progress" on java_progress
  for select using (auth.uid() = user_id);
create policy "insert own java_progress" on java_progress
  for insert with check (auth.uid() = user_id);
create policy "update own java_progress" on java_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own java_progress" on java_progress
  for delete using (auth.uid() = user_id);

-- ── Full-Stack Java Course: per-lesson free-text notes ───────────────────
create table if not exists java_notes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table java_notes enable row level security;

create policy "select own java_notes" on java_notes
  for select using (auth.uid() = user_id);
create policy "insert own java_notes" on java_notes
  for insert with check (auth.uid() = user_id);
create policy "update own java_notes" on java_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own java_notes" on java_notes
  for delete using (auth.uid() = user_id);

-- ── Linux / Emacs / CI-CD courses: "lesson complete" progress + notes ────
-- Same shape as java_progress/java_notes, one pair of tables per course.
create table if not exists linux_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  completed  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table linux_progress enable row level security;
create policy "select own linux_progress" on linux_progress
  for select using (auth.uid() = user_id);
create policy "insert own linux_progress" on linux_progress
  for insert with check (auth.uid() = user_id);
create policy "update own linux_progress" on linux_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own linux_progress" on linux_progress
  for delete using (auth.uid() = user_id);

create table if not exists linux_notes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table linux_notes enable row level security;
create policy "select own linux_notes" on linux_notes
  for select using (auth.uid() = user_id);
create policy "insert own linux_notes" on linux_notes
  for insert with check (auth.uid() = user_id);
create policy "update own linux_notes" on linux_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own linux_notes" on linux_notes
  for delete using (auth.uid() = user_id);

create table if not exists emacs_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  completed  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table emacs_progress enable row level security;
create policy "select own emacs_progress" on emacs_progress
  for select using (auth.uid() = user_id);
create policy "insert own emacs_progress" on emacs_progress
  for insert with check (auth.uid() = user_id);
create policy "update own emacs_progress" on emacs_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own emacs_progress" on emacs_progress
  for delete using (auth.uid() = user_id);

create table if not exists emacs_notes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table emacs_notes enable row level security;
create policy "select own emacs_notes" on emacs_notes
  for select using (auth.uid() = user_id);
create policy "insert own emacs_notes" on emacs_notes
  for insert with check (auth.uid() = user_id);
create policy "update own emacs_notes" on emacs_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own emacs_notes" on emacs_notes
  for delete using (auth.uid() = user_id);

create table if not exists cicd_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  completed  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table cicd_progress enable row level security;
create policy "select own cicd_progress" on cicd_progress
  for select using (auth.uid() = user_id);
create policy "insert own cicd_progress" on cicd_progress
  for insert with check (auth.uid() = user_id);
create policy "update own cicd_progress" on cicd_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own cicd_progress" on cicd_progress
  for delete using (auth.uid() = user_id);

create table if not exists cicd_notes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table cicd_notes enable row level security;
create policy "select own cicd_notes" on cicd_notes
  for select using (auth.uid() = user_id);
create policy "insert own cicd_notes" on cicd_notes
  for insert with check (auth.uid() = user_id);
create policy "update own cicd_notes" on cicd_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own cicd_notes" on cicd_notes
  for delete using (auth.uid() = user_id);
