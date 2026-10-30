# Research Atlas production QA

Desktop visual, local workflow and live-deployment QA: passed. Rollout is in
progress; email-provider setup and actual email delivery remain pending.

## Verification scope

On 2026-10-30 the user selected: “Chỉ kiểm tra desktop trong web preview hiện
tại.” Initial browser verification used the in-app desktop preview at its
actual 1280 × 720 viewport. The user subsequently requested the signed-in
Chrome session for Supabase and the remaining desktop work. Mobile/tablet
verification remains outside the approved scope.

## Grounding

Source: the approved Option 2 overview and Atlas screen family, captured again
at the actual browser viewport of 1280 × 720. Implementation: the real
Supabase-backed `/training/` application. The disposable QA course has two
accepted modules and a Revision on Trustworthy AI. Names, dates, feedback,
course text and missing attachments differ deliberately because these are
live records; a zero-difference pixel claim would be misleading.

`overview-comparison.jpg` puts the source and implementation in the same
image. `overview-detail.jpg` compares the chapter and original illustration
at readable size. Source fonts and PNG assets are reused directly. The
browser reports Newsreader for the main heading; all images load and the
desktop document has no horizontal overflow.

## Findings and fixes

- P2, fixed: the first implementation added five student header links.
  Restored the approved three-link header; project and certificate access
  remain in the account menu and learning path.
- P2, fixed: project management initially used a card library. Restored the
  approved library sidebar and project brief editor.
- P2, fixed: extra course-authoring fields shifted the main module editor.
  Assignment/outcome editing now uses a dialog; project title/availability
  editing opens from the brief title. The approved resting editor is retained.
- P2, fixed: certificate markup initially differed from the approved form.
  Restored the original certificate typography, frame and placement with
  real recipient, result, issue date and verification code.
- P2, fixed: lesson dialogs reused form IDs from the background course editor.
  Each field now has a unique ID and a correctly associated label.
- Functional, fixed: the displayed total number of weeks rounded up when a
  deadline included a time of day. It now uses the enrollment creation time
  and the actual configured duration.
- Functional, fixed: course descriptions are escaped when inserted into the
  page heading. No stored course content is interpreted as HTML.
- P2, fixed after side-by-side editor comparison: native form wrappers had
  bypassed direct-child styles for editor heading dividers/spacing. Equivalent
  selectors restore those exact rules. Textareas grow automatically while
  retaining the approved 105 px minimum height and original resting controls.

## Verified behavior

Eight real integration test groups pass; see `integration-results.json`.
They cover authentication, anonymous/other-student access, privilege
escalation, invite email binding, admin/reviewer permissions, lesson progress,
private drafts, HTTPS submission validation, deadline enforcement, versioned
Revision submissions, review permissions, certificate eligibility, issuance,
public verification and revocation.

Browser checks have verified admin sign-in, course edits surviving reload,
lesson edits reaching a student, invitation creation, enrollment, lesson
completion, saved submission drafts surviving reload, submission, reviewer
draft persistence and publishing feedback.

The clean-release sweep covers all student content/result screens and all
seven admin/reviewer views. Every inspected view has no horizontal overflow,
no broken image and no duplicate element ID. Browser QA also confirms revised
submission history, a real issued certificate, the certificate dialog and
public verification. Assignment materials survive a subsequent main module
save. Final editor captures are `admin-curriculum-final.png` and
`admin-projects-final.png`.

The original preview collections are retained locally. The release exports
only the production portal, its dependencies and the selected Atlas assets.
A clean export of the staged release builds all 16 site routes successfully.
The TypeScript check passes and npm reports zero dependency vulnerabilities.
`curriculum-comparison-final.jpg` is the post-fix editor comparison at the
same viewport; the source collection bar is cropped by its measured 52 px.

## Live deployment

PR #1 merged as `4fb2e3354cff555fcd7f4756ab47229858ba807b`. GitHub Pages
run `41050287734` built and deployed successfully on 2026-10-30. The selected
Atlas portal is live at `https://www.sail-research.com/training/`.

Desktop Chrome at its actual 1745 × 777 viewport verified student/admin
sign-in using generated QA tokens, a saved submission draft after reload,
revision submission/history, lesson completion, a module edit after reload,
a private review draft after reload, published feedback, certificate issuance
and certificate verification with no signed-in session. Fifteen inspected
student/admin/public views have no horizontal overflow, broken images or
duplicate IDs; see `live-desktop-sweep.json` and `screens/live-*.png`.
Generated QA sign-in tokens do not prove email delivery. The existing shared
admin password form is present; no real administrator password was changed.

The disposable course, project, four profiles and Auth accounts were removed
after the live checks. The refreshed `cleanup.json` records zero QA resources.

## Remaining checks

- Production Auth routing is configured: the Site URL and both training
  redirect patterns were saved successfully in the user's Chrome Dashboard.
  The email page shows custom SMTP disabled. Provider setup and a real
  student email delivery check remain pending. Generated QA tokens verify
  Auth/session behavior; they do not verify SMTP delivery.
- Resend Free is selected; the user is completing account/DNS access in
  Chrome. Sender verification, SMTP connection and real delivery are pending.
