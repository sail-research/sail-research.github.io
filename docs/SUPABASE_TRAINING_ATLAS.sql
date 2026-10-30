-- Research Atlas production upgrade. Existing courses and identities are preserved.
begin;
create schema if not exists training_private;
revoke all on schema training_private from public;
grant usage on schema training_private to authenticated, anon;
alter default privileges in schema training_private revoke execute on functions from public;

alter table public.training_modules add column if not exists outcomes text not null default '';
alter table public.training_modules add column if not exists assignment_brief text not null default '';
alter table public.training_modules add column if not exists material_url text;
alter table public.training_lessons add column if not exists content text not null default '';
alter table public.training_lessons add column if not exists lesson_type text not null default 'Reading' check (lesson_type in ('Reading','Practical'));
alter table public.training_enrollments add column if not exists reviewer_profile_id uuid references public.training_profiles(id) on delete set null;

create table public.training_lesson_progress (
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key(enrollment_id,lesson_id)
);
create table public.training_drafts (
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  target_key text not null,
  drive_url text not null default '',
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key(enrollment_id,target_key)
);
create table public.training_review_drafts (
  reviewer_profile_id uuid not null references public.training_profiles(id) on delete cascade,
  submission_id uuid not null references public.training_submissions(id) on delete cascade,
  result public.training_result not null default 'revision',
  comment text not null default '',
  updated_at timestamptz not null default now(),
  primary key(reviewer_profile_id,submission_id)
);
alter table public.training_lesson_progress enable row level security;
alter table public.training_drafts enable row level security;
alter table public.training_review_drafts enable row level security;
create policy "Owners read lesson progress" on public.training_lesson_progress for select to authenticated using (
  exists(select 1 from public.training_enrollments e where e.id=enrollment_id and e.profile_id=public.training_current_profile_id())
  or public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]));
create policy "Owners complete active lessons" on public.training_lesson_progress for insert to authenticated with check (
  exists(select 1 from public.training_enrollments e join public.training_modules m on m.track_id=e.track_id join public.training_lessons l on l.module_id=m.id
  where e.id=enrollment_id and l.id=lesson_id and e.profile_id=public.training_current_profile_id() and m.is_active and l.is_active and now()<=e.deadline_at and e.status not in ('completed','failed','expired')));
create policy "Owners manage submission drafts" on public.training_drafts for all to authenticated
using (exists(select 1 from public.training_enrollments e where e.id=enrollment_id and e.profile_id=public.training_current_profile_id()))
with check (exists(select 1 from public.training_enrollments e where e.id=enrollment_id and e.profile_id=public.training_current_profile_id() and now()<=e.deadline_at and e.status not in ('completed','failed','expired')));
create policy "Reviewers manage own drafts" on public.training_review_drafts for all to authenticated
using (reviewer_profile_id=public.training_current_profile_id() and public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]))
with check (reviewer_profile_id=public.training_current_profile_id() and public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]));
grant select,insert on public.training_lesson_progress to authenticated;
grant select,insert,update,delete on public.training_drafts,public.training_review_drafts to authenticated;
grant all on public.training_lesson_progress,public.training_drafts,public.training_review_drafts to service_role;

-- Public invoker wrappers keep the existing API. Privileged implementations live
-- outside the exposed schema and validate the authenticated identity themselves.
alter function public.training_has_role(public.training_role[]) set schema training_private;
create function public.training_has_role(allowed_roles public.training_role[]) returns boolean language sql stable security invoker set search_path='' as $$ select training_private.training_has_role(allowed_roles) $$;
alter function public.training_current_profile_id() set schema training_private;
create function public.training_current_profile_id() returns uuid language sql stable security invoker set search_path='' as $$ select training_private.training_current_profile_id() $$;
alter function public.enroll_training(text,text,text) set schema training_private;
create function public.enroll_training(invite_token text,full_name text,affiliation text default null) returns public.training_enrollments language sql security invoker set search_path='' as $$ select training_private.enroll_training(invite_token,full_name,affiliation) $$;
alter function public.get_training_invite(text) set schema training_private;
create function public.get_training_invite(invite_token text) returns table(track_title text,track_description text,duration_weeks_min integer,duration_weeks_max integer,email_allowed text,expires_at timestamptz,remaining_uses integer,is_usable boolean) language sql stable security invoker set search_path='' as $$ select * from training_private.get_training_invite(invite_token) $$;
alter function public.verify_training_certificate(text) set schema training_private;
create function public.verify_training_certificate(lookup_code text) returns table(certificate_code text,display_name text,program_title text,result public.training_result,issued_at timestamptz) language sql stable security invoker set search_path='' as $$ select * from training_private.verify_training_certificate(lookup_code) $$;
alter function public.submit_training_work(uuid,uuid,uuid,text,text) set schema training_private;
alter function public.review_training_submission(uuid,public.training_result,text) set schema training_private;
alter function public.set_training_final_result(uuid,public.training_result) set schema training_private;

