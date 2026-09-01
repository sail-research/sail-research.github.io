import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.SAIL_CMS_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
});

const state = {
  session: null,
  access: null,
  news: [],
  publications: [],
  people: [],
  teachingOverview: null,
  courseCatalog: [],
  courseOfferings: [],
  capstones: [],
  pageSections: [],
};

const panels = Object.fromEntries([...document.querySelectorAll('[data-cms-panel]')].map((panel) => [panel.dataset.cmsPanel, panel]));
const views = Object.fromEntries([...document.querySelectorAll('[data-cms-view]')].map((view) => [view.dataset.cmsView, view]));
const statusBox = document.querySelector('[data-cms-status]');
const loginForm = document.querySelector('[data-cms-login-form]');

const showPanel = (name) => {
  Object.entries(panels).forEach(([key, panel]) => {
    panel.hidden = key !== name;
  });
};

const showView = (name) => {
  Object.entries(views).forEach(([key, view]) => {
    view.hidden = key !== name;
  });
  document.querySelectorAll('[data-cms-tab]').forEach((button) => {
    button.setAttribute('aria-selected', String(button.dataset.cmsTab === name));
  });
};

const setStatus = (message, tone = 'neutral') => {
  statusBox.textContent = message;
  statusBox.dataset.tone = tone;
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character]));

const asLines = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatLinks = (links = []) =>
  links
    .filter((link) => link?.label && link?.url)
    .map((link) => `${link.label} | ${link.url}`)
    .join('\n');

const parseLinks = (value) =>
  asLines(value)
    .map((line) => {
      const [label, ...rest] = line.split('|');
      const url = rest.join('|').trim();
      return { label: label?.trim(), url };
    })
    .filter((link) => link.label && /^https?:\/\//i.test(link.url));

const recordList = (name) => document.querySelector(`[data-cms-list="${name}"]`);
const formFor = (name) => document.querySelector(`[data-cms-form="${name}"]`);

const currentUserEmail = () => state.session?.user?.email || 'Signed in';
const isPublished = (record) => record.is_published !== false;

function setFormValue(form, name, value) {
  const field = form?.elements?.namedItem(name);
  if (!field) return;
  if (field.type === 'checkbox') {
    field.checked = Boolean(value);
    return;
  }
  field.value = value ?? '';
}

function resetForm(name) {
  const form = formFor(name);
  if (!form) return;
  form.reset();
  const idField = form.elements.namedItem('id');
  if (idField) idField.value = '';
  const codeOriginal = form.elements.namedItem('code_original');
  if (codeOriginal) codeOriginal.value = '';
  const published = form.elements.namedItem('is_published');
  if (published) published.checked = true;
  const today = new Date().toISOString().slice(0, 10);
  if (name === 'news') {
    setFormValue(form, 'sort_date', today);
    setFormValue(form, 'month_label', new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date()));
  }
  if (name === 'publications') {
    setFormValue(form, 'year', new Date().getFullYear());
    setFormValue(form, 'sort_date', today);
  }
  if (name === 'people') setFormValue(form, 'sort_order', 999);
  if (name === 'course-offerings' || name === 'capstones') setFormValue(form, 'sort_order', 0);
}

function fillNews(record) {
  const form = formFor('news');
  ['id', 'title', 'month_label', 'sort_date', 'label', 'summary', 'link_url', 'sort_order'].forEach((key) => setFormValue(form, key, record[key]));
  setFormValue(form, 'is_published', record.is_published);
}

function fillPublication(record) {
  const form = formFor('publications');
  ['id', 'title', 'venue', 'year', 'status', 'type', 'sort_date', 'metric_label', 'metric_source_year', 'metric_value', 'figure_url', 'sort_order'].forEach((key) => setFormValue(form, key, record[key]));
  setFormValue(form, 'authors', (record.authors || []).join('\n'));
  setFormValue(form, 'tags', (record.tags || []).join('\n'));
  setFormValue(form, 'links', formatLinks(record.links));
  setFormValue(form, 'is_published', record.is_published);
}

function fillPerson(record) {
  const form = formFor('people');
  ['id', 'name', 'email', 'group_key', 'status', 'cluster_slug', 'role_title', 'affiliation', 'homepage_url', 'scholar_url', 'image_url', 'sort_order'].forEach((key) => setFormValue(form, key, record[key]));
  setFormValue(form, 'research_interests', (record.research_interests || []).join('\n'));
}

