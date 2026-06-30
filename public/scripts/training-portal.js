import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.SAIL_TRAINING_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

const state = {
  session: null,
  profile: null,
  inviteToken: new URLSearchParams(window.location.search).get('invite')?.trim() || '',
  tracks: [],
  projects: [],
  enrollments: [],
  profiles: [],
};

const panels = Object.fromEntries([...document.querySelectorAll('[data-panel]')].map((panel) => [panel.dataset.panel, panel]));
const statusBox = document.querySelector('[data-training-status]');
const loginForm = document.querySelector('[data-login-form]');
const enrollForm = document.querySelector('[data-enroll-form]');
const inviteSummary = document.querySelector('[data-invite-summary]');
const blockedMessage = document.querySelector('[data-blocked-message]');
const studentTitle = document.querySelector('[data-student-title]');
const studentMeta = document.querySelector('[data-student-meta]');
const studentStats = document.querySelector('[data-student-stats]');
const studentModules = document.querySelector('[data-student-modules]');
const studentProject = document.querySelector('[data-student-project]');
const studentCertificate = document.querySelector('[data-student-certificate]');
const adminMeta = document.querySelector('[data-admin-meta]');
const inviteForm = document.querySelector('[data-invite-form]');
const inviteOutput = document.querySelector('[data-invite-output]');
const projectForm = document.querySelector('[data-project-form]');
const trackSelect = document.querySelector('[data-track-select]');
const adminEnrollments = document.querySelector('[data-admin-enrollments]');
const adminSubmissions = document.querySelector('[data-admin-submissions]');

function showPanel(name) {
  Object.entries(panels).forEach(([key, panel]) => {
    panel.hidden = key !== name;
  });
}

function canManageTraining() {
  return ['admin', 'super_admin'].includes(state.profile?.role);
}

function syncAdminOnly() {
  document.querySelectorAll('[data-admin-only]').forEach((element) => {
    element.hidden = !canManageTraining();
  });
}