create or replace function training_private.submit_training_work(target_enrollment_id uuid,target_module_id uuid default null,target_project_id uuid default null,submission_drive_url text default null,submission_note text default null)
returns public.training_submissions language plpgsql security definer set search_path='' as $$
declare e public.training_enrollments; s public.training_submissions; previous public.training_submissions; grade public.training_result;
begin
 if auth.uid() is null then raise exception 'Login required.'; end if;
 select * into e from public.training_enrollments where id=target_enrollment_id and profile_id=public.training_current_profile_id() for update;
 if not found then raise exception 'Enrollment not found.'; end if;
 if now()>e.deadline_at or e.status in ('completed','failed','expired') then raise exception 'The submission window has closed.'; end if;
 if (target_module_id is null)=(target_project_id is null) then raise exception 'Choose one module or project.'; end if;
 if coalesce(submission_drive_url,'') !~* '^https://[^/[:space:]]+(/[^[:space:]]*)?$' then raise exception 'A shared HTTPS link is required.'; end if;
 if target_module_id is not null and not exists(select 1 from public.training_modules where id=target_module_id and track_id=e.track_id and is_active and pillar<>'project') then raise exception 'Module is not available in this track.'; end if;
 if target_project_id is not null and (e.assigned_project_id is distinct from target_project_id or not exists(select 1 from public.training_projects where id=target_project_id and is_active)) then raise exception 'Project is not assigned or available.'; end if;
 select * into previous from public.training_submissions where enrollment_id=e.id and module_id is not distinct from target_module_id and project_id is not distinct from target_project_id order by submitted_at desc,id desc limit 1;
 if found then
  select result into grade from public.training_reviews where submission_id=previous.id order by reviewed_at desc,id desc limit 1;
  if grade is distinct from 'revision'::public.training_result then raise exception 'A revision request is required before resubmission.'; end if;
 end if;
 insert into public.training_submissions(enrollment_id,module_id,project_id,drive_url,note) values(e.id,target_module_id,target_project_id,trim(submission_drive_url),nullif(trim(submission_note),'')) returning * into s;
 delete from public.training_drafts where enrollment_id=e.id and target_key=coalesce(target_module_id,target_project_id)::text;
 return s;
end $$;
create function public.submit_training_work(target_enrollment_id uuid,target_module_id uuid default null,target_project_id uuid default null,submission_drive_url text default null,submission_note text default null) returns public.training_submissions language sql security invoker set search_path='' as $$ select training_private.submit_training_work(target_enrollment_id,target_module_id,target_project_id,submission_drive_url,submission_note) $$;

create function training_private.eligible_training_result(eid uuid) returns public.training_result language sql stable security definer set search_path='' as $$
 with e as(select * from public.training_enrollments where id=eid), targets as (
  select m.id target_id,false project from public.training_modules m,e where m.track_id=e.track_id and m.is_active and m.is_required and m.pillar<>'project'
  union all select assigned_project_id,true from e
 ), grades as (select t.*, (select r.result from public.training_submissions s left join lateral(select result from public.training_reviews where submission_id=s.id order by reviewed_at desc,id desc limit 1) r on true where s.enrollment_id=eid and case when t.project then s.project_id=t.target_id else s.module_id=t.target_id end order by s.submitted_at desc,s.id desc limit 1) grade from targets t)
 select case when count(*)>1 and bool_and(target_id is not null and coalesce(grade in ('pass','excellent'),false)) then case when bool_and(grade='excellent') then 'excellent'::public.training_result else 'pass'::public.training_result end else null end from grades
$$;

create or replace function training_private.set_training_final_result(target_enrollment_id uuid,target_result public.training_result) returns public.training_enrollments language plpgsql security definer set search_path='' as $$
declare e public.training_enrollments; eligible public.training_result;
begin
 if auth.uid() is null or not public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]) then raise exception 'Staff permission required.'; end if;
 select * into e from public.training_enrollments where id=target_enrollment_id for update;
 if not found then raise exception 'Enrollment not found.'; end if;
 eligible:=training_private.eligible_training_result(e.id);
 if target_result in ('excellent','pass') and (eligible is null or (target_result='excellent' and eligible<>'excellent')) then raise exception 'All required module assignments and the assigned project must be accepted first.'; end if;
 update public.training_enrollments set final_result=target_result,status=case when target_result in ('excellent','pass') then 'completed'::public.training_enrollment_status when target_result='fail' then 'failed'::public.training_enrollment_status else 'in_progress'::public.training_enrollment_status end where id=e.id returning * into e;
 if target_result in ('excellent','pass') then
  insert into public.training_certificates(enrollment_id,certificate_code,display_name,program_title,result)
  select e.id,'SAIL-UG-'||to_char(now(),'YYYY')||'-'||upper(substr(replace(e.id::text,'-',''),1,8)),p.full_name,t.title,target_result from public.training_profiles p,public.training_tracks t where p.id=e.profile_id and t.id=e.track_id
  on conflict(enrollment_id) do update set display_name=excluded.display_name,program_title=excluded.program_title,result=excluded.result,revoked_at=null;
 else update public.training_certificates set revoked_at=now() where enrollment_id=e.id and revoked_at is null;
 end if;
 return e;
