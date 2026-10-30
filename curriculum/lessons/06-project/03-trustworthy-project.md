# Capstone brief: Backdoor Robustness Reproduction

**Estimated project effort:** 12–20 hours after the Trustworthy AI module. **Prerequisites:** the clean/poisoned local experiment, metric eligibility and a written protocol. Complete this capstone only if assigned by your administrator; the other capstone briefs are alternatives.

## 1. Research question and scope

Investigate how one controlled change in a local backdoor experiment affects clean utility and triggered target behavior. A recommended core question is: “For a fixed small classifier and visible trigger, how does training poisoning fraction affect clean accuracy and non-target ASR?” Use public bundled or synthetic data and your own locally trained models. Do not test third-party services or private datasets.

Read the original BadNets paper and produce a fidelity table. The project's small digit setup is a mechanism reproduction/teaching adaptation, not a numerical reproduction of the paper's complete experiments. State differences in architecture, dataset, trigger, training budget and selection. A precise account of those differences is required even if the qualitative phenomenon matches.

## 2. Required experimental design

Use a clean training/validation/test split with saved indices. Select a fixed target and visible trigger. Predeclare a small poisoning grid, for example 0%,5%,10% of all training examples, drawn from non-target training examples. Record exact integer counts and the eligibility pool. Keep the clean baseline and use the same trigger on it as a control.

Repeat across at least three training/poison-selection seeds when feasible, keeping the split fixed for the core comparison. If varying splits, analyze that separately. Use the same architecture and training/selection policy for clean and poisoned models. Tune only on validation. Test settings must be frozen before the final table is produced.

The default lab is a starting point, not the completed project. Add at least one controlled extension: another poison fraction, a trigger-location control, a targeted defense with explicit knowledge assumptions or a classwise failure analysis. Change one principal factor at a time.

## 3. Required measurements

Report clean-model clean accuracy, clean-model triggered target rate, poisoned-model clean accuracy, non-target ASR, eligible count and poison count. If using a clean-correct conditional ASR, show it as an additional differently labeled metric. Include training/validation curves and representative clean/triggered examples selected by a documented rule.

For a defense extension, include the undefended baseline, clean utility, attack procedure, defender knowledge and additional computation. If the defense knows the trigger, do not describe it as detecting arbitrary unknown triggers. No result in this project establishes universal absence of backdoors or certified robustness.

## 4. Worked analysis plan

For each seed and fraction, save counts before computing percentages. Compute paired seed-level differences in clean accuracy and ASR relative to the appropriate baseline. Show individual seeds and a descriptive aggregate. With only three seeds, avoid overconfident distributional claims. Explain whether uncertainty reflects training variation, poisoning selection or finite test sampling.

```python
def non_target_asr(predictions,original_labels,target):
    import numpy as np
    predictions=np.asarray(predictions);original_labels=np.asarray(original_labels)
    eligible=original_labels!=target
    count=int(eligible.sum())
    if count==0: return {'successes':0,'eligible':0,'rate':None}
    successes=int((predictions[eligible]==target).sum())
    return {'successes':successes,'eligible':count,'rate':successes/count}
assert non_target_asr([0,0,1],[0,1,2],0)['rate'] == .5
```

## 5. Deliverables and milestones

Milestone 1: a one-page proposal, three-source evidence map and fidelity table. Milestone 2: clean baseline plus invariant checks and a small smoke run. Milestone 3: the frozen experiment matrix, all raw outputs and a complete metric table. Milestone 4: a 4–6 page report, a model card/risk register and 5–8 slides for a short defense.

The shared folder must contain code, pinned environment, README commands, split/poison indices, configuration, metrics, figures and report. No student should need to infer which notebook cell generated the final number. The final report must distinguish observed evidence, interpretation and untested claims.

## 6. Rubric and essential gates

| Criterion | Points | Evidence |
|---|---:|---|
| Question, primary reading and fidelity | 15 | Precise claim and differences from the source |
| Threat model and protocol | 20 | Timing, access, budget, target, split and selection |
| Correct implementation and controls | 25 | Training-only poisoning, clean control, bounded operations |
| Evaluation and analysis | 20 | Correct ASR eligibility, utility, seeds and limitations |
| Reproducible artifacts and communication | 20 | Fresh-run command, raw evidence, report and defense |

Essential gates: no evaluation-data poisoning, no fabricated outputs, no test-driven selection presented as held out, correct target eligibility and reproducible code. Pass recommends at least 70 points with gates met. Excellent recommends at least 90, a valid controlled extension and clear explanation of alternative interpretations. Revision is appropriate for repairable shortcomings before the deadline; the reviewer records the actual portal outcome.

## Oral-defense questions

Why does your ASR exclude original target labels? What happens on the clean model with the trigger? Which difference from BadNets most limits your claim? What result would refute your preferred explanation? Reproduce one table entry from raw counts without rerunning the full training.

## Primary reading

- [BadNets](https://arxiv.org/abs/1708.06733): original threat and mechanism.
- [Obfuscated Gradients](https://arxiv.org/abs/1802.00420): limitations of attack-based defense evidence.
- [Model Cards](https://arxiv.org/abs/1810.03993): structure the final scope and limitations statement.
