-- SAIL Undergraduate Training Portal.
-- Run this once in Supabase Dashboard -> SQL Editor.
--
-- After running this file:
-- 1. Open /training/ and login once with the shared admin email.
-- 2. In Supabase SQL Editor, promote that email:
--
--    insert into public.training_profiles (auth_user_id, email, full_name, role)
--    select id, email, 'SAIL Admin', 'admin'::public.training_role
--    from auth.users
--    where lower(email) = lower('admin-email@vinuni.edu.vn')
--    on conflict (auth_user_id) do update
--    set role = 'admin'::public.training_role,
--        full_name = excluded.full_name,
--        email = excluded.email;
--
-- The website is static, so all security-critical checks live in RLS policies
-- and SECURITY DEFINER RPC functions below.

create extension if not exists pgcrypto;

do $$ begin
  create type public.training_role as enum ('student', 'reviewer', 'admin', 'super_admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_module_pillar as enum (
    'math',
    'deep_learning',
    'trustworthy_ai',
    'distributed_learning',
    'efficient_ml',
    'project'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_project_difficulty as enum ('intro', 'standard', 'advanced');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_enrollment_status as enum (
    'enrolled',
    'in_progress',
    'submitted',
    'completed',
    'failed',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_result as enum ('excellent', 'pass', 'revision', 'fail');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_submission_status as enum ('submitted', 'reviewed', 'revision_locked');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.training_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text,
  duration_weeks_min integer not null default 4 check (duration_weeks_min > 0),
  duration_weeks_max integer not null default 8 check (duration_weeks_max >= duration_weeks_min),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  affiliation text,
  role public.training_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists training_profiles_email_lower_unique
on public.training_profiles (lower(email));

create table if not exists public.training_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  email_allowed text,
  role_default public.training_role not null default 'student',
  track_id uuid not null references public.training_tracks(id) on delete cascade,
  expires_at timestamptz,
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_by_profile_id uuid references public.training_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (used_count <= max_uses)
);

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.training_tracks(id) on delete cascade,
  title text not null,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  pillar public.training_module_pillar not null,
  order_index integer not null default 0,
  description text,
  is_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track_id, slug)
);

create table if not exists public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  title text not null,
  material_url text,
  description text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists training_lessons_module_title_unique
on public.training_lessons (module_id, title);

create table if not exists public.training_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null,
  pillar public.training_module_pillar not null,
  difficulty public.training_project_difficulty not null default 'standard',
  material_url text,
  expected_output text,
  is_active boolean not null default true,
  created_by_profile_id uuid references public.training_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.training_profiles(id) on delete cascade,
  track_id uuid not null references public.training_tracks(id) on delete restrict,
  invite_id uuid references public.training_invites(id) on delete set null,
  start_date date not null default current_date,
  deadline_at timestamptz not null,
  status public.training_enrollment_status not null default 'enrolled',
  final_result public.training_result,
  assigned_project_id uuid references public.training_projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, track_id)
);

create table if not exists public.training_submissions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  module_id uuid references public.training_modules(id) on delete cascade,
  project_id uuid references public.training_projects(id) on delete cascade,
  drive_url text not null check (drive_url ~* '^https?://'),
  note text,
  status public.training_submission_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (((module_id is not null)::integer + (project_id is not null)::integer) = 1)
);

create table if not exists public.training_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.training_submissions(id) on delete cascade,
  reviewer_profile_id uuid not null references public.training_profiles(id) on delete restrict,
  result public.training_result not null,
  comment text,
  reviewed_at timestamptz not null default now()
);

