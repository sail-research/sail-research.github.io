import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.SAIL_VISUAL_STUDIO_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const pageDefinitions = {
  home: { label: 'Home', path: '/', native: [['intro', 'Lab introduction'], ['news', 'News feed']] },
  news: { label: 'News', path: '/news/', native: [['intro', 'News introduction'], ['feed', 'News feed']] },
  research: { label: 'Research', path: '/research/', native: [['intro', 'Research introduction'], ['pillars', 'Research pillars'], ['trustworthy', 'Trustworthy AI'], ['distributed', 'Distributed Learning'], ['efficient', 'Efficient Machine Learning']] },
  projects: { label: 'Projects', path: '/projects/', native: [['intro', 'Projects introduction'], ['active', 'Active projects'], ['completed', 'Completed projects'], ['exploratory', 'Exploratory projects']] },
  people: { label: 'People', path: '/team/', native: [['intro', 'People introduction'], ['directory', 'People directory']] },
  teaching: { label: 'Teaching', path: '/teaching/', native: [['intro', 'Teaching introduction'], ['overview', 'Semester overview'], ['courses', 'Taught courses'], ['catalog', 'Course descriptions'], ['capstones', 'Capstone projects']] },
  publications: { label: 'Publications', path: '/publications/', native: [['intro', 'Publications introduction'], ['list', 'Publication list']] },
  gallery: { label: 'Gallery', path: '/gallery/', native: [['intro', 'Gallery introduction'], ['placeholder', 'Coming soon message']] },
};

const colorOptions = [
  { id: 'text', label: 'Ink' },
  { id: 'accent', label: 'SAIL blue' },
  { id: 'soft', label: 'Soft gray' },
];

const panels = Object.fromEntries([...document.querySelectorAll('[data-visual-panel]')].map((panel) => [panel.dataset.visualPanel, panel]));
const statusBox = document.querySelector('[data-visual-status]');
const loginForm = document.querySelector('[data-visual-login-form]');
const pageSelect = document.querySelector('[data-visual-page-select]');
const revisionSelect = document.querySelector('[data-visual-revision-select]');
const previewLink = document.querySelector('[data-visual-preview]');
const uploadInput = document.querySelector('[data-visual-upload-input]');

const state = {
  session: null,
  editor: null,
  pageKey: 'home',
  draftLayout: null,
  publishedVersion: 0,
  revisions: [],
  dirty: false,
  refreshing: false,
};

const setStatus = (message, tone = 'neutral') => {
  statusBox.textContent = message;
  statusBox.dataset.tone = tone;
};

