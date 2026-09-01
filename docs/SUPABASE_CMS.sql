-- SAIL CMS: editorial content, access control, and public media.
-- Applied to project rxnhlmrvwmepuphpithm on 2026-09-01.

create type public.cms_role as enum ('editor', 'admin');
create type public.cms_publication_status as enum ('accepted', 'arxiv');
create type public.cms_publication_type as enum ('conference', 'journal', 'workshop', 'preprint');

create table public.cms_admins (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.cms_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cms_admin_invites (
  email text primary key,
  role public.cms_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(email))
);

create table public.cms_news (
  id uuid primary key default gen_random_uuid(),
  month_label text not null,
  sort_date date not null,
  label text not null default 'Lab update',
  title text not null,
  summary text not null,
  link_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cms_publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text[] not null default '{}',
  venue text not null,
  year integer not null check (year between 1900 and 2100),
  status public.cms_publication_status not null default 'accepted',
  type public.cms_publication_type not null default 'conference',
  tags text[] not null default '{}',
  sort_date date not null default current_date,
  metric_label text,
  metric_source_year text,
  metric_value text,
  links jsonb not null default '[]'::jsonb,
  source_note text,
  figure_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(links) = 'array')
);

create table public.cms_teaching_overview (
  id text primary key default 'default' check (id = 'default'),
  current_semester_label text not null,
  current_course_codes text[] not null default '{}',
  teaching_assistants text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.cms_course_catalog (
  code text primary key,
  title text not null,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cms_course_offerings (
  id uuid primary key default gen_random_uuid(),
  semester text not null,
  course_code text not null references public.cms_course_catalog(code) on update cascade,
  credits integer not null check (credits > 0 and credits <= 12),
  group_end boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cms_capstone_projects (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 1900 and 2100),
  title text not null,
  students text[] not null default '{}',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.cms_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.cms_has_role(allowed_roles public.cms_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cms_admins
    where auth_user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.claim_cms_admin_access()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
  invited_role public.cms_role;
begin
  if auth.uid() is null then
    raise exception 'Login is required.';
  end if;

  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if current_email = '' then
    raise exception 'This login session has no email address.';
  end if;

  select role into invited_role
  from public.cms_admin_invites
  where email = current_email;

  if invited_role is null then
    return exists (
      select 1 from public.cms_admins where auth_user_id = auth.uid()
    );
  end if;

  insert into public.cms_admins (auth_user_id, email, role)
  values (auth.uid(), current_email, invited_role)
  on conflict (auth_user_id) do update
  set email = excluded.email,
      role = excluded.role,
      updated_at = now();

  return true;
end;
$$;

revoke all on function public.cms_has_role(public.cms_role[]) from public;
revoke all on function public.claim_cms_admin_access() from public;
grant execute on function public.cms_has_role(public.cms_role[]) to authenticated;
grant execute on function public.claim_cms_admin_access() to authenticated;

insert into public.cms_admins (auth_user_id, email, role)
select auth_user_id, lower(email), 'admin'::public.cms_role
from public.training_profiles
where role in ('admin'::public.training_role, 'super_admin'::public.training_role)
on conflict (auth_user_id) do update
set email = excluded.email,
    role = excluded.role,
    updated_at = now();

alter table public.cms_admins enable row level security;
alter table public.cms_admin_invites enable row level security;
alter table public.cms_news enable row level security;
alter table public.cms_publications enable row level security;
alter table public.cms_teaching_overview enable row level security;
alter table public.cms_course_catalog enable row level security;
alter table public.cms_course_offerings enable row level security;
alter table public.cms_capstone_projects enable row level security;

create policy "CMS users can read their own access" on public.cms_admins
for select to authenticated
using (auth_user_id = auth.uid() or public.cms_has_role(array['admin']::public.cms_role[]));

create policy "CMS admins manage access" on public.cms_admins
for all to authenticated
using (public.cms_has_role(array['admin']::public.cms_role[]))
with check (public.cms_has_role(array['admin']::public.cms_role[]));

create policy "CMS admins manage invitations" on public.cms_admin_invites
for all to authenticated
using (public.cms_has_role(array['admin']::public.cms_role[]))
with check (public.cms_has_role(array['admin']::public.cms_role[]));

create policy "Published CMS news is public" on public.cms_news
for select to anon, authenticated
using (is_published or public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
create policy "CMS editors manage news" on public.cms_news
for all to authenticated
using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create policy "Published CMS publications are public" on public.cms_publications
for select to anon, authenticated
using (is_published or public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
create policy "CMS editors manage publications" on public.cms_publications
for all to authenticated
using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create policy "CMS teaching overview is public" on public.cms_teaching_overview
for select to anon, authenticated
using (true);
create policy "CMS editors manage teaching overview" on public.cms_teaching_overview
for all to authenticated
using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create policy "Published course catalog is public" on public.cms_course_catalog
for select to anon, authenticated
using (is_published or public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
create policy "CMS editors manage course catalog" on public.cms_course_catalog
for all to authenticated
using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create policy "Published course offerings are public" on public.cms_course_offerings
for select to anon, authenticated
using (is_published or public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
create policy "CMS editors manage course offerings" on public.cms_course_offerings
for all to authenticated
using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create policy "Published capstones are public" on public.cms_capstone_projects
for select to anon, authenticated
using (is_published or public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
create policy "CMS editors manage capstones" on public.cms_capstone_projects
for all to authenticated
using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create policy "CMS editors manage lab members" on public.lab_members
for all to authenticated
using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));

insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update set public = true;

create policy "CMS editors read CMS media" on storage.objects
for select to authenticated
using (bucket_id = 'cms-media' and public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
create policy "CMS editors upload CMS media" on storage.objects
for insert to authenticated
with check (bucket_id = 'cms-media' and public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
create policy "CMS editors update CMS media" on storage.objects
for update to authenticated
using (bucket_id = 'cms-media' and public.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (bucket_id = 'cms-media' and public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
create policy "CMS editors delete CMS media" on storage.objects
for delete to authenticated
using (bucket_id = 'cms-media' and public.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create trigger cms_admins_set_updated_at before update on public.cms_admins
for each row execute function public.cms_set_updated_at();
create trigger cms_admin_invites_set_updated_at before update on public.cms_admin_invites
for each row execute function public.cms_set_updated_at();
create trigger cms_news_set_updated_at before update on public.cms_news
for each row execute function public.cms_set_updated_at();
create trigger cms_publications_set_updated_at before update on public.cms_publications
for each row execute function public.cms_set_updated_at();
create trigger cms_teaching_overview_set_updated_at before update on public.cms_teaching_overview
for each row execute function public.cms_set_updated_at();
create trigger cms_course_catalog_set_updated_at before update on public.cms_course_catalog
for each row execute function public.cms_set_updated_at();
create trigger cms_course_offerings_set_updated_at before update on public.cms_course_offerings
for each row execute function public.cms_set_updated_at();
create trigger cms_capstone_projects_set_updated_at before update on public.cms_capstone_projects
for each row execute function public.cms_set_updated_at();

-- Follow-up migrations: expose the CMS tables to the Data API while keeping RLS in force.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.cms_news, public.cms_publications, public.cms_teaching_overview, public.cms_course_catalog, public.cms_course_offerings, public.cms_capstone_projects to anon, authenticated;
grant insert, update, delete on public.cms_news, public.cms_publications, public.cms_teaching_overview, public.cms_course_catalog, public.cms_course_offerings, public.cms_capstone_projects to authenticated;
grant select, insert, update, delete on public.cms_admins, public.cms_admin_invites to authenticated;
grant select, insert, update, delete on public.cms_admins, public.cms_admin_invites, public.cms_news, public.cms_publications, public.cms_teaching_overview, public.cms_course_catalog, public.cms_course_offerings, public.cms_capstone_projects to service_role;
grant select, insert, update, delete on public.lab_members to authenticated;

-- Keep public reads independent from the CMS role-checking helper.
drop policy "Published CMS news is public" on public.cms_news;
create policy "Published CMS news is public" on public.cms_news for select to anon, authenticated using (is_published);
create policy "CMS editors read all news" on public.cms_news for select to authenticated using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
drop policy "Published CMS publications are public" on public.cms_publications;
create policy "Published CMS publications are public" on public.cms_publications for select to anon, authenticated using (is_published);
create policy "CMS editors read all publications" on public.cms_publications for select to authenticated using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
drop policy "Published course catalog is public" on public.cms_course_catalog;
create policy "Published course catalog is public" on public.cms_course_catalog for select to anon, authenticated using (is_published);
create policy "CMS editors read all course catalog" on public.cms_course_catalog for select to authenticated using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
drop policy "Published course offerings are public" on public.cms_course_offerings;
create policy "Published course offerings are public" on public.cms_course_offerings for select to anon, authenticated using (is_published);
create policy "CMS editors read all course offerings" on public.cms_course_offerings for select to authenticated using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
drop policy "Published capstones are public" on public.cms_capstone_projects;
create policy "Published capstones are public" on public.cms_capstone_projects for select to anon, authenticated using (is_published);
create policy "CMS editors read all capstones" on public.cms_capstone_projects for select to authenticated using (public.cms_has_role(array['editor', 'admin']::public.cms_role[]));
revoke execute on function public.cms_has_role(public.cms_role[]) from anon;
create or replace function public.cms_set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Final hardening was applied in the Supabase migration
-- move_cms_auth_helper_to_private_schema. It replaces public.cms_has_role and
-- claim_cms_admin_access with private.cms_has_role plus tightly scoped RLS
-- policies for users to claim only their own invited CMS access.

-- Follow-up migration: add_cms_page_builder_settings.
-- This powers the controlled Layout tab for Home and Publications. The public
-- website may read the settings, while CMS editors are the only writers.
create table public.cms_page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null check (page_key in ('home', 'publications')),
  section_key text not null,
  eyebrow text,
  heading text,
  intro text,
  layout_variant text not null default 'standard'
    check (layout_variant in ('standard', 'compact', 'figures', 'text')),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_page_sections_supported_section check (
    (page_key = 'home' and section_key in ('intro', 'news'))
    or (page_key = 'publications' and section_key in ('intro', 'list'))
  ),
  constraint cms_page_sections_page_section_unique unique (page_key, section_key)
);

alter table public.cms_page_sections enable row level security;
grant select on public.cms_page_sections to anon, authenticated;
grant insert, update, delete on public.cms_page_sections to authenticated;
grant select, insert, update, delete on public.cms_page_sections to service_role;

create policy "Page section settings are public" on public.cms_page_sections
for select to anon, authenticated using (true);
create policy "CMS editors manage page section settings" on public.cms_page_sections
for all to authenticated
using (private.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (private.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create trigger cms_page_sections_set_updated_at
before update on public.cms_page_sections
for each row execute function public.cms_set_updated_at();

insert into public.cms_page_sections
  (page_key, section_key, eyebrow, heading, intro, layout_variant, is_visible, sort_order)
values
  (
    'home',
    'intro',
    null,
    null,
    'Our research group is situated within VinUniversity''s College of Engineering and Computer Science. We specialize in trustworthy, distributed, and efficient AI, with a core focus on developing machine learning systems that remain robust, private, scalable, and practical in real-world settings. Our research encompasses federated learning, privacy-preserving machine learning, backdoor attacks and defenses, communication-efficient learning, edge AI, continual learning, and resource-aware AI to enhance security, privacy, reliability, efficiency, and fairness.',
    'standard',
    true,
    10
  ),
  ('home', 'news', null, 'News', null, 'standard', true, 20),
  (
    'publications',
    'intro',
    'Publications',
    'Lab published papers.',
    'A curated publication list focused on trustworthy AI, federated learning, privacy, robustness, and efficient machine learning. We prioritize publishing in top-tier, peer-reviewed AI/ML venues. Our recent contributions have been accepted at leading conferences such as CVPR, NeurIPS, ECCV, ICML, ICLR, AAAI, ACL, WWW, and WACV.',
    'standard',
    true,
    10
  ),
  ('publications', 'list', null, null, null, 'figures', true, 20)
on conflict (page_key, section_key) do nothing;

-- Follow-up migration: add_visual_builder_pages_and_revisions.
-- The Visual Editor stores only controlled JSON blocks. It never stores arbitrary
-- HTML, JavaScript, fonts, or colors, so the live site can render it safely.
create table public.cms_visual_pages (
  page_key text primary key check (page_key in ('home', 'news', 'research', 'projects', 'people', 'teaching', 'publications', 'gallery')),
  draft_layout jsonb not null default '{"blocks": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(draft_layout) = 'object')
);

create table public.cms_visual_published_pages (
  page_key text primary key references public.cms_visual_pages(page_key) on delete cascade,
  layout jsonb not null default '{"blocks": []}'::jsonb,
  version integer not null default 1 check (version > 0),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(layout) = 'object')
);

create table public.cms_visual_revisions (
  id uuid primary key default gen_random_uuid(),
  page_key text not null references public.cms_visual_pages(page_key) on delete cascade,
  version integer not null check (version > 0),
  layout jsonb not null,
  published_at timestamptz not null default now(),
  check (jsonb_typeof(layout) = 'object'),
  unique (page_key, version)
);

alter table public.cms_visual_pages enable row level security;
alter table public.cms_visual_published_pages enable row level security;
alter table public.cms_visual_revisions enable row level security;

grant select, insert, update, delete on public.cms_visual_pages to authenticated;
grant select on public.cms_visual_published_pages to anon, authenticated;
grant insert, update, delete on public.cms_visual_published_pages to authenticated;
grant select, insert, update, delete on public.cms_visual_revisions to authenticated;
grant select, insert, update, delete on public.cms_visual_pages, public.cms_visual_published_pages, public.cms_visual_revisions to service_role;

create policy "Visual editor manages drafts" on public.cms_visual_pages
for all to authenticated
using (private.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (private.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create policy "Published visual layouts are public" on public.cms_visual_published_pages
for select to anon, authenticated using (true);
create policy "Visual editor publishes layouts" on public.cms_visual_published_pages
for all to authenticated
using (private.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (private.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create policy "Visual editor manages revisions" on public.cms_visual_revisions
for all to authenticated
using (private.cms_has_role(array['editor', 'admin']::public.cms_role[]))
with check (private.cms_has_role(array['editor', 'admin']::public.cms_role[]));

create trigger cms_visual_pages_set_updated_at
before update on public.cms_visual_pages
for each row execute function public.cms_set_updated_at();
create trigger cms_visual_published_pages_set_updated_at
before update on public.cms_visual_published_pages
for each row execute function public.cms_set_updated_at();

with page_sections as (
  select * from (values
    ('home', array['intro', 'news']),
    ('news', array['intro', 'feed']),
    ('research', array['intro', 'pillars', 'trustworthy', 'distributed', 'efficient']),
    ('projects', array['intro', 'active', 'completed', 'exploratory']),
    ('people', array['intro', 'directory']),
    ('teaching', array['intro', 'overview', 'courses', 'catalog', 'capstones']),
    ('publications', array['intro', 'list']),
    ('gallery', array['intro', 'placeholder'])
  ) as rows(page_key, section_keys)
), layouts as (
  select page_key, jsonb_build_object('blocks', (
    select jsonb_agg(jsonb_build_object(
      'id', page_key || '-' || section_key,
      'type', 'native',
      'key', section_key,
      'visible', true,
      'settings', jsonb_build_object(
        'eyebrow', '', 'heading', '', 'intro', '', 'size', 'medium',
        'weight', 'regular', 'color', 'text', 'surface', 'transparent',
        'padding', 'normal',
        'variant', case when page_key = 'publications' and section_key = 'list' then 'figures' else 'standard' end
      )
    ) order by section_position)
    from unnest(section_keys) with ordinality as entries(section_key, section_position)
  )) as layout
  from page_sections
)
insert into public.cms_visual_pages (page_key, draft_layout)
select page_key, layout from layouts
on conflict (page_key) do nothing;

insert into public.cms_visual_published_pages (page_key, layout, version)
select page_key, draft_layout, 1 from public.cms_visual_pages
on conflict (page_key) do nothing;

insert into public.cms_visual_revisions (page_key, version, layout)
select page_key, version, layout from public.cms_visual_published_pages
on conflict (page_key, version) do nothing;
