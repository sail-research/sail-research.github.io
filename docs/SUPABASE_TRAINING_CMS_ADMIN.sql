-- Executed during Atlas rollout: reuse the existing, trusted CMS admin identity.
-- No passwords or Auth identities are created or changed by this statement.
insert into public.training_profiles(auth_user_id,email,full_name,role)
select auth_user_id,email,'SAIL Admin','admin'::public.training_role
from public.cms_admins
where lower(email)='sailresearch@admin.sail-research.com' and role='admin'
on conflict(auth_user_id) do nothing;