function fillCourse(record) {
  const form = formFor('course-catalog');
  setFormValue(form, 'code_original', record.code);
  setFormValue(form, 'code', record.code);
  setFormValue(form, 'title', record.title);
  setFormValue(form, 'is_published', record.is_published);
}

function fillOffering(record) {
  const form = formFor('course-offerings');
  ['id', 'semester', 'course_code', 'credits', 'sort_order'].forEach((key) => setFormValue(form, key, record[key]));
  setFormValue(form, 'group_end', record.group_end);
  setFormValue(form, 'is_published', record.is_published);
}

function fillCapstone(record) {
  const form = formFor('capstones');
  ['id', 'year', 'title', 'sort_order'].forEach((key) => setFormValue(form, key, record[key]));
  setFormValue(form, 'students', (record.students || []).join('\n'));
  setFormValue(form, 'is_published', record.is_published);
}

function fillPageSection(record) {
  const form = formFor('page-sections');
  const labels = {
    home: 'Home',
    publications: 'Publications',
    intro: 'Introduction',
    news: 'News',
    list: 'Publication list',
  };
  ['id', 'page_key', 'section_key', 'eyebrow', 'heading', 'intro', 'layout_variant', 'sort_order'].forEach((key) => setFormValue(form, key, record[key]));
  setFormValue(form, 'page_label', labels[record.page_key]);
  setFormValue(form, 'section_label', labels[record.section_key]);
  setFormValue(form, 'is_visible', record.is_visible);
}

function renderActionButtons(type, key, canDelete = true) {
  return `<div class="cms-record-actions"><button class="cms-text-button" type="button" data-cms-edit="${type}" data-cms-key="${escapeHtml(key)}">Edit</button>${canDelete ? `<button class="cms-text-button danger" type="button" data-cms-delete="${type}" data-cms-key="${escapeHtml(key)}">Remove</button>` : ''}</div>`;
}

function renderNews() {
  const root = recordList('news');
  root.innerHTML = state.news.map((item) => `
    <article class="cms-record">
      <div><span class="cms-record-meta">${escapeHtml(item.month_label)} · ${escapeHtml(item.label)} · ${isPublished(item) ? 'Published' : 'Draft'}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div>
      ${renderActionButtons('news', item.id)}
    </article>`).join('') || '<p class="cms-empty">No news yet.</p>';
}

function renderPublications() {
  const root = recordList('publications');
  root.innerHTML = state.publications.map((item) => `
    <article class="cms-record">
      <div><span class="cms-record-meta">${escapeHtml(item.venue)} · ${escapeHtml(item.year)} · ${isPublished(item) ? 'Published' : 'Draft'}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml((item.authors || []).join(', '))}</p></div>
      ${renderActionButtons('publications', item.id)}
    </article>`).join('') || '<p class="cms-empty">No publications yet.</p>';
}

function renderPeople() {
  const root = recordList('people');
  root.innerHTML = state.people.map((person) => `
    <article class="cms-record">
      <div><span class="cms-record-meta">${escapeHtml(person.group_key)} · ${escapeHtml(person.status)}</span><h3>${escapeHtml(person.name)}</h3><p>${escapeHtml(person.role_title)}${person.affiliation ? ` · ${escapeHtml(person.affiliation)}` : ''}</p></div>
      ${renderActionButtons('people', person.id)}
    </article>`).join('') || '<p class="cms-empty">No people found.</p>';
}

function renderCourseOptions() {
  const options = state.courseCatalog.map((course) => `<option value="${escapeHtml(course.code)}">${escapeHtml(course.code)} · ${escapeHtml(course.title)}</option>`).join('');
  document.querySelectorAll('[data-cms-course-options]').forEach((select) => {
    const current = select.value;
    select.innerHTML = `<option value="">Select a course</option>${options}`;
    select.value = current;
  });
}

