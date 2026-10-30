# SAIL detailed Training curriculum

## Goal and editorial contract

Requested 2026-10-31: a complete, exceptionally detailed curriculum in English, including original explanations, worked examples, official references, runnable code and exercises. Publish into the existing Option 2 Training portal. Preserve course/module identities, access control, learner records and the visual family.

Audience: undergraduate research newcomers with basic Python and secondary-school algebra. A setup and diagnostic guide supplies the bridge. Core route fits the existing 4–8 week intensive program; deeper study is explicitly optional. Hours are estimates, not a promise that a beginner can master every extension in eight weeks.

42 authored lessons:

- Math (7): tensors and linear maps; least squares/SVD/PCA; gradients and chain rule; probability/Bayes/likelihood; estimation and uncertainty; optimization; numerical foundations laboratory.
- ML/DL (8): reproducible data workflow; supervised baselines; PyTorch training; CNNs; attention/Transformers; evaluation/calibration; debugging/reproducibility; controlled model comparison.
- Trustworthy AI (7): risk/threat models/shift; adversarial robustness; controlled backdoor study; defense evaluation; privacy/DP; group fairness/calibration; trustworthy audit.
- Distributed/FL (7): objectives and systems; FedAvg; heterogeneous data; FedProx/personalization; communication and availability; privacy/security; controlled federation benchmark.
- Efficient ML (7): resource accounting; latency/memory measurement; pruning; quantization; low rank/LoRA; distillation; Pareto study.
- Mini-project (6): question/literature; protocol/artifacts; trustworthy project; FL project; efficiency project; report/reproduction/defense.

Each lesson must include prerequisites, measurable outcomes, substantive explanations and derivations where relevant, an original worked example, guided implementation, pitfalls, exercises, self-check answers/hints, and specific primary-source reading with a reason to read it. No invented results or fabricated citations. Original teaching examples are distinct from reproductions of published experiments.

Code: CPU-sized synthetic or bundled public data; fixed environment; separate train/validation/test; explicit seeds; meaningful numerical/invariant tests; artifact outputs. GPU extensions are optional. Toy privacy/security demonstrations do not claim deployment guarantees.

Assessment: five module assignments and one assigned capstone, visible rubrics, reproducibility requirements and pass/excellent/revision/fail guidance aligned with the portal. Formative answers are visible; graded project conclusions are not pre-written.

## Delivery checklist

- [x] Inspect production: one track, six modules, eleven empty lesson bodies, three project briefs.
- [x] Confirm language: all English.
- [x] Verify primary references and record bibliography.
- [x] Author setup guide and all 42 lessons.
- [x] Author runnable laboratories, environment and notebooks/download bundle.
- [x] Run labs, validate mathematics and check exercise answers.
- [x] Add safe rich lesson rendering (code, tables, formulas, links) and mini-project lesson access.
- [x] Validate content completeness and security-sensitive rendering.
- [x] Back up exact production content; publish preserving IDs and learner records.
- [x] Deploy frontend; desktop Chrome verification of real lesson content/admin editing/downloads.
- [x] Verify deployed content counts, links, code artifacts and no public Training navigation.
- [x] Record handoff and mark goal complete.

## Production mapping

Project `rxnhlmrvwmepuphpithm`; track `81e30aaf-3703-418b-9586-35a3180fe425`.
Existing lesson UUIDs are reused for the closest matching topics in each module; new lessons get deterministic UUIDs. No enrollment deadline, role, progress, submission or certificate mutation is part of content publication. Publishing must detect unexpected changes since backup before overwriting any content.

Source of truth: Markdown lessons and JSON manifest in `curriculum/`, copied to Supabase `training_lessons.content`. Lab distribution contains only educational code and data, never credentials or instructor-private records. Staff can continue editing via the existing editor; republishing must explicitly detect drift.