end $$;
create function public.set_training_final_result(target_enrollment_id uuid,target_result public.training_result) returns public.training_enrollments language sql security invoker set search_path='' as $$ select training_private.set_training_final_result(target_enrollment_id,target_result) $$;

create or replace function training_private.review_training_submission(target_submission_id uuid,review_result public.training_result,review_comment text default null) returns public.training_reviews language plpgsql security definer set search_path='' as $$
declare s public.training_submissions; e public.training_enrollments; r public.training_reviews; eligible public.training_result;
begin
 if auth.uid() is null or not public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]) then raise exception 'Reviewer permission required.'; end if;
 select * into s from public.training_submissions where id=target_submission_id;
 if not found then raise exception 'Submission not found.'; end if;
 select * into e from public.training_enrollments where id=s.enrollment_id for update;
 if exists(select 1 from public.training_submissions where enrollment_id=s.enrollment_id and module_id is not distinct from s.module_id and project_id is not distinct from s.project_id and (submitted_at,id)>(s.submitted_at,s.id)) then raise exception 'Review the latest submission version.'; end if;
 if length(trim(coalesce(review_comment,'')))<2 then raise exception 'Useful feedback is required.'; end if;
 insert into public.training_reviews(submission_id,reviewer_profile_id,result,comment) values(s.id,public.training_current_profile_id(),review_result,trim(review_comment)) returning * into r;
 update public.training_submissions set status='reviewed' where id=s.id;
 delete from public.training_review_drafts where submission_id=s.id and reviewer_profile_id=public.training_current_profile_id();
 eligible:=training_private.eligible_training_result(e.id);
 if eligible is not null then perform training_private.set_training_final_result(e.id,eligible);
 elsif e.final_result in ('excellent','pass') then perform training_private.set_training_final_result(e.id,'revision');
 end if;
 return r;
end $$;
create function public.review_training_submission(target_submission_id uuid,review_result public.training_result,review_comment text default null) returns public.training_reviews language sql security invoker set search_path='' as $$ select training_private.review_training_submission(target_submission_id,review_result,review_comment) $$;

create function training_private.update_training_enrollment(target_enrollment_id uuid,new_deadline timestamptz,new_project_id uuid,new_reviewer_id uuid,new_result public.training_result default null)
returns public.training_enrollments language plpgsql security definer set search_path='' as $$
declare e public.training_enrollments;
begin
 if auth.uid() is null or not public.training_has_role(array['admin','super_admin']::public.training_role[]) then raise exception 'Admin permission required.'; end if;
 select * into e from public.training_enrollments where id=target_enrollment_id for update;
 if not found then raise exception 'Enrollment not found.'; end if;
 if new_deadline is null or new_deadline<e.start_date::timestamptz then raise exception 'Deadline must be after the start date.'; end if;
 if new_reviewer_id is not null and not exists(select 1 from public.training_profiles where id=new_reviewer_id and role in ('reviewer','admin','super_admin')) then raise exception 'Choose a staff reviewer.'; end if;
 if new_project_id is distinct from e.assigned_project_id and exists(select 1 from public.training_submissions where enrollment_id=e.id and project_id is not null) then raise exception 'Preserve the project assignment after submitted work.'; end if;
 if new_project_id is not null and new_project_id is distinct from e.assigned_project_id and not exists(select 1 from public.training_projects where id=new_project_id and is_active) then raise exception 'Choose an available project.'; end if;
 update public.training_enrollments set deadline_at=new_deadline,assigned_project_id=new_project_id,reviewer_profile_id=new_reviewer_id where id=e.id returning * into e;
 if new_result is not null then e:=training_private.set_training_final_result(e.id,new_result); end if;
 return e;
