# SAIL Research Website

A production-ready static website for **Security and Artificial Intelligence Lab (SAIL)** at VinUniversity.

The site is built with Astro, TypeScript, and Tailwind CSS. It is designed as a dark, minimal, editorial research lab website with placeholder visuals that can be replaced later.

## Tech stack

- Astro
- TypeScript
- Tailwind CSS v3 via `@astrojs/tailwind`
- Static output only
- GitHub Pages deployment through GitHub Actions
- No backend
- No CMS
- No analytics or tracking

## Local development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Editing content

Most content lives in `src/data`.

| File | Purpose |
| --- | --- |
| `src/data/site.ts` | Lab name, site URL, address, social placeholders |
| `src/data/nav.ts` | Main navigation |
| `src/data/news.ts` | News strip and news archive |
| `src/data/team.ts` | Professors, students, RAs, alumni, collaborators |
| `src/data/publications.ts` | Accepted papers and arXiv papers |
| `src/data/research.ts` | Research pillars |
| `src/data/projects.ts` | Project cards and project figures |
| `src/data/gallery.ts` | Gallery panels |

## Replacing placeholder images

The website currently uses geometric placeholder components and placeholder logo files.

Recommended folders:

```text
public/team/
public/projects/
public/gallery/
```

After adding real images, update the matching data files and components to use the new image paths.

## Registration photo uploads

The private registration form uploads member portraits to Supabase Storage bucket:

```text
member-photos
```

Run `docs/SUPABASE_MEMBER_PHOTOS_STORAGE.sql` once in the Supabase SQL Editor before testing registration uploads. The form accepts JPG, PNG, and WebP source images up to 12 MB, lets the user crop to a 1:1 portrait, uploads the cropped 800x800 JPG, then stores the public Storage URL in `lab_members.image_url`.

## Publications rules

The publications page is intentionally simple and does not include a paper search tool.

Current rules:

- Only include publications that list Prof. Kok-Seng Wong as an author.
- Put published or accepted papers in `Accepted Papers`.
- Put unaccepted preprints in `arXiv Papers`.
- Once an arXiv preprint is accepted, move it to `Accepted Papers` and remove it from the arXiv tab.
- Do not duplicate a work across both tabs.

## GitHub Pages deployment

This project is configured for:

```text
https://www.sail-research.com
```

The canonical repository is:

```text
https://github.com/sail-research/sail-research.github.io
```

Because the site is served from the domain root, `astro.config.mjs` sets:

```js
site: 'https://www.sail-research.com'
```

and does **not** set `base`.

To deploy:

1. Push source changes to the `main` branch.
2. Run `npm run build`.
3. Go to repository **Settings → Pages**.
4. Set the source to the `gh-pages` branch.
5. Publish the generated `dist/` directory to `gh-pages`, keeping `CNAME` in the deployed output.

## Custom domain

The GitHub Pages custom domain is already configured as:

```text
www.sail-research.com
```

Current domain requirements:

1. Keep `public/CNAME` set to `www.sail-research.com`.
2. Keep `base` unset in `astro.config.mjs`.
3. Keep `public/robots.txt` sitemap URL on the custom domain.

## Using a normal project repository instead

If the repository is not the special `sail-research.github.io` repo, for example:

```text
https://github.com/sail-research/sail-website
```

then the GitHub Pages URL will usually be:

```text
https://sail-research.github.io/sail-website/
```

In that case, update `astro.config.mjs`:

```js
site: 'https://sail-research.github.io',
base: '/sail-website'
```

You must also make sure internal links work with the configured base. The current version is optimized for `sail-research.github.io` with the `www.sail-research.com` custom domain.

## Data sources

Seed content was checked against public SAIL/VinUniversity pages, arXiv records, and official Astro deployment docs. See `docs/DATA_SOURCES.md` for details.

## Quality checklist

- Home, Team, Publications, Research, Projects, Gallery, News, and 404 pages are included.
- No Vacancies page or navigation link.
- No paper search tool.
- No analytics or tracking.
- All visuals are placeholders.
- The Professors section contains only Prof. Kok-Seng Wong.
- Publications are filtered to entries that include Prof. Kok-Seng Wong.
- Projects page exists and every project has a placeholder figure.
- Gallery uses a panel/masonry-style layout.