function renderTeaching() {
  const overviewForm = formFor('teaching-overview');
  setFormValue(overviewForm, 'current_semester_label', state.teachingOverview?.current_semester_label || '');
  setFormValue(overviewForm, 'current_course_codes', (state.teachingOverview?.current_course_codes || []).join('\n'));
  setFormValue(overviewForm, 'teaching_assistants', (state.teachingOverview?.teaching_assistants || []).join('\n'));
  renderCourseOptions();

  recordList('course-catalog').innerHTML = state.courseCatalog.map((course) => `
    <article class="cms-record compact"><div><span class="cms-record-meta">${isPublished(course) ? 'Visible' : 'Hidden'}</span><h3>${escapeHtml(course.code)}</h3><p>${escapeHtml(course.title)}</p></div>${renderActionButtons('course-catalog', course.code)}</article>`).join('') || '<p class="cms-empty">No courses yet.</p>';
  recordList('course-offerings').innerHTML = state.courseOfferings.map((course) => `
    <article class="cms-record compact"><div><span class="cms-record-meta">${isPublished(course) ? 'Visible' : 'Hidden'}</span><h3>${escapeHtml(course.semester)} · ${escapeHtml(course.course_code)}</h3><p>${escapeHtml(course.credits)} credits</p></div>${renderActionButtons('course-offerings', course.id)}</article>`).join('') || '<p class="cms-empty">No offerings yet.</p>';
  recordList('capstones').innerHTML = state.capstones.map((project) => `
    <article class="cms-record compact"><div><span class="cms-record-meta">${isPublished(project) ? 'Visible' : 'Hidden'}</span><h3>${escapeHtml(project.year)} · ${escapeHtml(project.title)}</h3><p>${escapeHtml((project.students || []).join(', '))}</p></div>${renderActionButtons('capstones', project.id)}</article>`).join('') || '<p class="cms-empty">No capstones yet.</p>';
}

function renderPageSections() {
  const root = recordList('page-sections');
  if (!root) return;
  const pageLabels = { home: 'Home', publications: 'Publications' };
  const sectionLabels = { intro: 'Introduction', news: 'News', list: 'Publication list' };
  root.innerHTML = state.pageSections.map((section) => `
    <article class="cms-record">
      <div>
        <span class="cms-record-meta">${escapeHtml(pageLabels[section.page_key])} · ${escapeHtml(section.layout_variant)} · ${section.is_visible ? 'Visible' : 'Hidden'}</span>
        <h3>${escapeHtml(sectionLabels[section.section_key])}</h3>
        <p>Order ${escapeHtml(section.sort_order)}</p>
      </div>
      ${renderActionButtons('page-sections', section.id, false)}
    </article>`).join('') || '<p class="cms-empty">No page sections configured yet.</p>';
}

