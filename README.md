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
https://sailresearch.github.io
```

It assumes the repository is the special GitHub Pages repository:

```text
sailresearch.github.io
```

Because this is a special `<username>.github.io` or `<organization>.github.io` repository, `astro.config.mjs` sets:

```js
site: 'https://sailresearch.github.io'
```

and does **not** set `base`.

To deploy:

1. Create a GitHub repository named `sailresearch.github.io`.
2. Push this project to the `main` branch.
3. Go to repository **Settings → Pages**.
4. Set the source to **GitHub Actions**.
5. The workflow in `.github/workflows/deploy.yml` will build and deploy automatically.

## Custom domain: sail-research.com

To switch from `https://sailresearch.github.io` to `https://sail-research.com`:

1. Rename `public/CNAME.example` to `public/CNAME`.
2. Keep the file content as:

   ```text
   sail-research.com
   ```

3. Update `astro.config.mjs`:

   ```js
   site: 'https://sail-research.com'
   ```

4. Keep `base` unset.
5. Configure GitHub Pages custom domain settings.
6. Configure DNS for the domain provider.
7. Update `public/robots.txt` sitemap URL to use the custom domain.

## Using a normal project repository instead

If the repository is not the special `sailresearch.github.io` repo, for example:

```text
https://github.com/sailresearch/sail-website
```

then the GitHub Pages URL will usually be:

```text
https://sailresearch.github.io/sail-website/
```

In that case, update `astro.config.mjs`:

```js
site: 'https://sailresearch.github.io',
base: '/sail-website'
```

You must also make sure internal links work with the configured base. The current version is optimized for the special `sailresearch.github.io` repository and custom domain deployment.

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
