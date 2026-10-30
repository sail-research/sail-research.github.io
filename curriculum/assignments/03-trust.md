# Assignment: a bounded trustworthy-AI audit

## Objective and scope

Evaluate one local model under a precisely defined risk condition, with clean controls and honest metric denominators. Use only your own toy/public-data model. Estimated effort: 5–8 hours after the module. The assignment does not require attacking a third-party system or claiming a production guarantee.

## Required tasks

1. Write a threat model naming the system, asset, goal, knowledge, access, permitted changes, budget and eligible population.
2. Run the clean model and the provided bounded adversarial/backdoor demonstrations. Verify norm/domain limits, epsilon-zero identity, training-only poison edits and non-target ASR eligibility.
3. Choose one primary controlled extension: another perturbation budget/attack-strength comparison, another poisoning fraction/trigger control, or a defense with clearly stated knowledge and cost.
4. Preserve a clean control on the same examples. For backdoors, apply the trigger to the clean model too. For defenses, report clean utility and the evaluation adapted to the actual defended computation.
5. Explain DP adjacency, clipping and accounting using the synthetic arithmetic exercise. Explicitly state why this does not certify the trained model as private.
6. Compute one synthetic group-rate example with support counts and explain why one parity criterion does not establish overall fairness.

## Required evidence

Report raw success/eligible counts before rates, clean accuracy, the exact attack/trigger configuration and per-run outputs. Use at least three seeds for the primary extension when feasible. Show representative failure examples selected by a declared rule. Document what stronger/adaptive evaluations were not performed. Do not silently replace an unsuccessful hypothesis with a favorable test run.

## Deliverables

Submit a 3–5 page report, code/environment, split and poison indices where applicable, complete metric tables, figures, a short model card and a risk register with actions. Include a one-command reproduction and the meaningful invariant checks. Primary paper references must be linked and differences from their full experiments acknowledged.

## Rubric

| Criterion | Points | Full-credit evidence |
|---|---:|---|
| Threat model and scope | 20 | Timing, capabilities, budget and population are unambiguous |
| Implementation and controls | 25 | Constraints, isolated data edits, clean/negative controls |
| Metrics and analysis | 25 | Correct eligibility, utility tradeoffs, seeds and limitations |
| Privacy/fairness reasoning | 15 | Correct definitions without unsupported guarantees |
| Reproducibility and reporting | 15 | Raw evidence, model card, risk actions and runnable code |

Essential gates: authorized local scope, no fabricated results, no evaluation-data poisoning, correct denominators and no empirical-to-certified claim. Pass recommends at least 70 with all gates. Excellent recommends at least 90 plus a careful extension and an explanation of a plausible failure or alternative interpretation.

## Reviewer guidance

Ask the student to calculate ASR from saved counts and explain the clean-model trigger control. Check whether a claimed defense was evaluated under the same threat model and whether privacy/fairness claims exceed the experiment. A weak attack result is not automatically a strong defense. Use Revision for specific repairable omissions while submissions remain open; grade reasoning and evidence, not the magnitude of attack success.