async function loadData() {
  const [news, publications, people, overview, catalog, offerings, capstones, pageSections] = await Promise.all([
    supabase.from('cms_news').select('*').order('sort_date', { ascending: false }).order('sort_order', { ascending: false }),
    supabase.from('cms_publications').select('*').order('year', { ascending: false }).order('sort_date', { ascending: false }).order('sort_order', { ascending: false }),
    supabase.from('lab_members').select('id,name,email,group_key,status,cluster_slug,role_title,affiliation,image_url,homepage_url,scholar_url,research_interests,sort_order').order('sort_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('cms_teaching_overview').select('*').eq('id', 'default').maybeSingle(),
    supabase.from('cms_course_catalog').select('*').order('sort_order', { ascending: true }).order('code', { ascending: true }),
    supabase.from('cms_course_offerings').select('*').order('sort_order', { ascending: true }),
    supabase.from('cms_capstone_projects').select('*').order('year', { ascending: true }).order('sort_order', { ascending: true }),
    supabase.from('cms_page_sections').select('*').order('page_key', { ascending: true }).order('sort_order', { ascending: true }),
  ]);
  const results = [news, publications, people, overview, catalog, offerings, capstones, pageSections];
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
  state.news = news.data || [];
  state.publications = publications.data || [];
  state.people = people.data || [];
  state.teachingOverview = overview.data;
  state.courseCatalog = catalog.data || [];
  state.courseOfferings = offerings.data || [];
  state.capstones = capstones.data || [];
  state.pageSections = pageSections.data || [];
  renderNews();
  renderPublications();
  renderPeople();
  renderTeaching();
  renderPageSections();
}

async function uploadMedia(file, directory) {
  if (!file) return '';
  const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${directory}/${Date.now()}-${crypto.randomUUID()}.${extension || 'bin'}`;
  const { data, error } = await supabase.storage.from('cms-media').upload(path, file, { cacheControl: '31536000', upsert: false });
  if (error) throw error;
  const { data: url } = supabase.storage.from('cms-media').getPublicUrl(data.path);
  return url.publicUrl;
}

async function saveRecord(table, id, payload) {
  const result = id
    ? await supabase.from(table).update(payload).eq('id', id)
    : await supabase.from(table).insert(payload);
  if (result.error) throw result.error;
}

async function saveNews(form) {
  const values = new FormData(form);
  await saveRecord('cms_news', values.get('id'), {
    title: values.get('title').trim(), month_label: values.get('month_label').trim(), sort_date: values.get('sort_date'),
    label: values.get('label').trim(), summary: values.get('summary').trim(), link_url: values.get('link_url').trim() || null,
    is_published: values.has('is_published'), sort_order: Number(values.get('sort_order') || 0),
  });
}

async function savePublication(form) {
  const values = new FormData(form);
  let figureUrl = values.get('figure_url').trim() || null;
  const file = values.get('figure_file');
  if (file instanceof File && file.size) figureUrl = await uploadMedia(file, 'publications');
  await saveRecord('cms_publications', values.get('id'), {
    title: values.get('title').trim(), authors: asLines(values.get('authors')), venue: values.get('venue').trim(),
    year: Number(values.get('year')), status: values.get('status'), type: values.get('type'), tags: asLines(values.get('tags')),
    sort_date: values.get('sort_date'), metric_label: values.get('metric_label') || null,
    metric_source_year: values.get('metric_source_year').trim() || null, metric_value: values.get('metric_value').trim() || null,
    links: parseLinks(values.get('links')), figure_url: figureUrl, is_published: values.has('is_published'),
    sort_order: Number(values.get('sort_order') || 0),
  });
}

async function savePerson(form) {
  const values = new FormData(form);
  let imageUrl = values.get('image_url').trim() || null;
  const file = values.get('photo_file');
  if (file instanceof File && file.size) imageUrl = await uploadMedia(file, 'people');
  await saveRecord('lab_members', values.get('id'), {
    name: values.get('name').trim(), email: values.get('email').trim().toLowerCase(), group_key: values.get('group_key'),
    status: values.get('status'), cluster_slug: values.get('cluster_slug') || null, role_title: values.get('role_title').trim(),
    affiliation: values.get('affiliation').trim() || null, homepage_url: values.get('homepage_url').trim() || null,
    scholar_url: values.get('scholar_url').trim() || null, image_url: imageUrl,
    research_interests: asLines(values.get('research_interests')), sort_order: Number(values.get('sort_order') || 999),
  });
}

async function saveTeachingOverview(form) {
  const values = new FormData(form);
  const { error } = await supabase.from('cms_teaching_overview').upsert({
    id: 'default', current_semester_label: values.get('current_semester_label').trim(),
    current_course_codes: asLines(values.get('current_course_codes')),
    teaching_assistants: asLines(values.get('teaching_assistants')),
  });
  if (error) throw error;
}

async function saveCourse(form) {
  const values = new FormData(form);
  const original = values.get('code_original');
  const payload = { code: values.get('code').trim().toUpperCase(), title: values.get('title').trim(), is_published: values.has('is_published') };
  const result = original ? await supabase.from('cms_course_catalog').update(payload).eq('code', original) : await supabase.from('cms_course_catalog').insert(payload);
  if (result.error) throw result.error;
}

async function saveOffering(form) {
  const values = new FormData(form);
  await saveRecord('cms_course_offerings', values.get('id'), {
    semester: values.get('semester').trim(), course_code: values.get('course_code'), credits: Number(values.get('credits')),
    group_end: values.has('group_end'), is_published: values.has('is_published'), sort_order: Number(values.get('sort_order') || 0),
  });
}

async function saveCapstone(form) {
  const values = new FormData(form);
  await saveRecord('cms_capstone_projects', values.get('id'), {
    year: Number(values.get('year')), title: values.get('title').trim(), students: asLines(values.get('students')),
    is_published: values.has('is_published'), sort_order: Number(values.get('sort_order') || 0),
  });
}

async function savePageSection(form) {
  const values = new FormData(form);
  if (!values.get('id')) throw new Error('Choose a page section to edit first.');
  const { error } = await supabase.from('cms_page_sections').update({
    eyebrow: values.get('eyebrow').trim() || null,
    heading: values.get('heading').trim() || null,
    intro: values.get('intro').trim() || null,
    layout_variant: values.get('layout_variant'),
    is_visible: values.has('is_visible'),
    sort_order: Number(values.get('sort_order') || 0),
  }).eq('id', values.get('id'));
  if (error) throw error;
}

function findRecord(type, key) {
  const collections = {
    news: state.news, publications: state.publications, people: state.people,
    'course-catalog': state.courseCatalog, 'course-offerings': state.courseOfferings, capstones: state.capstones,
    'page-sections': state.pageSections,
  };
  const list = collections[type] || [];
  const lookup = type === 'course-catalog' ? 'code' : 'id';
  return list.find((record) => String(record[lookup]) === key);
}

async function deleteRecord(type, key) {
  const tables = {
    news: ['cms_news', 'id'], publications: ['cms_publications', 'id'], people: ['lab_members', 'id'],
    'course-catalog': ['cms_course_catalog', 'code'], 'course-offerings': ['cms_course_offerings', 'id'],
    capstones: ['cms_capstone_projects', 'id'],
  };
  const [table, column] = tables[type] || [];
  if (!table || !window.confirm('Remove this record? This cannot be undone.')) return;
  const { error } = await supabase.from(table).delete().eq(column, key);
  if (error) throw error;
}

async function handleEdit(type, key) {
  const record = findRecord(type, key);
  if (!record) return;
  const handlers = { news: fillNews, publications: fillPublication, people: fillPerson, 'course-catalog': fillCourse, 'course-offerings': fillOffering, capstones: fillCapstone, 'page-sections': fillPageSection };
  if (!handlers[type]) return;
  handlers[type](record);
  const targetView = ['course-catalog', 'course-offerings', 'capstones'].includes(type) ? 'teaching' : type === 'page-sections' ? 'layout' : type;
  showView(targetView);
  formFor(type).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveForm(form) {
  const key = form.dataset.cmsForm;
  const handlers = {
    news: saveNews, publications: savePublication, people: savePerson, 'teaching-overview': saveTeachingOverview,
    'course-catalog': saveCourse, 'course-offerings': saveOffering, capstones: saveCapstone, 'page-sections': savePageSection,
  };
  setStatus('Saving changes...');
  await handlers[key](form);
  await loadData();
  if (!['teaching-overview', 'page-sections'].includes(key)) resetForm(key);
  setStatus('Saved. The published website updates immediately.', 'success');
}

async function openWorkspace() {
  const { data: access, error } = await supabase
    .from('cms_admins')
    .select('*')
    .eq('auth_user_id', state.session.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!access) {
    showPanel('blocked');
    setStatus('This account does not have CMS access.', 'error');
    return;
  }
  state.access = access;
  document.querySelector('[data-cms-user-name]').textContent = currentUserEmail();
  document.querySelector('[data-cms-user-role]').textContent = `${access.role === 'admin' ? 'Admin' : 'Editor'} access`;
  showPanel('dashboard');
  showView('news');
  await loadData();
  ['news', 'publications', 'people', 'course-catalog', 'course-offerings', 'capstones'].forEach(resetForm);
  setStatus('Content Studio is ready. Published changes are live immediately.', 'success');
}

async function refreshSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  state.session = data.session;
  if (!state.session) {
    state.access = null;
    showPanel('login');
    setStatus('Sign in to edit the website.');
    return;
  }
  await openWorkspace();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = new FormData(loginForm);
  const username = String(values.get('username') || '').trim().toLowerCase();
  const password = String(values.get('password') || '');
  if (username !== config.adminUsername || !password) {
    setStatus('Invalid account or password.', 'error');
    return;
  }
  setStatus('Signing in...');
  const { error } = await supabase.auth.signInWithPassword({
    email: config.adminAuthEmail,
    password,
  });
  if (error) {
    setStatus('Invalid account or password.', 'error');
    return;
  }
  loginForm.reset();
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-cms-form]');
  if (!form || form === loginForm) return;
  event.preventDefault();
  try {
    await saveForm(form);
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Unable to save this record.', 'error');
  }
});

document.addEventListener('click', async (event) => {
  const tab = event.target.closest('[data-cms-tab]');
  if (tab) showView(tab.dataset.cmsTab);
  const reset = event.target.closest('[data-cms-reset]');
  if (reset) resetForm(reset.dataset.cmsReset);
  const edit = event.target.closest('[data-cms-edit]');
  if (edit) await handleEdit(edit.dataset.cmsEdit, edit.dataset.cmsKey);
  const remove = event.target.closest('[data-cms-delete]');
  if (remove) {
    try {
      await deleteRecord(remove.dataset.cmsDelete, remove.dataset.cmsKey);
      await loadData();
      setStatus('Record removed.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Unable to remove this record.', 'error');
    }
  }
  if (event.target.closest('[data-cms-signout]')) {
    await supabase.auth.signOut();
    await refreshSession();
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  state.session = session;
  if (session) openWorkspace().catch((error) => setStatus(error.message || 'Unable to open CMS.', 'error'));
});

refreshSession().catch((error) => {
  console.error(error);
  showPanel('login');
  setStatus(error.message || 'Unable to prepare the CMS.', 'error');
});
