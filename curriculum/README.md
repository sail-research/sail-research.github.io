# SAIL Research Training: from foundations to a defensible experiment

This is the English teaching edition of the SAIL Undergraduate Training Program. It develops six modules into 42 lessons, five assessed foundation/pillar assignments and one assigned mini-project. The material is an original teaching synthesis, not an official MIT, PyTorch, NIST or conference course. Primary sources are credited where their concepts or methods are introduced; links are readings, not endorsements.

## How to study

First complete the setup and diagnostic guide. Then study Math Foundations and ML/DL in order. The three research pillars build on these foundations. Read the project-planning lessons before choosing a capstone; complete the brief assigned by your administrator. You do not need to complete all three capstone projects.

For each lesson: read the explanation, work the numerical example on paper, predict the code output, run the code, change one assumption, and answer the exercises before opening the self-check. Record the command, environment, seed and output in your research log. Completing a reading in the portal records reading progress; it does not replace the module assignment or reviewer approval.

The core pathway is intended for an intensive 4–8 week onboarding period with approximately 15–25 hours per week, adjusted by your mentor and diagnostic results. Full derivations, extension exercises and independent paper reading can require substantially longer. The enrollment deadline shown in the portal is authoritative; the reading estimates do not extend it.

## Prerequisites and support

You should be able to write a Python function, use a loop and dictionary, interpret a graph, manipulate fractions and solve a simple linear equation. Prior deep learning, federated learning or cybersecurity experience is not assumed. If the diagnostic is difficult, use the bridge activities and ask your mentor to adjust the schedule.

## What you will produce

1. A mathematical notebook with shape checks, gradient checks and an uncertainty analysis.
2. A supervised-learning baseline with a leakage-safe split and one controlled ablation.
3. A bounded trustworthy-AI audit with a precise threat model and denominators for every metric.
4. A federated simulation comparing IID and non-IID data under a stated budget.
5. An efficiency report separating model size, measured latency, memory and predictive quality.
6. One focused mini-project with a preregistered question, reproducible artifacts, results and limitations.

All laboratories use synthetic data or scikit-learn's bundled handwritten-digit dataset. They run locally on a CPU, do not require private student or patient data, and do not send training data to external services. Security experiments operate only on the learner's own toy models. A simulation is not a real distributed deployment; a noise demonstration is not a certified private training system.

## Assessment conventions

Each module brief contains a 100-point rubric. The course recommends Pass at 70 or above with all essential validity checks met, and Excellent at 90 or above with the stated extension and a defensible analysis. These are reviewer guidelines; the website records the reviewer-selected outcome, not an automatic numeric grade. Missing evidence or repairable errors should receive Revision while the submission window is open. Fabricated evidence, an unrepairable validity failure or an unmet final requirement can receive Fail with an explanation. Negative results can earn Excellent when the experiment is correct and informative.

Self-check solutions are intentionally visible for formative learning. Do the work first. A capstone submission must contain your own runs and reasoning, not a copied example table. Never present the tutorial's illustrative numbers as measurements from your machine.

## Files and maintenance

- `lessons/`: complete student readings in Markdown; the manifest maps them to stable production lesson IDs.
- `labs/`: runnable educational implementations, pinned dependencies, reproducibility utilities and meaningful checks.
- `assignments/`: five module briefs, project guidance and review rubrics.
- `references.json`: primary bibliography with verified URLs and reading scope.
- `manifest.json`: course/module/lesson publication mapping.

The source edition is versioned in the website repository. Published lesson text remains editable by course administrators in Training. The publishing script checks for changes since its backup so it cannot silently overwrite later instructor edits. No passwords, student records or service credentials belong in this directory or the downloadable lab bundle.
