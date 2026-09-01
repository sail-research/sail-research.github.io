const config = window.SAIL_VISUAL_CONFIG;

if (config) {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
  const safeUrl = (value) => {
    try {
      const url = new URL(String(value || ''));
      return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  };
  const youtubeEmbedUrl = (value) => {
    const url = safeUrl(value);
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const id = parsed.hostname === 'youtu.be'
        ? parsed.pathname.slice(1)
        : parsed.hostname.endsWith('youtube.com')
          ? parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop()
          : '';
      return id && /^[a-zA-Z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : '';
    } catch {
      return '';
    }
  };
  const asBlocks = (layout) => Array.isArray(layout?.blocks) ? layout.blocks.filter((block) => block && typeof block === 'object') : [];
  const setText = (root, selector, value) => {
    if (!value) return;
    root.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
      element.hidden = false;
    });
  };
  const applyPresentation = (root, settings = {}) => {
    root.dataset.sailVisualSize = settings.size || 'medium';
    root.dataset.sailVisualWeight = settings.weight || 'regular';
    root.dataset.sailVisualColor = settings.color || 'text';
    root.dataset.sailVisualSurface = settings.surface || 'transparent';
    root.dataset.sailVisualPadding = settings.padding || 'normal';
    root.dataset.sailVisualVariant = settings.variant || 'standard';
    root.dataset.layout = settings.variant || 'standard';
  };
  const renderExtraBlock = (block) => {
    const settings = block.settings || {};
    const root = document.createElement('section');
    root.className = 'sail-visual-extra';
    root.dataset.sailRendered = block.id || '';
    applyPresentation(root, settings);
    if (block.type === 'text') {
      root.innerHTML = `${settings.eyebrow ? `<p class="academic-kicker">${escapeHtml(settings.eyebrow)}</p>` : ''}${settings.heading ? `<h2 class="academic-section-title">${escapeHtml(settings.heading)}</h2>` : ''}${settings.intro ? `<p class="academic-section-intro">${escapeHtml(settings.intro)}</p>` : ''}`;
      return root;
    }
    if (block.type === 'image') {
      const imageUrl = safeUrl(settings.imageUrl);
      if (!imageUrl) return null;
      root.innerHTML = `<figure class="sail-visual-image"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(settings.imageAlt || '')}" loading="lazy" />${settings.caption ? `<figcaption>${escapeHtml(settings.caption)}</figcaption>` : ''}</figure>`;
      return root;
    }
    if (block.type === 'video') {
      const embedUrl = youtubeEmbedUrl(settings.youtubeUrl);
      if (!embedUrl) return null;
      root.innerHTML = `<div class="sail-visual-video"><iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(settings.videoTitle || 'YouTube video')}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
      return root;
    }
    if (block.type === 'divider') {
      root.innerHTML = '<hr class="sail-visual-divider" />';
      return root;
    }
    return null;
  };
  const applyLayout = (pageRoot, layout) => {
    const blocks = asBlocks(layout);
    if (!blocks.length) return;
    pageRoot.querySelectorAll('[data-sail-rendered]').forEach((element) => element.remove());
    const nativeRoots = new Map([...pageRoot.querySelectorAll('[data-sail-native]')].map((root) => [root.dataset.sailNative, root]));
    const configuredNative = new Set(blocks.filter((block) => block.type === 'native').map((block) => block.key));
    nativeRoots.forEach((root, key) => { root.hidden = !configuredNative.has(key); });
    blocks.forEach((block) => {
      if (block.type === 'native') {
        const root = nativeRoots.get(block.key);
        if (!root) return;
        root.hidden = block.visible === false;
        applyPresentation(root, block.settings);
        setText(root, '[data-sail-eyebrow]', block.settings?.eyebrow);
        setText(root, '[data-sail-heading]', block.settings?.heading);
        setText(root, '[data-sail-intro]', block.settings?.intro);
        pageRoot.append(root);
        return;
      }
      if (block.visible === false) return;
      const extra = renderExtraBlock(block);
      if (extra) pageRoot.append(extra);
    });
  };
  const pageRoot = document.querySelector('[data-sail-visual-page]');
  if (pageRoot) {
    const pageKey = pageRoot.dataset.sailVisualPage;
    const headers = { apikey: config.supabasePublishableKey, Authorization: `Bearer ${config.supabasePublishableKey}` };
    fetch(`${config.supabaseUrl}/rest/v1/cms_visual_published_pages?select=layout&page_key=eq.${encodeURIComponent(pageKey)}`, { headers })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load visual layout.')))
      .then((rows) => { if (rows[0]?.layout) applyLayout(pageRoot, rows[0].layout); })
      .catch((error) => console.warn('Unable to load visual layout; keeping the built fallback.', error));
  }
}