const showPanel = (name) => Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== name; });
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
const cleanText = (value) => String(value || '').trim();
const newId = () => crypto.randomUUID?.() || `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultSettings = () => ({
  eyebrow: '', heading: '', intro: '', size: 'medium', weight: 'regular', color: 'text', surface: 'transparent', padding: 'normal', variant: 'standard',
});

const defaultLayout = (pageKey) => ({
  blocks: pageDefinitions[pageKey].native.map(([key]) => ({ id: `${pageKey}-${key}`, type: 'native', key, visible: true, settings: defaultSettings() })),
});

const normalizedSettings = (settings = {}) => ({
  ...defaultSettings(),
  ...Object.fromEntries(Object.entries(settings).filter(([, value]) => typeof value === 'string')),
});

const normalizeLayout = (layout, pageKey) => {
  const allowedNative = new Set(pageDefinitions[pageKey].native.map(([key]) => key));
  const seenNative = new Set();
  const blocks = Array.isArray(layout?.blocks) ? layout.blocks : [];
  return {
    blocks: blocks.flatMap((block) => {
      const type = cleanText(block?.type);
      if (type === 'native') {
        const key = cleanText(block.key);
        if (!allowedNative.has(key) || seenNative.has(key)) return [];
        seenNative.add(key);
        return [{ id: cleanText(block.id) || newId(), type, key, visible: block.visible !== false, settings: normalizedSettings(block.settings) }];
      }
      if (!['text', 'image', 'video', 'divider'].includes(type)) return [];
      return [{ id: cleanText(block.id) || newId(), type, visible: block.visible !== false, settings: normalizedSettings(block.settings) }];
    }),
  };
};

const attributeValue = (attributes, key, fallback = '') => attributes[`data-${key}`] ?? fallback;

const blockFromComponent = (component, index) => {
  const attributes = component.getAttributes();
  const type = attributes['data-sail-type'];
  if (!['native', 'text', 'image', 'video', 'divider'].includes(type)) return null;
  const settings = {
    eyebrow: attributeValue(attributes, 'eyebrow'),
    heading: attributeValue(attributes, 'heading'),
    intro: attributeValue(attributes, 'intro'),
    size: attributeValue(attributes, 'size', 'medium'),
    weight: attributeValue(attributes, 'weight', 'regular'),
    color: attributeValue(attributes, 'color', 'text'),
    surface: attributeValue(attributes, 'surface', 'transparent'),
    padding: attributeValue(attributes, 'padding', 'normal'),
    variant: attributeValue(attributes, 'variant', 'standard'),
    imageUrl: attributeValue(attributes, 'image-url'),
    imageAlt: attributeValue(attributes, 'image-alt'),
    caption: attributeValue(attributes, 'caption'),
    youtubeUrl: attributeValue(attributes, 'youtube-url'),
    videoTitle: attributeValue(attributes, 'video-title'),
  };
  return {
    id: attributeValue(attributes, 'sail-id', `block-${index + 1}`),
    type,
    ...(type === 'native' ? { key: attributeValue(attributes, 'sail-key') } : {}),
    visible: attributeValue(attributes, 'visible', 'true') !== 'false',
    settings,
  };
};

const previewMarkup = (block) => {
  const settings = normalizedSettings(block.settings);
  const label = block.type === 'native'
    ? pageDefinitions[state.pageKey].native.find(([key]) => key === block.key)?.[1] || 'Native section'
    : ({ text: 'Text section', image: 'Image', video: 'YouTube video', divider: 'Divider' }[block.type] || 'Block');
  const title = settings.heading || label;
  const body = block.type === 'image'
    ? settings.imageUrl ? 'Image selected from the SAIL media library.' : 'Upload an image or paste its URL in the block settings.'
    : block.type === 'video'
      ? settings.youtubeUrl ? 'YouTube video ready to embed on publish.' : 'Paste a YouTube URL in the block settings.'
      : settings.intro || (block.type === 'native' ? 'Connected to the existing live SAIL section.' : 'Add a heading and supporting copy.');
  return `<div class="sail-canvas-card sail-canvas-${escapeHtml(block.type)}"><p>${escapeHtml(block.type === 'native' ? 'Connected section' : 'New block')}</p><h2>${escapeHtml(title)}</h2><span>${escapeHtml(body)}</span></div>`;
};

const editorAttributes = (block) => {
  const settings = normalizedSettings(block.settings);
  return {
    'data-sail-type': block.type,
    'data-sail-id': block.id || newId(),
    'data-sail-key': block.key || '',
    'data-visible': String(block.visible !== false),
    'data-eyebrow': settings.eyebrow,
    'data-heading': settings.heading,
    'data-intro': settings.intro,
    'data-size': settings.size,
    'data-weight': settings.weight,
    'data-color': settings.color,
    'data-surface': settings.surface,
    'data-padding': settings.padding,
    'data-variant': settings.variant,
    'data-image-url': settings.imageUrl || '',
    'data-image-alt': settings.imageAlt || '',
    'data-caption': settings.caption || '',
    'data-youtube-url': settings.youtubeUrl || '',
    'data-video-title': settings.videoTitle || '',
  };
};

const componentFromBlock = (block) => ({ type: `sail-${block.type}`, attributes: editorAttributes(block), components: previewMarkup(block) });

const commonTraits = [
  { type: 'checkbox', name: 'data-visible', label: 'Visible', valueTrue: 'true', valueFalse: 'false' },
  { type: 'select', name: 'data-size', label: 'Text size', options: [{ id: 'small', label: 'Small' }, { id: 'medium', label: 'Medium' }, { id: 'large', label: 'Large' }] },
  { type: 'select', name: 'data-weight', label: 'Weight', options: [{ id: 'regular', label: 'Regular' }, { id: 'medium', label: 'Medium' }, { id: 'bold', label: 'Bold' }] },
  { type: 'select', name: 'data-color', label: 'Text color', options: colorOptions },
  { type: 'select', name: 'data-surface', label: 'Background', options: [{ id: 'transparent', label: 'White' }, { id: 'soft', label: 'Soft gray' }, { id: 'accent', label: 'SAIL blue' }] },
  { type: 'select', name: 'data-padding', label: 'Spacing', options: [{ id: 'tight', label: 'Tight' }, { id: 'normal', label: 'Normal' }, { id: 'roomy', label: 'Roomy' }] },
];

const traitsByType = {
  native: [{ type: 'text', name: 'data-eyebrow', label: 'Eyebrow' }, { type: 'text', name: 'data-heading', label: 'Heading' }, { type: 'textarea', name: 'data-intro', label: 'Supporting copy' }, { type: 'select', name: 'data-variant', label: 'Presentation', options: [{ id: 'standard', label: 'Standard' }, { id: 'compact', label: 'Compact' }, { id: 'figures', label: 'With paper figures' }, { id: 'text', label: 'Text only' }] }, ...commonTraits],
  text: [{ type: 'text', name: 'data-eyebrow', label: 'Eyebrow' }, { type: 'text', name: 'data-heading', label: 'Heading' }, { type: 'textarea', name: 'data-intro', label: 'Body' }, ...commonTraits],
  image: [{ type: 'text', name: 'data-image-url', label: 'Image URL' }, { type: 'text', name: 'data-image-alt', label: 'Alt text' }, { type: 'text', name: 'data-caption', label: 'Caption' }, ...commonTraits],
  video: [{ type: 'text', name: 'data-youtube-url', label: 'YouTube URL' }, { type: 'text', name: 'data-video-title', label: 'Video title' }, ...commonTraits],
  divider: [...commonTraits],
};

async function loadGrapes() {
  if (window.grapesjs) return window.grapesjs;
  if (!document.querySelector('[data-grapes-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'https://cdn.jsdelivr.net/npm/grapesjs@0.23.6/dist/css/grapes.min.css';
    style.dataset.grapesStyle = 'true';
    document.head.append(style);
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/grapesjs@0.23.6/dist/grapes.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Unable to load the visual editor library.'));
    document.head.append(script);
  });
  return window.grapesjs;
}

function refreshPreview(component) {
  if (state.refreshing || !component?.getAttributes?.()['data-sail-type']) return;
  state.refreshing = true;
  const block = blockFromComponent(component, 0);
  component.components(previewMarkup(block));
  lockPreviewChildren(component);
  state.refreshing = false;
}

function lockPreviewChildren(component) {
  component.components().forEach((child) => {
    child.set({ selectable: false, hoverable: false, draggable: false, droppable: false, editable: false });
    lockPreviewChildren(child);
  });
}

function registerComponents(editor) {
  ['native', 'text', 'image', 'video', 'divider'].forEach((type) => {
    editor.DomComponents.addType(`sail-${type}`, {
      model: {
        defaults: {
          tagName: 'section',
          draggable: true,
          droppable: false,
          stylable: false,
          traits: traitsByType[type],
        },
      },
    });
  });
  editor.on('component:update:attributes', refreshPreview);
  editor.on('update', () => { if (!state.refreshing) state.dirty = true; });
}

function setBlocks(editor) {
  editor.BlockManager.getAll().models.slice().forEach((block) => editor.BlockManager.remove(block.getId()));
  pageDefinitions[state.pageKey].native.forEach(([key, label]) => {
    editor.BlockManager.add(`native-${key}`, {
      label,
      category: 'This page',
      content: componentFromBlock({ id: newId(), type: 'native', key, visible: true, settings: defaultSettings() }),
    });
  });
  [
    ['text', 'Text section'],
    ['image', 'Image'],
    ['video', 'YouTube video'],
    ['divider', 'Divider'],
  ].forEach(([type, label]) => {
    editor.BlockManager.add(`content-${type}`, {
      label,
      category: 'Content',
      content: componentFromBlock({ id: newId(), type, visible: true, settings: defaultSettings() }),
    });
  });
}

async function ensureEditor() {
  if (state.editor) return state.editor;
  const grapesjs = await loadGrapes();
  const editor = grapesjs.init({
    container: '#sail-visual-editor',
    height: '720px',
    fromElement: false,
    storageManager: false,
    panels: { defaults: [] },
    blockManager: { appendTo: '#sail-visual-blocks' },
    styleManager: { sectors: [] },
    traitManager: { appendTo: '#sail-visual-traits' },
    canvas: {
      styles: [`${config.baseUrl}/styles/visual-canvas.css`],
    },
  });
  registerComponents(editor);
  state.editor = editor;
  return editor;
}

function setPreviewLink() {
  const path = pageDefinitions[state.pageKey].path;
  previewLink.href = `${config.baseUrl}${path}`;
}

function serializeLayout() {
  const components = state.editor.getWrapper().components().models;
  return normalizeLayout({ blocks: components.map(blockFromComponent).filter(Boolean) }, state.pageKey);
}

function loadLayout(layout) {
  const normalized = normalizeLayout(layout, state.pageKey);
  state.refreshing = true;
  state.editor.setComponents(normalized.blocks.map(componentFromBlock));
  state.editor.getWrapper().components().models.forEach(lockPreviewChildren);
  state.refreshing = false;
  state.draftLayout = normalized;
  state.dirty = false;
}

async function loadRevisions() {
  const { data, error } = await supabase
    .from('cms_visual_revisions')
    .select('id,version,layout,published_at')
    .eq('page_key', state.pageKey)
    .order('version', { ascending: false });
  if (error) throw error;
  state.revisions = data || [];
  revisionSelect.innerHTML = state.revisions.length
    ? state.revisions.map((revision) => `<option value="${escapeHtml(revision.id)}">Version ${escapeHtml(revision.version)} - ${new Date(revision.published_at).toLocaleString()}</option>`).join('')
    : '<option value="">No published versions yet</option>';
}

async function loadPage() {
  const editor = await ensureEditor();
  setStatus(`Loading ${pageDefinitions[state.pageKey].label}...`);
  const [{ data: draft, error: draftError }, { data: published, error: publishedError }] = await Promise.all([
    supabase.from('cms_visual_pages').select('draft_layout').eq('page_key', state.pageKey).maybeSingle(),
    supabase.from('cms_visual_published_pages').select('version').eq('page_key', state.pageKey).maybeSingle(),
  ]);
  if (draftError || publishedError) throw draftError || publishedError;
  setBlocks(editor);
  loadLayout(draft?.draft_layout || defaultLayout(state.pageKey));
  state.publishedVersion = published?.version || 0;
  await loadRevisions();
  setPreviewLink();
  setStatus(`${pageDefinitions[state.pageKey].label} draft loaded. Drag blocks to rearrange the page.`, 'success');
}

async function saveDraft() {
  const layout = serializeLayout();
  setStatus('Saving draft...');
  const { error } = await supabase.from('cms_visual_pages').update({ draft_layout: layout }).eq('page_key', state.pageKey);
  if (error) throw error;
  state.draftLayout = layout;
  state.dirty = false;
  setStatus('Draft saved. It is visible only in the Visual Editor.', 'success');
}

async function publishPage() {
  const layout = serializeLayout();
  const { data: current, error: currentError } = await supabase
    .from('cms_visual_published_pages')
    .select('version')
    .eq('page_key', state.pageKey)
    .maybeSingle();
  if (currentError) throw currentError;
  const version = (current?.version || 0) + 1;
  setStatus('Publishing layout...');
  const { error: draftError } = await supabase.from('cms_visual_pages').update({ draft_layout: layout }).eq('page_key', state.pageKey);
  if (draftError) throw draftError;
  const { error: publishError } = await supabase
    .from('cms_visual_published_pages')
    .upsert({ page_key: state.pageKey, layout, version, published_at: new Date().toISOString() });
  if (publishError) throw publishError;
  const { error: revisionError } = await supabase.from('cms_visual_revisions').insert({ page_key: state.pageKey, version, layout });
  if (revisionError) throw revisionError;
  state.draftLayout = layout;
  state.publishedVersion = version;
  state.dirty = false;
  await loadRevisions();
  setStatus(`Published version ${version}. The live website updates immediately.`, 'success');
}

async function restoreRevision() {
  const revision = state.revisions.find((item) => item.id === revisionSelect.value);
  if (!revision) return;
  loadLayout(revision.layout);
  setStatus(`Version ${revision.version} restored to the editor as a draft. Publish it when ready.`, 'success');
}

async function uploadSelectedImage(file) {
  const component = state.editor.getSelected();
  if (!component || component.getAttributes()['data-sail-type'] !== 'image') {
    throw new Error('Select an Image block before uploading.');
  }
  const extension = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `visual/${Date.now()}-${newId()}.${extension || 'png'}`;
  setStatus('Uploading image...');
  const { data, error } = await supabase.storage.from('cms-media').upload(path, file, { cacheControl: '31536000', upsert: false });
  if (error) throw error;
  const { data: url } = supabase.storage.from('cms-media').getPublicUrl(data.path);
  component.addAttributes({ 'data-image-url': url.publicUrl });
  refreshPreview(component);
  setStatus('Image uploaded. Save the draft or Publish when ready.', 'success');
}

async function openStudio() {
  const { data: access, error } = await supabase
    .from('cms_admins')
    .select('role')
    .eq('auth_user_id', state.session.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!access) {
    showPanel('blocked');
    setStatus('This account does not have CMS access.', 'error');
    return;
  }
  showPanel('studio');
  await loadPage();
}

async function refreshSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  state.session = data.session;
  if (!state.session) {
    showPanel('login');
    setStatus('Sign in to open the Visual Editor.');
    return;
  }
  await openStudio();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = new FormData(loginForm);
  const username = cleanText(values.get('username')).toLowerCase();
  const password = String(values.get('password') || '');
  if (username !== config.adminUsername || !password) {
    setStatus('Invalid account or password.', 'error');
    return;
  }
  setStatus('Signing in...');
  const { error } = await supabase.auth.signInWithPassword({ email: config.adminAuthEmail, password });
  if (error) {
    setStatus('Invalid account or password.', 'error');
    return;
  }
  loginForm.reset();
});

pageSelect.addEventListener('change', async () => {
  if (state.dirty && !window.confirm('Discard unsaved changes for this page?')) {
    pageSelect.value = state.pageKey;
    return;
  }
  state.pageKey = pageSelect.value;
  try {
    await loadPage();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Unable to load this page.', 'error');
  }
});

document.querySelector('[data-visual-save]').addEventListener('click', () => saveDraft().catch((error) => { console.error(error); setStatus(error.message || 'Unable to save the draft.', 'error'); }));
document.querySelector('[data-visual-publish]').addEventListener('click', () => publishPage().catch((error) => { console.error(error); setStatus(error.message || 'Unable to publish this page.', 'error'); }));
document.querySelector('[data-visual-restore]').addEventListener('click', () => restoreRevision().catch((error) => { console.error(error); setStatus(error.message || 'Unable to restore this revision.', 'error'); }));
document.querySelector('[data-visual-upload]').addEventListener('click', () => uploadInput.click());
document.querySelector('[data-visual-remove]').addEventListener('click', () => {
  const component = state.editor?.getSelected();
  if (!component || !component.getAttributes()['data-sail-type']) {
    setStatus('Select a block in the canvas first.', 'error');
    return;
  }
  component.remove();
  state.dirty = true;
  setStatus('Block removed from this draft. Save or Publish to keep the change.', 'success');
});
uploadInput.addEventListener('change', () => {
  const [file] = uploadInput.files || [];
  if (!file) return;
  uploadSelectedImage(file).catch((error) => { console.error(error); setStatus(error.message || 'Unable to upload the image.', 'error'); });
  uploadInput.value = '';
});
document.querySelectorAll('[data-visual-signout]').forEach((button) => button.addEventListener('click', async () => { await supabase.auth.signOut(); await refreshSession(); }));

supabase.auth.onAuthStateChange((_event, session) => {
  state.session = session;
  if (session) openStudio().catch((error) => setStatus(error.message || 'Unable to open the Visual Editor.', 'error'));
});

refreshSession().catch((error) => {
  console.error(error);
  showPanel('login');
  setStatus(error.message || 'Unable to prepare the Visual Editor.', 'error');
});
