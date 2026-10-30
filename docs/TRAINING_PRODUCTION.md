# Research Atlas training portal

The live training application is `/training/`. It uses the selected Option 2
Research Atlas typography, original PNG assets, and component styles. Course and
student records live in Supabase; the former browser-local demo is separate.

## Sign in

- Admin: use **Admin sign-in** with the existing `sailresearch` CMS account and
  its current password. The existing `thinh.nth@vinuni.edu.vn` training admin
  also retains access. A CMS session can open **Training courses** directly.
- Student: open a private invitation, enter the assigned email, follow the email
  link, and confirm enrollment. An existing student can sign in at `/training/`
  without reopening the invitation.
- Reviewers use their own email login. An admin can assign a reviewer role to
  an existing training profile in **Overview → Manage staff access**.

No credentials, service-role keys or simulated role switches are shipped to the
client. Authenticated API access is restricted by RLS and checked database RPCs.

## Workspaces

Student navigation opens Overview, Curriculum, and Submissions. The account
menu opens the assigned mini-project, program result/certificate, profile
editor, and course switcher when the student has multiple enrollments.
Students can read lessons, open attached HTTPS resources, mark lessons
complete, save submission drafts to their account, submit work, and respond
to a Revision review before the hard deadline.

Admin navigation opens Overview, Students, Curriculum, Projects and Reviews.
Admins can create/edit training tracks, modules, lesson text and material URLs,
project briefs, invitations, enrollment deadlines and project/reviewer
assignments. Archiving preserves submitted work. Existing project assignments
are protected once the student has submitted that project.

Use **Assignment & outcomes** in the module editor for learning outcomes,
assignment instructions and the assignment material URL. This keeps the
approved main course-editor layout. In Projects, click the brief title to
edit its title or availability; the main editor saves the brief and materials.

Reviewers save private drafts and publish Excellent, Pass, Revision or Fail
with feedback. The latest submission version is the reviewable version.
Students cannot resubmit work that is pending, accepted, failed, or overdue.

All required active non-project modules plus the assigned project must pass.
The final review automatically records Pass or Excellent and issues a
certificate. Excellent requires Excellent on every required target. A later
review that invalidates completion revokes the certificate. Admins can record
a final Fail or reopen an enrollment for Revision. They cannot issue a passing
certificate before the required work has been accepted.

Certificates can be printed/saved as PDF and verified publicly at
`/training/certificates/?code=...`. Verification exposes only the certificate
code, name, program, result and issue date.

## Deployment and database

GitHub repository: `sail-research/sail-research.github.io`. A merge to `main`
triggers `.github/workflows/deploy.yml` and publishes GitHub Pages to
`https://www.sail-research.com`.

`SUPABASE_TRAINING_ATLAS.sql` is the applied production schema upgrade.
`SUPABASE_TRAINING_CMS_ADMIN.sql` records the existing CMS identity bootstrap.
Privileged implementations live in the unexposed `training_private` schema;
public API wrappers use `SECURITY INVOKER` and explicit execution grants.

The production Site URL is configured as `https://www.sail-research.com/training/`,
with both `https://www.sail-research.com/training/**` and
`https://sail-research.com/training/**` saved in the allowed redirect URLs. Add local
development URLs only for development. Supabase must have a working email
provider/custom SMTP for student email login. The default email service is
not a production delivery setup for an arbitrary student cohort. The Dashboard
currently shows custom SMTP disabled. Resend Free has been selected for Auth
mail (3,000 emails/month, at most 100/day, as verified on 2026-10-30). Account
setup, sender-domain verification, SMTP connection and a real email delivery
check remain required before the student email rollout is complete. Use
`SAIL Training <no-reply@auth.sail-research.com>` after verifying that subdomain;
do not change the website's existing A/CNAME records. Resend's native Supabase
integration can configure SMTP without manually copying its API key.

The previously seeded real course has 6 modules and 11 lesson introductions.
Its resource URLs are empty. Admins attach the lab's actual materials in
Curriculum; absent attachments are shown honestly as not attached.

## Validation

- `node scripts/training-overview/test-production.mjs` runs real Auth, RLS,
  enrollment, draft, deadline, review and certificate integration checks using
  a disposable QA course and four temporary identities. Requires local
  `.env.local` with the existing server-side Supabase URL/service key.
- `node scripts/training-overview/test-production.mjs cleanup` removes that
  isolated fixture, its enrollments, projects and Auth identities.
- `node scripts/training-overview/test-production.mjs links` generates fresh
  one-time QA sign-in tokens for browser testing, saved only under ignored
  `tmp/`. These do not send email and do not prove email delivery.
- `node scripts/training-overview/test-production.mjs complete` completes only
  the retained QA student's disposable work for certificate rendering checks.
- `npm run build` builds the static site. Dependencies include pinned Astro
  7.4.4 and Supabase JS 2.118.0; the production dependency audit is clean.

Browser evidence and the scoped design comparison are in
`docs/training-production-qa/`.
