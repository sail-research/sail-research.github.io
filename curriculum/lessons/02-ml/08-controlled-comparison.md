# ML/DL laboratory: a baseline, an ablation and a defensible conclusion

**Core time:** 3–4 hours. **Prerequisites:** ML/DL 1–7. **Outcomes:** predeclare a comparison; run linear and neural baselines; isolate one design choice; report actual uncertainty and limits; prepare the module assignment.

## 1. Choose a question small enough to answer

A suitable question is: “Under a fixed digit split and validation-selection protocol, does a compact CNN improve predictive performance over a compact MLP at a stated parameter/training budget?” Another is: “How does hidden width affect the validation-selected MLP's accuracy and parameter count?” Do not combine a new architecture, optimizer, augmentation and data split into one change and then attribute the outcome to a single component.

Write the comparison before running it. Specify dataset/source, preprocessing, split indices, models, tuning grid, number of epochs or updates, validation rule, seed schedule, primary metric and secondary metrics. Explain which resource is matched and which is reported. Matching parameter count, training time and update count simultaneously is usually impractical; an honest protocol states the tradeoff.

## 2. The laboratory has a sequence, not a leaderboard

First run `lab02_baselines.py` to establish majority and linear references. Then run `lab03_neural.py` for an MLP and its CNN option using the same split seed. Inspect training/validation histories before inspecting final test outputs. For the assessed extension, use new output directories and a predeclared ablation. Preserve the original baseline artifacts so a later modification cannot silently replace them.

Use at least three training seeds for a stochastic comparison when computationally feasible. Separate the seed controlling the data split from the seed controlling model initialization if you intend to keep the split fixed. Changing both together estimates a different mixture of variation. The bundled core example is intentionally small; your report should identify exactly what varies in your extension.

## 3. Worked protocol and decision rule

Suppose your primary metric is macro F1 and your comparison is hidden width 32 versus 64. Keep preprocessing, split, optimizer family, learning-rate grid, maximum epochs and checkpoint-selection rule fixed. Select each candidate using validation macro F1 or explicitly explain another selection metric. Record all candidate results. Freeze the selected configurations, evaluate test and compute paired differences on matching examples/runs.

Do not announce “width 64 is better” from one decimal place. Report the observed effect, seed variation, finite-sample uncertainty if calculated, and the additional parameter cost. If the difference is uncertain or too small to matter, that is a useful conclusion. An architecture can be a poor practical choice even when its accuracy is slightly higher.

## 4. Evidence table template

| Field | What to record | Why it matters |
|---|---|---|
| Model/config ID | Architecture, width, optimizer and selected hyperparameters | Identifies the evaluated procedure |
| Split hash | Hash of the saved train/validation/test indices | Confirms pairing and prevents accidental split changes |
| Selection | Metric, candidate grid, epoch/tie rule | Makes development decisions auditable |
| Quality | Accuracy, macro F1, class supports and confusion matrix | Reveals failures hidden by an average |
| Variation | Per-seed values and stated uncertainty method | Separates one lucky run from repeatable evidence |
| Cost | Parameters and measured runtime with units/setup | Prevents a one-dimensional comparison |

Do not fill this table with invented sample scores. Generate it from the actual metrics JSON/CSV produced by your runs. Keep fractions and percentages consistent; label accuracy 0.92 or 92%, not “92” without a unit.

## 5. Build the argument from evidence

Begin with the question and scope. State the method sufficiently precisely for a peer to implement it. Present the baseline and ablation results with the same metric definitions. Discuss failure examples and plausible alternative explanations. End with a bounded conclusion: “Under this small dataset and budget, the measured change was…” is stronger scientific communication than an unsupported universal ranking.

Explain limitations such as the low-resolution dataset, one split, CPU-only environment, small seed count or a restricted hyperparameter search. Limitations are not a ceremonial final paragraph; they determine which conclusions are justified. If the ablation failed because of a coding bug, repair and rerun it before interpreting the scientific question.

## Exercises and self-check

1. Write a protocol in which the only experimental factor is dropout probability. Identify which random effects remain even after fixing the intended factor.
2. Design a negative control involving shuffled labels. Predict training and held-out behavior separately.
3. Reproduce the saved checkpoint's predictions in a fresh process, then verify confusion counts and metrics independently.
4. Write two conclusions from the same result: one justified and one exaggerated. Explain precisely which untested population or condition the exaggerated statement adds.

## Submission readiness

Submit code, environment, split identifiers, complete search/selection history, final per-example predictions, plots/tables and a 2–4 page report. Include the command for reproducing the main comparison, a runtime estimate measured on your machine and a short explanation of every assertion. The portal's module assignment contains the scoring rubric. A correct negative result can receive full credit; a high score without a valid protocol cannot.

## Primary reading

- [scikit-learn: common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html): perform a final leakage audit.
- [NeurIPS paper checklist](https://nips.cc/public/guides/PaperChecklist): check whether claims, assumptions, computational requirements and artifacts are supported.