create table if not exists public.training_certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.training_enrollments(id) on delete cascade,
  certificate_code text not null unique,
  display_name text not null,
  program_title text not null default 'SAIL Undergraduate Training Program',
  result public.training_result not null check (result in ('excellent', 'pass')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.training_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists training_tracks_updated_at on public.training_tracks;
create trigger training_tracks_updated_at
before update on public.training_tracks
for each row execute function public.training_set_updated_at();

drop trigger if exists training_profiles_updated_at on public.training_profiles;
create trigger training_profiles_updated_at
before update on public.training_profiles
for each row execute function public.training_set_updated_at();

drop trigger if exists training_invites_updated_at on public.training_invites;
create trigger training_invites_updated_at
before update on public.training_invites
for each row execute function public.training_set_updated_at();

drop trigger if exists training_modules_updated_at on public.training_modules;
create trigger training_modules_updated_at
before update on public.training_modules
for each row execute function public.training_set_updated_at();

drop trigger if exists training_lessons_updated_at on public.training_lessons;
create trigger training_lessons_updated_at
before update on public.training_lessons
for each row execute function public.training_set_updated_at();

drop trigger if exists training_projects_updated_at on public.training_projects;
create trigger training_projects_updated_at
before update on public.training_projects
for each row execute function public.training_set_updated_at();

drop trigger if exists training_enrollments_updated_at on public.training_enrollments;
create trigger training_enrollments_updated_at
before update on public.training_enrollments
for each row execute function public.training_set_updated_at();

drop trigger if exists training_submissions_updated_at on public.training_submissions;
create trigger training_submissions_updated_at
before update on public.training_submissions
for each row execute function public.training_set_updated_at();

create or replace function public.training_has_role(allowed_roles public.training_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.training_profiles
    where auth_user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.training_current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.training_profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.get_training_invite(invite_token text)
returns table (
  track_title text,
  track_description text,
  duration_weeks_min integer,
  duration_weeks_max integer,
  email_allowed text,
  expires_at timestamptz,
  remaining_uses integer,
  is_usable boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    t.title,
    t.description,
    t.duration_weeks_min,
    t.duration_weeks_max,
    i.email_allowed,
    i.expires_at,
    greatest(i.max_uses - i.used_count, 0),
    (
      i.is_active
      and t.is_active
      and (i.expires_at is null or i.expires_at > now())
      and i.used_count < i.max_uses
    ) as is_usable
  from public.training_invites i
  join public.training_tracks t on t.id = i.track_id
  where i.token = invite_token;
end;
$$;

create or replace function public.enroll_training(
  invite_token text,
  full_name text,
  affiliation text default null
)
returns public.training_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.training_invites%rowtype;
  v_track public.training_tracks%rowtype;
  v_profile public.training_profiles%rowtype;
  v_enrollment public.training_enrollments%rowtype;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Login is required before enrollment.';
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    raise exception 'This login session has no email address.';
  end if;

  if length(trim(coalesce(full_name, ''))) < 2 then
    raise exception 'Full name is required.';
  end if;

  select * into v_invite
  from public.training_invites
  where token = invite_token
  for update;

  if not found then
    raise exception 'Invite link is invalid.';
  end if;

  if not v_invite.is_active
    or (v_invite.expires_at is not null and v_invite.expires_at <= now())
    or v_invite.used_count >= v_invite.max_uses then
    raise exception 'Invite link is expired or fully used.';
  end if;

  if v_invite.email_allowed is not null and lower(v_invite.email_allowed) <> v_email then
    raise exception 'This invite is assigned to a different email address.';
  end if;

  select * into v_track
  from public.training_tracks
  where id = v_invite.track_id and is_active = true;

  if not found then
    raise exception 'Training track is not active.';
  end if;

  insert into public.training_profiles (auth_user_id, email, full_name, affiliation, role)
  values (auth.uid(), v_email, trim(full_name), nullif(trim(coalesce(affiliation, '')), ''), v_invite.role_default)
  on conflict (auth_user_id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    affiliation = coalesce(excluded.affiliation, public.training_profiles.affiliation)
  returning * into v_profile;

  select * into v_enrollment
  from public.training_enrollments
  where profile_id = v_profile.id and track_id = v_track.id;

  if found then
    return v_enrollment;
  end if;

  update public.training_invites
  set used_count = used_count + 1
  where id = v_invite.id;

  insert into public.training_enrollments (
    profile_id,
    track_id,
    invite_id,
    start_date,
    deadline_at,
    status
  )
  values (
    v_profile.id,
    v_track.id,
    v_invite.id,
    current_date,
    now() + make_interval(weeks => v_track.duration_weeks_max),
    'in_progress'
  )
  returning * into v_enrollment;

  return v_enrollment;
end;
$$;

create or replace function public.submit_training_work(
  target_enrollment_id uuid,
  target_module_id uuid default null,
  target_project_id uuid default null,
  submission_drive_url text default null,
  submission_note text default null
)
returns public.training_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.training_enrollments%rowtype;
  v_profile_id uuid;
  v_submission public.training_submissions%rowtype;
begin
  v_profile_id := public.training_current_profile_id();
  if v_profile_id is null then
    raise exception 'Training profile is required.';
  end if;

  if ((target_module_id is not null)::integer + (target_project_id is not null)::integer) <> 1 then
    raise exception 'Submit either one module or one project.';
  end if;

  if submission_drive_url is null or submission_drive_url !~* '^https?://' then
    raise exception 'A valid Google Drive or document URL is required.';
  end if;

  select * into v_enrollment
  from public.training_enrollments
  where id = target_enrollment_id
    and profile_id = v_profile_id;

  if not found then
    raise exception 'Enrollment not found.';
  end if;

  if now() > v_enrollment.deadline_at then
    raise exception 'The training deadline has passed.';
  end if;

  if v_enrollment.status in ('completed', 'failed', 'expired') then
    raise exception 'This enrollment is closed.';
  end if;

  if target_module_id is not null and not exists (
    select 1
    from public.training_modules
    where id = target_module_id
      and track_id = v_enrollment.track_id
      and is_active = true
  ) then
    raise exception 'Module is not part of this training track.';
  end if;

  if target_project_id is not null and v_enrollment.assigned_project_id is distinct from target_project_id then
    raise exception 'This mini-project is not assigned to the enrollment.';
  end if;

  insert into public.training_submissions (
    enrollment_id,
    module_id,
    project_id,
    drive_url,
    note,
    status
  )
  values (
    target_enrollment_id,
    target_module_id,
    target_project_id,
    trim(submission_drive_url),
    nullif(trim(coalesce(submission_note, '')), ''),
    'submitted'
  )
  returning * into v_submission;

  return v_submission;
end;
$$;

create or replace function public.review_training_submission(
  target_submission_id uuid,
  review_result public.training_result,
  review_comment text default null
)
returns public.training_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviewer_id uuid;
  v_review public.training_reviews%rowtype;
begin
  if not public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[]) then
    raise exception 'Reviewer permission is required.';
  end if;

  v_reviewer_id := public.training_current_profile_id();
  if v_reviewer_id is null then
    raise exception 'Reviewer profile is required.';
  end if;

  if not exists (select 1 from public.training_submissions where id = target_submission_id) then
    raise exception 'Submission not found.';
  end if;

  insert into public.training_reviews (
    submission_id,
    reviewer_profile_id,
    result,
    comment
  )
  values (
    target_submission_id,
    v_reviewer_id,
    review_result,
    nullif(trim(coalesce(review_comment, '')), '')
  )
  returning * into v_review;

  update public.training_submissions
  set status = 'reviewed'
  where id = target_submission_id;

  return v_review;
end;
$$;

create or replace function public.set_training_final_result(
  target_enrollment_id uuid,
  target_result public.training_result
)
returns public.training_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.training_enrollments%rowtype;
  v_profile public.training_profiles%rowtype;
  v_track public.training_tracks%rowtype;
  v_code text;
begin
  if not public.training_has_role(array['admin', 'super_admin']::public.training_role[]) then
    raise exception 'Admin permission is required.';
  end if;

  select * into v_enrollment
  from public.training_enrollments
  where id = target_enrollment_id
  for update;

  if not found then
    raise exception 'Enrollment not found.';
  end if;

  select * into v_profile
  from public.training_profiles
  where id = v_enrollment.profile_id;

  select * into v_track
  from public.training_tracks
  where id = v_enrollment.track_id;

  update public.training_enrollments
  set
    final_result = target_result,
    status = case
      when target_result in ('excellent', 'pass') then 'completed'::public.training_enrollment_status
      when target_result = 'fail' then 'failed'::public.training_enrollment_status
      else 'in_progress'::public.training_enrollment_status
    end
  where id = target_enrollment_id
  returning * into v_enrollment;

  if target_result in ('excellent', 'pass') then
    v_code := 'SAIL-UG-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(v_enrollment.id::text, '-', ''), 1, 8));

    insert into public.training_certificates (
      enrollment_id,
      certificate_code,
      display_name,
      program_title,
      result
    )
    values (
      v_enrollment.id,
      v_code,
      v_profile.full_name,
      coalesce(v_track.title, 'SAIL Undergraduate Training Program'),
      target_result
    )
    on conflict (enrollment_id) do update
    set
      result = excluded.result,
      display_name = excluded.display_name,
      program_title = excluded.program_title,
      revoked_at = null;
  end if;

  return v_enrollment;
end;
$$;

create or replace function public.verify_training_certificate(lookup_code text)
returns table (
  certificate_code text,
  display_name text,
  program_title text,
  result public.training_result,
  issued_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    certificate_code,
    display_name,
    program_title,
    result,
    issued_at
  from public.training_certificates
  where lower(certificate_code) = lower(trim(lookup_code))
    and revoked_at is null
  limit 1;
$$;

alter table public.training_tracks enable row level security;
alter table public.training_profiles enable row level security;
alter table public.training_invites enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_lessons enable row level security;
alter table public.training_projects enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.training_submissions enable row level security;
alter table public.training_reviews enable row level security;
alter table public.training_certificates enable row level security;

drop policy if exists "Training profiles are visible to owners and staff" on public.training_profiles;
create policy "Training profiles are visible to owners and staff"
on public.training_profiles
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Students can create their own training profile" on public.training_profiles;
create policy "Students can create their own training profile"
on public.training_profiles
for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and role = 'student'
);

drop policy if exists "Students can update their own basic profile" on public.training_profiles;
create policy "Students can update their own basic profile"
on public.training_profiles
for update
to authenticated
using (
  auth_user_id = auth.uid()
  or public.training_has_role(array['admin', 'super_admin']::public.training_role[])
)
with check (
  public.training_has_role(array['admin', 'super_admin']::public.training_role[])
  or (auth_user_id = auth.uid() and role = 'student')
);

drop policy if exists "Active tracks are visible after login" on public.training_tracks;
create policy "Active tracks are visible after login"
on public.training_tracks
for select
to authenticated
using (
  is_active = true
  or public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Admins manage training tracks" on public.training_tracks;
create policy "Admins manage training tracks"
on public.training_tracks
for all
to authenticated
using (public.training_has_role(array['admin', 'super_admin']::public.training_role[]))
with check (public.training_has_role(array['admin', 'super_admin']::public.training_role[]));

drop policy if exists "Admins manage training invites" on public.training_invites;
create policy "Admins manage training invites"
on public.training_invites
for all
to authenticated
using (public.training_has_role(array['admin', 'super_admin']::public.training_role[]))
with check (public.training_has_role(array['admin', 'super_admin']::public.training_role[]));

drop policy if exists "Active modules are visible after login" on public.training_modules;
create policy "Active modules are visible after login"
on public.training_modules
for select
to authenticated
using (
  is_active = true
  or public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Admins manage training modules" on public.training_modules;
create policy "Admins manage training modules"
on public.training_modules
for all
to authenticated
using (public.training_has_role(array['admin', 'super_admin']::public.training_role[]))
with check (public.training_has_role(array['admin', 'super_admin']::public.training_role[]));

drop policy if exists "Active lessons are visible after login" on public.training_lessons;
create policy "Active lessons are visible after login"
on public.training_lessons
for select
to authenticated
using (
  is_active = true
  or public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Admins manage training lessons" on public.training_lessons;
create policy "Admins manage training lessons"
on public.training_lessons
for all
to authenticated
using (public.training_has_role(array['admin', 'super_admin']::public.training_role[]))
with check (public.training_has_role(array['admin', 'super_admin']::public.training_role[]));

drop policy if exists "Active projects are visible after login" on public.training_projects;
create policy "Active projects are visible after login"
on public.training_projects
for select
to authenticated
using (
  is_active = true
  or public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Admins manage training projects" on public.training_projects;
create policy "Admins manage training projects"
on public.training_projects
for all
to authenticated
using (public.training_has_role(array['admin', 'super_admin']::public.training_role[]))
with check (public.training_has_role(array['admin', 'super_admin']::public.training_role[]));

drop policy if exists "Enrollments are visible to owners and staff" on public.training_enrollments;
create policy "Enrollments are visible to owners and staff"
on public.training_enrollments
for select
to authenticated
using (
  profile_id = public.training_current_profile_id()
  or public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Admins manage enrollments" on public.training_enrollments;
create policy "Admins manage enrollments"
on public.training_enrollments
for all
to authenticated
using (public.training_has_role(array['admin', 'super_admin']::public.training_role[]))
with check (public.training_has_role(array['admin', 'super_admin']::public.training_role[]));

drop policy if exists "Submissions are visible to owners and staff" on public.training_submissions;
create policy "Submissions are visible to owners and staff"
on public.training_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.training_enrollments e
    where e.id = enrollment_id
      and e.profile_id = public.training_current_profile_id()
  )
  or public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Students can submit before hard deadline" on public.training_submissions;
create policy "Students can submit before hard deadline"
on public.training_submissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.training_enrollments e
    where e.id = enrollment_id
      and e.profile_id = public.training_current_profile_id()
      and now() <= e.deadline_at
      and e.status not in ('completed', 'failed', 'expired')
  )
);

drop policy if exists "Staff manage submissions" on public.training_submissions;
create policy "Staff manage submissions"
on public.training_submissions
for update
to authenticated
using (public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[]))
with check (public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[]));

drop policy if exists "Reviews are visible to owners and staff" on public.training_reviews;
create policy "Reviews are visible to owners and staff"
on public.training_reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.training_submissions s
    join public.training_enrollments e on e.id = s.enrollment_id
    where s.id = submission_id
      and e.profile_id = public.training_current_profile_id()
  )
  or public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Reviewers create reviews" on public.training_reviews;
create policy "Reviewers create reviews"
on public.training_reviews
for insert
to authenticated
with check (
  public.training_has_role(array['reviewer', 'admin', 'super_admin']::public.training_role[])
  and reviewer_profile_id = public.training_current_profile_id()
);

drop policy if exists "Certificates visible to owners and admins" on public.training_certificates;
create policy "Certificates visible to owners and admins"
on public.training_certificates
for select
to authenticated
using (
  exists (
    select 1
    from public.training_enrollments e
    where e.id = enrollment_id
      and e.profile_id = public.training_current_profile_id()
  )
  or public.training_has_role(array['admin', 'super_admin']::public.training_role[])
);

drop policy if exists "Admins manage certificates" on public.training_certificates;
create policy "Admins manage certificates"
on public.training_certificates
for all
to authenticated
using (public.training_has_role(array['admin', 'super_admin']::public.training_role[]))
with check (public.training_has_role(array['admin', 'super_admin']::public.training_role[]));

grant usage on schema public to anon, authenticated;
grant execute on function public.get_training_invite(text) to anon, authenticated;
grant execute on function public.verify_training_certificate(text) to anon, authenticated;
grant execute on function public.enroll_training(text, text, text) to authenticated;
grant execute on function public.submit_training_work(uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.review_training_submission(uuid, public.training_result, text) to authenticated;
grant execute on function public.set_training_final_result(uuid, public.training_result) to authenticated;
grant execute on function public.training_has_role(public.training_role[]) to authenticated;
grant execute on function public.training_current_profile_id() to authenticated;

grant select, insert, update, delete on
  public.training_tracks,
  public.training_profiles,
  public.training_invites,
  public.training_modules,
  public.training_lessons,
  public.training_projects,
  public.training_enrollments,
  public.training_submissions,
  public.training_reviews,
  public.training_certificates
to authenticated;

grant select, insert, update, delete on
  public.training_tracks,
  public.training_profiles,
  public.training_invites,
  public.training_modules,
  public.training_lessons,
  public.training_projects,
  public.training_enrollments,
  public.training_submissions,
  public.training_reviews,
  public.training_certificates
to service_role;

grant execute on function public.get_training_invite(text) to service_role;
grant execute on function public.verify_training_certificate(text) to service_role;
grant execute on function public.enroll_training(text, text, text) to service_role;
grant execute on function public.submit_training_work(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.review_training_submission(uuid, public.training_result, text) to service_role;
grant execute on function public.set_training_final_result(uuid, public.training_result) to service_role;
grant execute on function public.training_has_role(public.training_role[]) to service_role;
grant execute on function public.training_current_profile_id() to service_role;

insert into public.training_tracks (
  slug,
  title,
  description,
  duration_weeks_min,
  duration_weeks_max,
  is_active
)
values (
  'undergraduate-training',
  'SAIL Undergraduate Training Program',
  'A private 4-8 week onboarding track covering mathematical foundations, deep learning, and SAIL research pillars before project participation.',
  4,
  8,
  true
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  duration_weeks_min = excluded.duration_weeks_min,
  duration_weeks_max = excluded.duration_weeks_max,
  is_active = excluded.is_active;

with track as (
  select id from public.training_tracks where slug = 'undergraduate-training'
)
insert into public.training_modules (track_id, title, slug, pillar, order_index, description, is_required, is_active)
select track.id, module.title, module.slug, module.pillar::public.training_module_pillar, module.order_index, module.description, true, true
from track
cross join (
  values
    ('Math Foundations', 'math-foundations', 'math', 10, 'Linear algebra, probability, optimization, and statistics needed for research reading and implementation.'),
    ('Machine Learning and Deep Learning', 'deep-learning-foundations', 'deep_learning', 20, 'Training loops, loss functions, backpropagation, CNN/Transformer basics, and evaluation practice.'),
    ('Trustworthy AI', 'trustworthy-ai', 'trustworthy_ai', 30, 'Robustness, privacy, backdoor attacks and defenses, and evaluation under distribution shifts.'),
    ('Distributed and Federated Learning', 'distributed-learning', 'distributed_learning', 40, 'Federated learning, non-IID data, communication constraints, personalization, and cross-silo collaboration.'),
    ('Efficient Machine Learning', 'efficient-machine-learning', 'efficient_ml', 50, 'Compression, pruning, low-rank methods, edge AI, and resource-aware deployment.'),
    ('Mini-project', 'mini-project', 'project', 60, 'An admin-assigned project connected to one or more SAIL pillars.')
) as module(title, slug, pillar, order_index, description)
on conflict (track_id, slug) do update
set
  title = excluded.title,
  pillar = excluded.pillar,
  order_index = excluded.order_index,
  description = excluded.description,
  is_required = excluded.is_required,
  is_active = excluded.is_active;

with modules as (
  select id, slug from public.training_modules
)
insert into public.training_lessons (module_id, title, material_url, description, order_index, is_active)
select modules.id, lesson.title, lesson.material_url, lesson.description, lesson.order_index, true
from modules
join (
  values
    ('math-foundations', 'Linear algebra and matrix calculus', null, 'Review vectors, matrices, eigendecomposition, gradients, and notation used in ML papers.', 10),
    ('math-foundations', 'Probability, statistics, and optimization', null, 'Review distributions, expectation, concentration intuition, SGD, and constrained optimization basics.', 20),
    ('deep-learning-foundations', 'Deep learning implementation basics', null, 'Build and debug training/evaluation loops with clean experiment logging.', 10),
    ('deep-learning-foundations', 'CNNs, Transformers, and evaluation', null, 'Read model diagrams, inspect metrics, and compare baselines responsibly.', 20),
    ('trustworthy-ai', 'Robustness and privacy primer', null, 'Understand adversarial conditions, data leakage risks, and privacy-preserving evaluation.', 10),
    ('trustworthy-ai', 'Backdoor attacks and defenses', null, 'Read a representative paper and reproduce a small controlled experiment.', 20),
    ('distributed-learning', 'Federated learning foundations', null, 'Understand client/server training, non-IID data, aggregation, and personalization.', 10),
    ('distributed-learning', 'Communication and deployment constraints', null, 'Analyze how communication, edge devices, and data silos shape system design.', 20),
    ('efficient-machine-learning', 'Resource-aware model design', null, 'Study pruning, compression, low-rank methods, and efficient training trade-offs.', 10),
    ('efficient-machine-learning', 'Edge AI evaluation', null, 'Measure latency, memory, parameters, and accuracy trade-offs for a small model.', 20),
    ('mini-project', 'Final mini-project proposal and report', null, 'Submit project artifacts, code/report links, and a concise reflection.', 10)
) as lesson(module_slug, title, material_url, description, order_index)
on modules.slug = lesson.module_slug
on conflict do nothing;

insert into public.training_projects (
  title,
  slug,
  description,
  pillar,
  difficulty,
  material_url,
  expected_output,
  is_active
)
values
  (
    'Backdoor Robustness Reproduction',
    'backdoor-robustness-reproduction',
    'Reproduce a small backdoor attack or defense experiment and explain the assumptions, metrics, and failure cases.',
    'trustworthy_ai',
    'standard',
    null,
    'Drive link containing a short report, code repository or notebook, and reproduced figures.',
    true
  ),
  (
    'Federated Learning Under Non-IID Data',
    'federated-learning-non-iid',
    'Run a compact federated learning experiment under different non-IID settings and discuss communication and accuracy trade-offs.',
    'distributed_learning',
    'standard',
    null,
    'Drive link containing experiment logs, plots, and a concise report.',
    true
  ),
  (
    'Efficient Model Trade-off Study',
    'efficient-model-tradeoff-study',
    'Compare a baseline model with one efficient variant using accuracy, parameter count, memory, and runtime metrics.',
    'efficient_ml',
    'standard',
    null,
    'Drive link containing the report, code, and metric table.',
    true
  )
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  pillar = excluded.pillar,
  difficulty = excluded.difficulty,
  material_url = excluded.material_url,
  expected_output = excluded.expected_output,
  is_active = excluded.is_active;
