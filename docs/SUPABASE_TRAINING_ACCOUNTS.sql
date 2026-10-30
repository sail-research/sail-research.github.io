-- Admin-issued password accounts. Called only by the authenticated account
-- management Edge Function, using its server-side service role.
begin;
create or replace function public.provision_training_student(
  target_auth_user_id uuid, student_email text, student_name text,
  student_affiliation text, target_track_id uuid
) returns public.training_enrollments
language plpgsql security invoker set search_path = '' as $$
declare
  learner public.training_profiles;
  course public.training_tracks;
  enrollment public.training_enrollments;
begin
  -- The service-only caller verifies the Auth identity with the Auth Admin API.
  -- Keep this invoker function out of auth.users; do not grant table access.
  if length(trim(student_name)) not between 2 and 150 then
    raise exception 'A valid student name is required.';
  end if;
  select * into course from public.training_tracks where id=target_track_id and is_active for share;
  if not found then raise exception 'Course is not active.'; end if;
  insert into public.training_profiles(auth_user_id,email,full_name,affiliation,role)
  values(target_auth_user_id,lower(student_email),trim(student_name),nullif(trim(student_affiliation),''),'student')
  on conflict(auth_user_id) do nothing;
  select * into learner from public.training_profiles where auth_user_id=target_auth_user_id for update;
  if learner.role <> 'student' then raise exception 'Only student accounts can be enrolled here.'; end if;
  insert into public.training_enrollments(profile_id,track_id,start_date,deadline_at,status)
  values(learner.id,course.id,(now() at time zone 'Asia/Ho_Chi_Minh')::date,
    now()+make_interval(weeks=>course.duration_weeks_max),'enrolled')
  on conflict(profile_id,track_id) do nothing;
  select * into enrollment from public.training_enrollments where profile_id=learner.id and track_id=course.id;
  return enrollment;
end;
$$;
revoke all on function public.provision_training_student(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.provision_training_student(uuid,text,text,text,uuid) to service_role;
commit;