function setStatus(message, tone = 'neutral') {
  statusBox.textContent = message;
  statusBox.dataset.tone = tone;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function normalizeResult(value) {
  const labels = {
    excellent: 'Excellent',
    pass: 'Pass',
    revision: 'Revision',
    fail: 'Fail',
  };
  return labels[value] || 'Open';
}

function normalizeStatus(value) {
  return String(value || 'open').replace(/_/g, ' ');
}

function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function isOverdue(enrollment) {
  return enrollment?.deadline_at && Date.now() > new Date(enrollment.deadline_at).getTime();
}

function slugify(value) {
  return String(value || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'item';
}

function formValue(form, name) {
  const value = new FormData(form).get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function nullable(value) {
  return value ? value : null;
}

function absoluteTrainingUrl(token) {
  const origin = window.location.origin;
  return `${origin}${config.trainingPath}?invite=${encodeURIComponent(token)}`;
}

function certificateUrl(code) {
  const origin = window.location.origin;
  return `${origin}${config.certificatePath}?code=${encodeURIComponent(code)}`;
}

function throwIfError(result) {
  if (result.error) throw result.error;
  return result.data;
}

async function loadProfile() {
  const user = state.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('training_profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  state.profile = data;
  return data;
}

async function loadInviteSummary() {
  if (!state.inviteToken) {
    inviteSummary.textContent = 'Missing invite token.';
    return null;
  }

  const { data, error } = await supabase.rpc('get_training_invite', { invite_token: state.inviteToken });
  if (error) {
    inviteSummary.textContent = error.message;
    return null;
  }

  const invite = Array.isArray(data) ? data[0] : null;
  if (!invite) {
    inviteSummary.textContent = 'Invite link not found.';
    return null;
  }

  inviteSummary.textContent = invite.is_usable
    ? `${invite.track_title} (${invite.duration_weeks_min}-${invite.duration_weeks_max} weeks). Deadline is fixed after enrollment.`
    : 'This invite is expired or fully used.';

  return invite;
}

async function loadTracks() {
  const { data, error } = await supabase
    .from('training_tracks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  state.tracks = data || [];
  trackSelect.innerHTML = state.tracks
    .map((track) => `<option value="${escapeHtml(track.id)}">${escapeHtml(track.title)}</option>`)
    .join('');
}

async function loadProjects() {
  const { data, error } = await supabase
    .from('training_projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  state.projects = data || [];
}

async function loadStudentDashboard() {
  setStatus('Loading student dashboard...');

  const { data: enrollments, error: enrollmentError } = await supabase
    .from('training_enrollments')
    .select('*')
    .eq('profile_id', state.profile.id)
    .order('created_at', { ascending: false });
  if (enrollmentError) throw enrollmentError;

  const enrollment = enrollments?.[0];
  if (!enrollment) {
    if (state.inviteToken) {
      await loadInviteSummary();
      showPanel('enroll');
      setStatus('Complete enrollment to start training.');
    } else {
      blockedMessage.textContent = 'No active enrollment found. Please use the private invite link shared by the lab.';
      showPanel('blocked');
      setStatus('Training invite required.', 'error');
    }
    return;
  }

  const [{ data: track, error: trackError }, { data: modules, error: moduleError }, { data: certificates, error: certError }] =
    await Promise.all([
      supabase.from('training_tracks').select('*').eq('id', enrollment.track_id).single(),
      supabase.from('training_modules').select('*').eq('track_id', enrollment.track_id).order('order_index', { ascending: true }),
      supabase.from('training_certificates').select('*').eq('enrollment_id', enrollment.id),
    ]);

  if (trackError) throw trackError;
  if (moduleError) throw moduleError;
  if (certError) throw certError;

  const moduleIds = modules.map((module) => module.id);
  const [{ data: lessons, error: lessonError }, { data: submissions, error: submissionError }] = await Promise.all([
    moduleIds.length
      ? supabase.from('training_lessons').select('*').in('module_id', moduleIds).order('order_index', { ascending: true })
      : { data: [], error: null },
    supabase.from('training_submissions').select('*').eq('enrollment_id', enrollment.id).order('submitted_at', { ascending: false }),
  ]);

  if (lessonError) throw lessonError;
  if (submissionError) throw submissionError;

  const submissionIds = (submissions || []).map((submission) => submission.id);
  const { data: reviews, error: reviewError } = submissionIds.length
    ? await supabase.from('training_reviews').select('*').in('submission_id', submissionIds).order('reviewed_at', { ascending: false })
    : { data: [], error: null };
  if (reviewError) throw reviewError;

  let assignedProject = null;
  if (enrollment.assigned_project_id) {
    const { data, error } = await supabase
      .from('training_projects')
      .select('*')
      .eq('id', enrollment.assigned_project_id)
      .single();
    if (error) throw error;
    assignedProject = data;
  }

  renderStudentDashboard({ enrollment, track, modules, lessons: lessons || [], submissions: submissions || [], reviews: reviews || [], certificates: certificates || [], assignedProject });
  showPanel('student');
  setStatus(`Signed in as ${state.profile.email}.`, 'success');
}

function latestSubmission(submissions, targetKey, targetId) {
  return submissions.find((submission) => submission[targetKey] === targetId) || null;
}

function latestReview(reviews, submissionId) {
  return reviews.find((review) => review.submission_id === submissionId) || null;
}

function renderStudentDashboard(data) {
  const { enrollment, track, modules, lessons, submissions, reviews, certificates, assignedProject } = data;
  const closed = isOverdue(enrollment) || ['completed', 'failed', 'expired'].includes(enrollment.status);
  state.currentEnrollmentId = enrollment.id;
  panels.student.dataset.enrollmentId = enrollment.id;
  const passedCount = modules.filter((module) => {
    const submission = latestSubmission(submissions, 'module_id', module.id);
    const review = submission ? latestReview(reviews, submission.id) : null;
    return ['excellent', 'pass'].includes(review?.result);
  }).length;

  studentTitle.textContent = track.title;
  studentMeta.textContent = `Started ${formatDate(enrollment.created_at)}. Deadline ${formatDate(enrollment.deadline_at)}.`;
  studentStats.innerHTML = `
    <div class="training-stat"><strong>${passedCount}/${modules.length}</strong><span>modules passed</span></div>
    <div class="training-stat"><strong>${normalizeStatus(enrollment.status)}</strong><span>enrollment status</span></div>
    <div class="training-stat ${isOverdue(enrollment) ? 'danger' : ''}"><strong>${isOverdue(enrollment) ? 'Closed' : 'Open'}</strong><span>hard deadline</span></div>
    <div class="training-stat"><strong>${normalizeResult(enrollment.final_result)}</strong><span>final result</span></div>
  `;

  studentModules.innerHTML = modules.map((module) => {
    const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id);
    const submission = latestSubmission(submissions, 'module_id', module.id);
    const review = submission ? latestReview(reviews, submission.id) : null;
    return renderWorkCard({
      title: module.title,
      eyebrow: module.pillar.replace(/_/g, ' '),
      description: module.description,
      lessons: moduleLessons,
      submission,
      review,
      closed,
      formAttrs: `data-module-id="${escapeHtml(module.id)}"`,
    });
  }).join('');

  if (assignedProject) {
    const submission = latestSubmission(submissions, 'project_id', assignedProject.id);
    const review = submission ? latestReview(reviews, submission.id) : null;
    studentProject.innerHTML = renderWorkCard({
      title: assignedProject.title,
      eyebrow: `mini-project / ${assignedProject.difficulty}`,
      description: assignedProject.description,
      expectedOutput: assignedProject.expected_output,
      lessons: assignedProject.material_url ? [{ title: 'Project material', material_url: assignedProject.material_url }] : [],
      submission,
      review,
      closed,
      formAttrs: `data-project-id="${escapeHtml(assignedProject.id)}"`,
    });
  } else {
    studentProject.innerHTML = `
      <article class="training-card">
        <p class="training-eyebrow">Mini-project</p>
        <h3>Waiting for assignment</h3>
        <p>The admin team will assign a mini-project before final review.</p>
      </article>
    `;
  }

  const certificate = certificates?.[0];
  if (certificate) {
    studentCertificate.hidden = false;
    studentCertificate.innerHTML = `
      <h3>Certificate issued</h3>
      <p>${escapeHtml(certificate.program_title)} - ${normalizeResult(certificate.result)}</p>
      <a class="training-button" href="${escapeHtml(certificateUrl(certificate.certificate_code))}">Verify certificate</a>
    `;
  } else {
    studentCertificate.hidden = true;
  }

  document.querySelectorAll('[data-submit-work]').forEach((form) => {
    form.addEventListener('submit', submitWork);
  });
}

function renderWorkCard({ title, eyebrow, description, expectedOutput, lessons, submission, review, closed, formAttrs }) {
  const result = review?.result || (submission ? 'submitted' : 'open');
  const canSubmit = !closed && (!submission || review?.result === 'revision');
  const reviewHtml = review
    ? `<div class="training-review ${escapeHtml(review.result)}"><strong>${normalizeResult(review.result)}</strong><span>${escapeHtml(review.comment || 'Reviewed.')}</span></div>`
    : submission
      ? `<div class="training-review"><strong>Submitted</strong><span>${escapeHtml(formatDate(submission.submitted_at))}</span></div>`
      : '';

  return `
    <article class="training-card">
      <div class="training-card-head">
        <p class="training-eyebrow">${escapeHtml(eyebrow)}</p>
        <span class="training-badge ${escapeHtml(result)}">${escapeHtml(normalizeResult(result))}</span>
      </div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(description || '')}</p>
      ${expectedOutput ? `<p class="training-muted"><strong>Expected output:</strong> ${escapeHtml(expectedOutput)}</p>` : ''}
      ${lessons?.length ? `
        <ul class="training-materials">
          ${lessons.map((lesson) => `
            <li>
              ${lesson.material_url ? `<a href="${escapeHtml(lesson.material_url)}">${escapeHtml(lesson.title)}</a>` : `<span>${escapeHtml(lesson.title)}</span>`}
              ${lesson.description ? `<small>${escapeHtml(lesson.description)}</small>` : ''}
            </li>
          `).join('')}
        </ul>
      ` : ''}
      ${reviewHtml}
      ${submission ? `<a class="training-link" href="${escapeHtml(submission.drive_url)}">Open submitted Drive link</a>` : ''}
      ${canSubmit ? `
        <form class="training-form compact-form" data-submit-work ${formAttrs}>
          <label>
            <span>Submission Drive link</span>
            <input name="drive_url" type="url" placeholder="https://drive.google.com/..." required />
          </label>
          <label>
            <span>Note</span>
            <textarea name="note" rows="2"></textarea>
          </label>
          <button class="training-button primary compact" type="submit">${review?.result === 'revision' ? 'Resubmit' : 'Submit'}</button>
        </form>
      ` : ''}
    </article>
  `;
}

async function submitWork(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const enrollmentId = document.querySelector('[data-panel="student"]')?.dataset.enrollmentId;
  const payload = {
    target_enrollment_id: enrollmentId || state.currentEnrollmentId,
    target_module_id: form.dataset.moduleId || null,
    target_project_id: form.dataset.projectId || null,
    submission_drive_url: formValue(form, 'drive_url'),
    submission_note: nullable(formValue(form, 'note')),
  };

  setStatus('Submitting Drive link...');
  try {
    throwIfError(await supabase.rpc('submit_training_work', payload));
    setStatus('Submission received.', 'success');
    await loadStudentDashboard();
  } catch (error) {
    setStatus(error.message || 'Unable to submit work.', 'error');
  }
}

async function loadAdminDashboard() {
  setStatus('Loading admin dashboard...');
  await Promise.all([loadTracks(), loadProjects()]);

  const [{ data: profiles, error: profilesError }, { data: enrollments, error: enrollmentsError }, { data: submissions, error: submissionsError }] =
    await Promise.all([
      supabase.from('training_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('training_enrollments').select('*').order('created_at', { ascending: false }),
      supabase.from('training_submissions').select('*').order('submitted_at', { ascending: false }),
    ]);

  if (profilesError) throw profilesError;
  if (enrollmentsError) throw enrollmentsError;
  if (submissionsError) throw submissionsError;

  const submissionIds = (submissions || []).map((submission) => submission.id);
  const { data: reviews, error: reviewsError } = submissionIds.length
    ? await supabase.from('training_reviews').select('*').in('submission_id', submissionIds).order('reviewed_at', { ascending: false })
    : { data: [], error: null };
  if (reviewsError) throw reviewsError;

  const enrollmentIds = (enrollments || []).map((enrollment) => enrollment.id);
  const { data: certificates, error: certificatesError } = enrollmentIds.length
    ? await supabase.from('training_certificates').select('*').in('enrollment_id', enrollmentIds)
    : { data: [], error: null };
  if (certificatesError) throw certificatesError;

  state.profiles = profiles || [];
  state.enrollments = enrollments || [];
  syncAdminOnly();
  adminMeta.textContent = `Signed in as ${state.profile.email}. Role: ${state.profile.role}.`;
  renderAdminEnrollments({ enrollments: state.enrollments, profiles: state.profiles, tracks: state.tracks, projects: state.projects, certificates: certificates || [] });
  renderAdminSubmissions({ submissions: submissions || [], reviews: reviews || [], enrollments: state.enrollments, profiles: state.profiles });
  showPanel('admin');
  setStatus('Admin dashboard loaded.', 'success');
}

function renderAdminEnrollments({ enrollments, profiles, tracks, projects, certificates }) {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const canManage = canManageTraining();
  const projectOptions = ['<option value="">Unassigned</option>'].concat(
    projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.title)}</option>`)
  ).join('');
  const rows = enrollments.map((enrollment) => {
    const profile = profileById.get(enrollment.profile_id);
    const track = trackById.get(enrollment.track_id);
    const cert = certificates.find((certificate) => certificate.enrollment_id === enrollment.id);
    return `
      <tr>
        <td><strong>${escapeHtml(profile?.full_name || 'Unknown')}</strong><br /><span>${escapeHtml(profile?.email || '')}</span></td>
        <td>${escapeHtml(track?.title || 'Track')}</td>
        <td>${formatDate(enrollment.deadline_at)}</td>
        <td>${escapeHtml(normalizeStatus(enrollment.status))}</td>
        <td>${canManage ? `
          <select data-project-assignment="${escapeHtml(enrollment.id)}">
            ${projectOptions}
          </select>
        ` : escapeHtml(projects.find((project) => project.id === enrollment.assigned_project_id)?.title || 'Unassigned')}</td>
        <td>${canManage ? `
          <select data-final-result="${escapeHtml(enrollment.id)}">
            <option value="">Open</option>
            <option value="excellent">Excellent</option>
            <option value="pass">Pass</option>
            <option value="revision">Revision</option>
            <option value="fail">Fail</option>
          </select>
        ` : escapeHtml(normalizeResult(enrollment.final_result))}</td>
        <td>${canManage ? `<button class="training-button compact" type="button" data-save-enrollment="${escapeHtml(enrollment.id)}">Save</button>` : ''}
          ${cert ? `<a class="training-link" href="${escapeHtml(certificateUrl(cert.certificate_code))}">Certificate</a>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  adminEnrollments.innerHTML = rows
    ? `<table class="training-table"><thead><tr><th>Student</th><th>Track</th><th>Deadline</th><th>Status</th><th>Project</th><th>Final</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
    : '<p class="training-muted">No enrollments yet.</p>';

  if (canManage) {
    enrollments.forEach((enrollment) => {
      const projectSelect = document.querySelector(`[data-project-assignment="${CSS.escape(enrollment.id)}"]`);
      const resultSelect = document.querySelector(`[data-final-result="${CSS.escape(enrollment.id)}"]`);
      if (projectSelect) projectSelect.value = enrollment.assigned_project_id || '';
      if (resultSelect) resultSelect.value = enrollment.final_result || '';
    });

    document.querySelectorAll('[data-save-enrollment]').forEach((button) => {
      button.addEventListener('click', saveEnrollment);
    });
  }
}

function renderAdminSubmissions({ submissions, reviews, enrollments, profiles }) {
  const enrollmentById = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const openSubmissions = submissions.filter((submission) => !reviews.some((review) => review.submission_id === submission.id));

  adminSubmissions.innerHTML = openSubmissions.length
    ? openSubmissions.map((submission) => {
      const enrollment = enrollmentById.get(submission.enrollment_id);
      const profile = enrollment ? profileById.get(enrollment.profile_id) : null;
      return `
        <article class="training-review-card">
          <div>
            <p class="training-eyebrow">${escapeHtml(profile?.full_name || 'Student')}</p>
            <h4>${submission.module_id ? 'Module submission' : 'Mini-project submission'}</h4>
            <p><a href="${escapeHtml(submission.drive_url)}">Open Drive link</a></p>
            ${submission.note ? `<p class="training-muted">${escapeHtml(submission.note)}</p>` : ''}
          </div>
          <form class="training-form compact-form" data-review-form="${escapeHtml(submission.id)}">
            <label>
              <span>Result</span>
              <select name="result" required>
                <option value="pass">Pass</option>
                <option value="excellent">Excellent</option>
                <option value="revision">Revision</option>
                <option value="fail">Fail</option>
              </select>
            </label>
            <label>
              <span>Comment</span>
              <textarea name="comment" rows="2"></textarea>
            </label>
            <button class="training-button primary compact" type="submit">Review</button>
          </form>
        </article>
      `;
    }).join('')
    : '<p class="training-muted">No unreviewed submissions.</p>';

  document.querySelectorAll('[data-review-form]').forEach((form) => {
    form.addEventListener('submit', reviewSubmission);
  });
}

async function saveEnrollment(event) {
  const id = event.currentTarget.dataset.saveEnrollment;
  const projectId = document.querySelector(`[data-project-assignment="${CSS.escape(id)}"]`)?.value || null;
  const result = document.querySelector(`[data-final-result="${CSS.escape(id)}"]`)?.value || null;

  setStatus('Saving enrollment...');
  try {
    throwIfError(await supabase.from('training_enrollments').update({ assigned_project_id: projectId }).eq('id', id));
    if (result) {
      throwIfError(await supabase.rpc('set_training_final_result', {
        target_enrollment_id: id,
        target_result: result,
      }));
    }
    setStatus('Enrollment saved.', 'success');
    await loadAdminDashboard();
  } catch (error) {
    setStatus(error.message || 'Unable to save enrollment.', 'error');
  }
}

async function reviewSubmission(event) {
  event.preventDefault();
  const form = event.currentTarget;
  setStatus('Saving review...');
  try {
    throwIfError(await supabase.rpc('review_training_submission', {
      target_submission_id: form.dataset.reviewForm,
      review_result: formValue(form, 'result'),
      review_comment: nullable(formValue(form, 'comment')),
    }));
    setStatus('Review saved.', 'success');
    await loadAdminDashboard();
  } catch (error) {
    setStatus(error.message || 'Unable to save review.', 'error');
  }
}

async function sendMagicLink(event) {
  event.preventDefault();
  const email = formValue(loginForm, 'email').toLowerCase();
  const redirectUrl = `${window.location.origin}${config.trainingPath}${state.inviteToken ? `?invite=${encodeURIComponent(state.inviteToken)}` : ''}`;
  setStatus('Sending login email...');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    setStatus(error.message, 'error');
    return;
  }

  setStatus('Magic link sent. Open the email in this browser to continue.', 'success');
}

async function enroll(event) {
  event.preventDefault();
  setStatus('Creating enrollment...');
  try {
    throwIfError(await supabase.rpc('enroll_training', {
      invite_token: state.inviteToken,
      full_name: formValue(enrollForm, 'full_name'),
      affiliation: nullable(formValue(enrollForm, 'affiliation')),
    }));
    await loadProfile();
    await loadStudentDashboard();
  } catch (error) {
    setStatus(error.message || 'Unable to enroll.', 'error');
  }
}

async function createInvite(event) {
  event.preventDefault();
  setStatus('Creating invite...');
  const expires = formValue(inviteForm, 'expires_at');
  try {
    const data = throwIfError(await supabase
      .from('training_invites')
      .insert({
        track_id: formValue(inviteForm, 'track_id'),
        email_allowed: nullable(formValue(inviteForm, 'email_allowed').toLowerCase()),
        expires_at: expires ? new Date(expires).toISOString() : null,
        max_uses: Number(formValue(inviteForm, 'max_uses') || 1),
        created_by_profile_id: state.profile.id,
      })
      .select('token,expires_at,max_uses,email_allowed')
      .single());

    const url = absoluteTrainingUrl(data.token);
    inviteOutput.hidden = false;
    inviteOutput.innerHTML = `<strong>Invite link</strong><a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`;
    setStatus('Invite created.', 'success');
    inviteForm.reset();
  } catch (error) {
    setStatus(error.message || 'Unable to create invite.', 'error');
  }
}

async function createProject(event) {
  event.preventDefault();
  setStatus('Creating mini-project...');
  try {
    throwIfError(await supabase.from('training_projects').insert({
      title: formValue(projectForm, 'title'),
      slug: slugify(formValue(projectForm, 'title')),
      description: formValue(projectForm, 'description'),
      pillar: formValue(projectForm, 'pillar'),
      difficulty: formValue(projectForm, 'difficulty'),
      material_url: nullable(formValue(projectForm, 'material_url')),
      expected_output: nullable(formValue(projectForm, 'expected_output')),
      created_by_profile_id: state.profile.id,
    }));
    setStatus('Mini-project created.', 'success');
    projectForm.reset();
    await loadAdminDashboard();
  } catch (error) {
    setStatus(error.message || 'Unable to create mini-project.', 'error');
  }
}

async function signOut() {
  await supabase.auth.signOut();
  state.session = null;
  state.profile = null;
  showPanel('login');
  setStatus('Signed out.');
}

async function routeSession(session) {
  state.session = session;

  if (!session) {
    showPanel('login');
    setStatus(state.inviteToken ? 'Login to use this private invite.' : 'Login required.', 'neutral');
    return;
  }

  try {
    const profile = await loadProfile();
    if (profile?.role && ['reviewer', 'admin', 'super_admin'].includes(profile.role)) {
      await loadAdminDashboard();
      return;
    }

    if (!profile && state.inviteToken) {
      await loadInviteSummary();
      showPanel('enroll');
      setStatus(`Signed in as ${session.user.email}. Complete enrollment.`, 'success');
      return;
    }

    if (!profile) {
      blockedMessage.textContent = 'This email is not enrolled yet. Please use a valid invite link.';
      showPanel('blocked');
      setStatus('Invite required.', 'error');
      return;
    }

    await loadStudentDashboard();
  } catch (error) {
    blockedMessage.textContent = error.message || 'Training portal is not ready yet.';
    showPanel('blocked');
    setStatus(error.message || 'Unable to load training portal.', 'error');
  }
}

async function init() {
  loginForm.addEventListener('submit', sendMagicLink);
  enrollForm.addEventListener('submit', enroll);
  inviteForm.addEventListener('submit', createInvite);
  projectForm.addEventListener('submit', createProject);
  document.querySelectorAll('[data-logout-button]').forEach((button) => button.addEventListener('click', signOut));
  document.querySelector('[data-refresh-admin]')?.addEventListener('click', loadAdminDashboard);

  const { data } = await supabase.auth.getSession();
  await routeSession(data.session);

  supabase.auth.onAuthStateChange((_event, session) => {
    routeSession(session);
  });
}

init().catch((error) => {
  blockedMessage.textContent = error.message || 'Training portal failed to initialize.';
  showPanel('blocked');
  setStatus(error.message || 'Training portal failed to initialize.', 'error');
});
