# English curriculum release — 2026-10-31

## Scope

Six existing modules now have 42 original lessons (36,274 words in the lesson
sources, including code), 51 checked primary reference URLs, five assessed
module assignments and three alternative capstone briefs. A student completes
one assigned capstone. Six notebooks collect the lessons and executable Python
examples. Seven lab/artifact scripts provide CPU-sized experiments. A setup
guide includes prerequisite diagnostics; the course guide explains the intensive
4–8 week route and the additional time needed for deeper study.

The existing Research Atlas design, vector SAIL logo, authentication, enrollment
deadlines and manual review/certificate rules are retained. Training remains a
direct-link application excluded from public navigation and the sitemap.

## Validation

- `content-checks.json`: 42 complete lesson sources, manifest/source hashes,
  minimum substantive content, 42 executable Python examples, six executed
  notebooks and downloadable archive integrity.
- `renderer-checks.json`: all 42 lessons rendered with headings and references;
  no KaTeX parse errors. Hostile raw HTML, action attributes and unsafe URL
  fixtures cannot create executable UI. Markdown is sanitized before trusted
  KaTeX output is inserted.
- `curriculum/references.json`: URL, scope, source usage, verification timestamp,
  resolved URL and HTTP status for all 51 primary readings.
- `lab-checks.json`: the complete `run_all.py` run, invariant checks, environment,
  actual output inventory and representative metrics. Numerical results are
  observations from this run, not expected universal scores or performance
  promises. A separate CNN run also passed checkpoint replay.
- `publication.json`: production content read-back and learner-state fingerprint
  comparison. This is written only after successful publication.
- `browser-checks.json` and `screens/`: desktop Chrome evidence after release.

## Reproduce

Use Python 3.11 and the environment commands in `curriculum/SETUP.md`. From the
repository root:

```sh
python curriculum/labs/run_all.py --output tmp/curriculum-qa/full
python curriculum/labs/lab03_neural.py --model cnn --output tmp/curriculum-qa/cnn
python scripts/training-curriculum/prepare.py
python scripts/training-curriculum/validate.py
npm exec --yes --package=typescript@5.9.3 -- tsc --lib ES2022,DOM,DOM.Iterable --target ES2022 --module esnext --moduleResolution bundler --skipLibCheck --outDir tmp/curriculum-render src/scripts/training-live/lesson-content.ts
node scripts/training-curriculum/test-renderer.mjs
npm run build
```

No runtime dataset download or GPU is required by the core labs. The quantization
lab measures packed storage and dequantized float execution separately. Federated
experiments simulate clients; privacy demonstrations do not provide a private
training guarantee. These limitations are taught explicitly in the readings.

## Publish or revise

1. Edit Markdown, labs or assignments in `curriculum/`. Regenerate the manifest,
   notebooks and archive with `prepare.py`; run the affected checks.
2. Deploy the renderer and material bundle through the repository's normal Pages
   workflow. Only intended source files belong in the commit.
3. With the existing server credentials in ignored `.env.local`, run
   `node scripts/training-curriculum/publish.mjs plan`. Inspect the exact
   before/after backup in ignored `tmp/training-curriculum-publication-plan.json`.
4. Run `node scripts/training-curriculum/publish.mjs apply`, then `verify`.
   Production drift after the backup aborts publication. Existing lesson IDs are
   retained for matching topics; 31 deterministic IDs extend the original 11.
   Only lesson/module/project content fields are written. Learner state is
   fingerprinted before and after. A failed write attempts to restore original
   content and hide newly inserted lessons without deleting learner-linked rows.
5. Inspect student readings, formulas, code, downloads, assignment rubrics and
   admin editing/preview on desktop Chrome. Staff edits made directly in the
   portal should be reconciled into source before a subsequent publication.

Backups may include learner fingerprint metadata and must remain untracked.
Never commit environment files, auth sessions or student records. The public
download contains teaching material only; it does not contain private instructor
answers or credentials. Formative self-check answers are intentionally visible.
