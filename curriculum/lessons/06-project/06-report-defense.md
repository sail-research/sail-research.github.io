# Write the report, reproduce the evidence and defend the conclusion

**Core time:** 2–3 hours, plus revision. **Prerequisites:** completed assigned experiments and artifact inventory. **Outcomes:** connect claims to evidence; write informative captions and limitations; reproduce a selected result; respond to review constructively.

## 1. Organize around the research argument

Begin with the problem, precise question and why the chosen comparison answers it. Describe data, assumptions, methods and selection before presenting results. Show the baseline and controlled intervention with matching metric definitions. Interpret what changed and what alternative explanations remain. End with a conclusion bounded by the tested setting and one justified next experiment.

Avoid narrating every command chronologically. A reader needs the final protocol and evidence, plus deviations that affect interpretation. Preserve the full run history in artifacts. If the scope changed, update the title and abstract so they describe the work actually completed rather than an abandoned ambition.

## 2. Every quantitative claim needs a traceable source

For each reported value, identify its run/configuration, raw file, metric formula, numerator/denominator or aggregation rule. A figure caption should state the population, number of seeds, error-bar definition and relevant budget. “Mean ± error” is incomplete. Say standard deviation across training seeds, a particular bootstrap interval or another defined quantity.

Do not quote tutorial numbers as your own measurements. Cite ideas and algorithms, then distinguish your implementation and results. Paraphrase source claims accurately and link the primary source. A citation does not make an unsupported extrapolation valid.

## 3. Worked conclusion revision

Weak conclusion: “FedProx solves non-IID learning.” Stronger conclusion: “In the specified five-client synthetic logistic experiment, the tested proximal setting reduced the recorded local-update norm, while final accuracy remained similar to FedAvg under the fixed round budget. The experiment does not establish benefits for neural models, unseen clients or networked deployment.” The stronger statement says what was measured, separates mechanism from utility and names the untested scope.

For efficiency, “the file shrank” should not become “the model uses less RAM and energy.” For trustworthiness, “the tested attack failed” should not become “the model is secure.” These are changes in claim, not stylistic improvements.

## 4. A report structure that fits this program

Use a 4–6 page main report for the capstone, with appendices for detailed configurations. Suggested sections are abstract/question, related primary work and fidelity, protocol/method, results, analysis/limitations and reproduction instructions. Include one main comparison table and figures that answer the question. Extra charts that repeat the same number do not add evidence.

The abstract should name the setting and principal observation without overstating novelty. The methods should be sufficient to reconstruct the comparison. The limitations should identify concrete boundaries, not merely “more data would help.” The artifact README should contain exact commands and expected output file names.

## 5. Reproduction rehearsal

Start from a fresh output directory and follow your own README. Verify dependencies, data provenance, split hashes and configuration. Regenerate one main table/figure from raw metrics, then rerun a small experiment or the full core experiment as feasible. Record any nondeterministic differences and whether they alter the conclusion. Do not demand exact timing equality across machines.

Use `lab07_project.py` to inventory artifact sizes and hashes. Inspect the report's limitations: structural completeness does not prove correctness. A peer should also challenge the metric formula, baseline fairness and whether the experiment actually tests the question.

## 6. Prepare a short oral defense

In 5–8 slides, explain the question, primary source, protocol, main result, one failure/limitation and next step. Be ready to derive one equation or recompute one table entry. If you do not know an answer, identify the missing evidence and propose a test. Inventing certainty is worse than a precise unresolved question.

Reviewer feedback may request a correction to code, a clearer denominator, a missing baseline or a narrower claim. Keep a revision log mapping each requested change to the edited artifact and new evidence. The portal permits revised submission only when Revision is requested and the deadline is open; reading completion alone does not determine the final result.

## Final self-check

1. Can every headline claim be traced to a primary reference, derivation or your saved result?
2. Are exploratory changes and final held-out evaluation clearly distinguished?
3. Can another student recover your main metric from raw counts/predictions?
4. Are missing guarantees, untested deployment conditions and resource limits stated?
5. Does the shared folder contain the exact final code/configuration, not an earlier draft?
6. Can you explain a negative result without changing or hiding it?

If a check fails, repair the evidence or narrow the claim before submission. The aim is a small result that another researcher can trust and build upon.

## Primary reading

- [NeurIPS paper checklist](https://nips.cc/public/guides/PaperChecklist): use claim, uncertainty and reproducibility questions for the final review.
- [Model Cards](https://arxiv.org/abs/1810.03993): make intended use and evaluation limits explicit when delivering a model artifact.