end $$;
create function public.update_training_enrollment(target_enrollment_id uuid,new_deadline timestamptz,new_project_id uuid,new_reviewer_id uuid,new_result public.training_result default null)
returns public.training_enrollments language sql security invoker set search_path='' as $$ select training_private.update_training_enrollment(target_enrollment_id,new_deadline,new_project_id,new_reviewer_id,new_result) $$;
create function training_private.set_training_staff_role(target_profile_id uuid,new_role public.training_role)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.training_has_role(array['admin','super_admin']::public.training_role[]) then raise exception 'Admin permission required.'; end if;
 if target_profile_id=public.training_current_profile_id() then raise exception 'Another admin must change your own role.'; end if;
 if new_role='super_admin' then raise exception 'Super-admin access is managed outside the training portal.'; end if;
 update public.training_profiles set role=new_role where id=target_profile_id and role<>'super_admin';
 if not found then raise exception 'Profile not found or protected.'; end if;
end $$;
create function public.set_training_staff_role(target_profile_id uuid,new_role public.training_role) returns void language sql security invoker set search_path='' as $$ select training_private.set_training_staff_role(target_profile_id,new_role) $$;

-- A student can see only the active curriculum of their own enrolled track.
drop policy "Active tracks are visible after login" on public.training_tracks;
create policy "Enrolled tracks are visible" on public.training_tracks for select to authenticated using (public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]) or (is_active and exists(select 1 from public.training_enrollments e where e.track_id=training_tracks.id and e.profile_id=public.training_current_profile_id())));
drop policy "Active modules are visible after login" on public.training_modules;
create policy "Enrolled modules are visible" on public.training_modules for select to authenticated using (public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]) or (is_active and exists(select 1 from public.training_enrollments e where e.track_id=training_modules.track_id and e.profile_id=public.training_current_profile_id())));
drop policy "Active lessons are visible after login" on public.training_lessons;
create policy "Enrolled lessons are visible" on public.training_lessons for select to authenticated using (public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]) or (is_active and exists(select 1 from public.training_modules m join public.training_enrollments e on e.track_id=m.track_id where m.id=module_id and m.is_active and e.profile_id=public.training_current_profile_id())));
drop policy "Active projects are visible after login" on public.training_projects;
create policy "Assigned projects are visible" on public.training_projects for select to authenticated using (public.training_has_role(array['reviewer','admin','super_admin']::public.training_role[]) or exists(select 1 from public.training_enrollments e where e.assigned_project_id=training_projects.id and e.profile_id=public.training_current_profile_id()));

-- Role assignment and assessment state use checked RPCs, never editable metadata.
revoke update on public.training_profiles from authenticated;
grant update(full_name,affiliation) on public.training_profiles to authenticated;
revoke insert,update,delete on public.training_enrollments from authenticated;
-- Writes with cross-table invariants go through the checked RPCs only.
revoke insert,update,delete on public.training_submissions,public.training_reviews,public.training_certificates from authenticated;
alter function public.training_set_updated_at() set search_path='';
revoke all on all functions in schema training_private from public,anon,authenticated;
grant execute on function training_private.training_has_role(public.training_role[]),training_private.training_current_profile_id(),training_private.enroll_training(text,text,text),training_private.submit_training_work(uuid,uuid,uuid,text,text),training_private.review_training_submission(uuid,public.training_result,text),training_private.set_training_final_result(uuid,public.training_result) to authenticated;
grant execute on function training_private.get_training_invite(text),training_private.verify_training_certificate(text) to anon,authenticated;
grant execute on function training_private.update_training_enrollment(uuid,timestamptz,uuid,uuid,public.training_result),training_private.set_training_staff_role(uuid,public.training_role) to authenticated;
revoke all on function public.update_training_enrollment(uuid,timestamptz,uuid,uuid,public.training_result),public.set_training_staff_role(uuid,public.training_role) from public,anon;
grant execute on function public.update_training_enrollment(uuid,timestamptz,uuid,uuid,public.training_result),public.set_training_staff_role(uuid,public.training_role) to authenticated;
revoke all on function public.training_has_role(public.training_role[]),public.training_current_profile_id(),public.enroll_training(text,text,text),public.submit_training_work(uuid,uuid,uuid,text,text),public.review_training_submission(uuid,public.training_result,text),public.set_training_final_result(uuid,public.training_result) from public,anon;
grant execute on function public.training_has_role(public.training_role[]),public.training_current_profile_id(),public.enroll_training(text,text,text),public.submit_training_work(uuid,uuid,uuid,text,text),public.review_training_submission(uuid,public.training_result,text),public.set_training_final_result(uuid,public.training_result) to authenticated;
revoke all on function public.get_training_invite(text),public.verify_training_certificate(text) from public;
grant execute on function public.get_training_invite(text),public.verify_training_certificate(text) to anon,authenticated;
create index if not exists training_submissions_enrollment_time on public.training_submissions(enrollment_id,submitted_at desc);
create index if not exists training_reviews_submission_time on public.training_reviews(submission_id,reviewed_at desc);
create index if not exists training_enrollments_reviewer on public.training_enrollments(reviewer_profile_id);
commit;
