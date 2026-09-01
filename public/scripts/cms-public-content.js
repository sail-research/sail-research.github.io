const config = window.SAIL_CMS_CONTENT_CONFIG;

if (config) {
  const headers = {
    apikey: config.supabasePublishableKey,
    Authorization: `Bearer ${config.supabasePublishableKey}`,
  };

  const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[character]));

  const siteUrl = (value) => {
    if (!value) return '';
    const text = String(value).trim();
    if (text.startsWith('/')) return `${config.baseUrl}${text}`;
    try {
      const url = new URL(text);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  };

  const fetchRows = async (table, query) => {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${query}`, { headers });
    if (!response.ok) throw new Error(`Unable to load ${table}`);
    return response.json();
  };

  const renderNews = (items) => {
    document.querySelectorAll('[data-cms-news-list]').forEach((root) => {
      const compact = root.closest('[data-layout="compact"]');
      const content = items.map((item) => {
      const url = siteUrl(item.link_url);
      const title = url ? `<a href="${escapeHtml(url)}">${escapeHtml(item.title)}</a>` : escapeHtml(item.title);
      const summary = compact ? '' : `<br />${escapeHtml(item.summary)}`;
      return `<li class="academic-news-item"><span class="academic-news-date">${escapeHtml(item.month_label)}</span><span class="academic-news-text">${title}<span class="academic-news-label"> - ${escapeHtml(item.label)}</span>${summary}</span></li>`;
      }).join('');
      root.innerHTML = content;
    });
  };

  const firstLink = (links) => Array.isArray(links) ? links.find((link) => link?.url)?.url : '';
  const linkLabel = (item) => {
    const label = String(item.label || '').toLowerCase();
    const url = String(item.url || '').toLowerCase();
    if (label.includes('code') || url.includes('github.com')) return 'Code';
    if (label.includes('project') || label.includes('homepage')) return 'Project';
    if (label.includes('arxiv') || url.includes('arxiv.org')) return 'Preprint';
    return 'Paper';
  };
  const venueText = (publication) => {
    if (publication.type === 'preprint') return 'preprint';
    const year = String(publication.year);
    const venue = publication.venue.includes(year) ? publication.venue : `${publication.venue} ${year}`;
    if (publication.type === 'workshop') return venue.toLowerCase().includes(' workshop') ? venue : `${venue} Workshop`;
    if (!publication.metric_value) return venue;
    return publication.type === 'journal'
      ? `${venue}: Impact Factor ${publication.metric_value}`
      : `${venue}: ${publication.metric_value}`;
  };

  const publicationMarkup = (items, showFigures) => {
    const byYear = new Map();
    items.forEach((item) => {
      if (!byYear.has(item.year)) byYear.set(item.year, []);
      byYear.get(item.year).push(item);
    });
    const content = [...byYear.entries()]
      .sort(([left], [right]) => right - left)
      .map(([year, group]) => `<div class="academic-year-group"><div class="academic-year">${escapeHtml(year)}</div><ul class="academic-publication-list">${group.map((publication) => {
        const link = siteUrl(firstLink(publication.links));
        const figure = siteUrl(publication.figure_url);
        const figureMarkup = showFigures && figure
          ? link
            ? `<a class="academic-publication-figure" href="${escapeHtml(link)}" aria-label="Open ${escapeHtml(publication.title)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(figure)}" alt="Original figure from ${escapeHtml(publication.title)}" loading="lazy" decoding="async" /></a>`
            : `<div class="academic-publication-figure"><img src="${escapeHtml(figure)}" alt="Original figure from ${escapeHtml(publication.title)}" loading="lazy" decoding="async" /></div>`
          : '';
        const title = link
          ? `<a class="academic-publication-title" href="${escapeHtml(link)}" target="_blank" rel="noreferrer">${escapeHtml(publication.title)}</a>`
          : `<span class="academic-publication-title">${escapeHtml(publication.title)}</span>`;
        const links = Array.isArray(publication.links) && publication.links.length
          ? `<span class="academic-publication-links">${publication.links.map((item) => {
            const url = siteUrl(item.url);
            return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(linkLabel(item))}</a>` : '';
          }).join('')}</span>`
          : '';
        return `<li class="academic-publication-item${showFigures && figure ? '' : ' academic-publication-item--no-figure'}">${figureMarkup}<div class="academic-publication-details">${title}<span class="academic-authors">${escapeHtml((publication.authors || []).join(', '))}</span><span class="academic-venue">${escapeHtml(venueText(publication))}</span>${links}</div></li>`;
      }).join('')}</ul></div>`)
      .join('');
    return content;
  };

  const renderPublications = (items) => {
    document.querySelectorAll('[data-cms-publications]').forEach((root) => {
      root.innerHTML = publicationMarkup(items, root.dataset.layout !== 'text');
    });
  };

  const renderTeaching = (overview, catalog, offerings, capstones) => {
    const catalogByCode = new Map(catalog.map((course) => [course.code, course]));
    const current = (overview?.current_course_codes || []).map((code) => catalogByCode.get(code)).filter(Boolean);
    const overviewMarkup = `<div class="academic-two-column"><section class="academic-card teaching-summary-card"><p class="academic-kicker">Current semester</p><h2>${escapeHtml(overview?.current_semester_label || '')}</h2><ul class="academic-clean-list">${current.map((course) => `<li><strong>${escapeHtml(course.code)}</strong>: ${escapeHtml(course.title)}</li>`).join('')}</ul></section><section class="academic-card teaching-summary-card"><p class="academic-kicker">SAIL teaching assistants</p><h2>${escapeHtml(overview?.current_semester_label || '')}</h2>${overview?.teaching_assistants?.length ? `<ul class="academic-clean-list">${overview.teaching_assistants.map((name) => `<li>${escapeHtml(name)}</li>`).join('')}</ul>` : '<p class="teaching-empty-note">TA assignments for this semester will be listed here.</p>'}</section></div>`;
    document.querySelectorAll('[data-cms-teaching-overview]').forEach((root) => { root.innerHTML = overviewMarkup; });
    document.querySelectorAll('[data-cms-course-offerings]').forEach((root) => {
      root.innerHTML = offerings.map((course, index) => `<tr class="${course.group_end ? 'teaching-row-end' : ''}"><td>${index + 1}</td><td>${escapeHtml(course.semester)}</td><td><code>${escapeHtml(course.course_code)}</code></td><td>${escapeHtml(course.credits)}</td></tr>`).join('');
    });
    document.querySelectorAll('[data-cms-course-catalog]').forEach((root) => {
      root.innerHTML = catalog.map((course) => `<article class="academic-card teaching-course-card"><h3>${escapeHtml(course.code)}</h3><p>${escapeHtml(course.title)}</p></article>`).join('');
    });
    document.querySelectorAll('[data-cms-capstones]').forEach((root) => {
      root.innerHTML = capstones.map((project) => `<article class="academic-project"><h3>${escapeHtml(project.year)} - <em>${escapeHtml(project.title)}</em></h3><p>${escapeHtml((project.students || []).join(', '))}</p></article>`).join('');
    });
  };

  const tasks = [];
  if (document.querySelector('[data-cms-news-list]')) {
    tasks.push(fetchRows('cms_news', 'select=month_label,sort_date,label,title,summary,link_url&is_published=eq.true&order=sort_date.desc,sort_order.desc').then((items) => { if (items.length) renderNews(items); }));
  }
  if (document.querySelector('[data-cms-publications]')) {
    tasks.push(fetchRows('cms_publications', 'select=title,authors,venue,year,status,type,tags,sort_date,metric_label,metric_source_year,metric_value,links,figure_url&is_published=eq.true&order=year.desc,sort_date.desc,sort_order.desc').then((items) => { if (items.length) renderPublications(items); }));
  }
  if (document.querySelector('[data-cms-teaching-overview]')) {
    tasks.push(Promise.all([
      fetchRows('cms_teaching_overview', 'select=*&id=eq.default'),
      fetchRows('cms_course_catalog', 'select=*&is_published=eq.true&order=sort_order.asc,code.asc'),
      fetchRows('cms_course_offerings', 'select=*&is_published=eq.true&order=sort_order.asc'),
      fetchRows('cms_capstone_projects', 'select=*&is_published=eq.true&order=year.asc,sort_order.asc'),
    ]).then(([overview, catalog, offerings, capstones]) => {
      if (overview[0] || catalog.length || offerings.length || capstones.length) renderTeaching(overview[0], catalog, offerings, capstones);
    }));
  }
  Promise.all(tasks).catch((error) => console.warn('Unable to load CMS content; keeping the published fallback.', error));
}
