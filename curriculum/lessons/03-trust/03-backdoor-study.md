# A controlled backdoor study on a local teaching model

**Core time:** 2–3 hours. **Prerequisites:** training/evaluation separation and threat models. **Outcomes:** distinguish backdoors from ordinary test-time perturbations; construct a bounded training-only poisoning experiment; report clean and triggered metrics with correct eligibility; test a meaningful negative control.

## 1. Define the phenomenon without hiding the assumptions

A backdoored model can retain useful behavior on ordinary inputs while responding to a particular trigger in an attacker-chosen way. In a simple teaching threat model, the attacker can modify a small fraction of training examples and their labels. During evaluation, a visible trigger is applied to held-out inputs and the model is checked for prediction of a fixed target class. This is not the same as finding a small gradient perturbation after training.

Our lab operates only on a locally trained digit classifier and bundled data. The trigger is an obvious 2-by-2 bright patch in the bottom-right corner; the target class is zero; the poisoning fraction is explicitly recorded. It is a demonstration of a mechanism, not a reproduction of the original BadNets experimental numbers and not a test of any third-party system.

## 2. Preserve a clean baseline

Train a clean model and a poisoned model with matched architecture, initialization seed, split and training policy. Modify only the poisoned model's training copy. Never mutate the shared source array in place. Validation and test targets stay unchanged. Record which training indices were selected, the eligible selection pool, the number changed and whether the poisoning percentage is defined relative to all training examples or only non-target examples.

The teaching lab chooses approximately 10% of the total training count from eligible non-target training examples, applies the patch and assigns target zero. The exact integer count is saved. This explicit convention prevents a denominator mismatch when comparing with another paper or implementation.

```python
import numpy as np
def add_trigger(flat_images):
    out = np.array(flat_images,copy=True).reshape(-1,8,8)
    out[:,-2:,-2:] = 1.0
    return out.reshape(-1,64)
original = np.zeros((3,64),dtype=np.float32)
triggered = add_trigger(original)
assert np.count_nonzero(original) == 0
assert np.count_nonzero(triggered) == 3*4
assert triggered.min() >= 0 and triggered.max() <= 1
```

The patch may obscure meaningful pixels in a tiny image. That is a limitation to examine, not an assumption to ignore. Show representative clean/triggered pairs and avoid claiming that the trigger is imperceptible.

## 3. Worked example: eligibility changes the claimed success

Suppose there are 100 held-out examples and 10 already belong to target class zero. Among the 90 non-target examples after triggering, 72 are predicted as zero. The non-target attack success rate is `72/90=80%`. Including original target examples can inflate the statistic because predicting their original class is not an attacker-induced change to the target.

Also report clean accuracy of the poisoned model. A model that predicts zero for every input can achieve high target success while destroying normal utility. Triggered accuracy against the original labels measures a different quantity. If success is additionally conditioned on the model being clean-correct, state that denominator separately and do not compare it directly with an unconditioned ASR.

## 4. Negative controls separate the trigger from ordinary corruption

Apply the same trigger to the clean model. If its target rate also rises strongly, part of the effect may come from the trigger naturally resembling a class or obscuring evidence. Compare clean-model triggered behavior with poisoned-model triggered behavior. A zero-poisoning setting is another control. A patch at a different location can probe specificity, but changing location also changes the affected image information; interpret carefully.

Run several poisoning fractions chosen before evaluating test. Use validation data for method development and reserve test for frozen settings. With a small dataset, variation across poisoning selections and training seeds can be substantial. Preserve the selected indices and report per-run values instead of asserting that one convenient run defines the phenomenon.

## 5. What a defense claim would require

A proposed defense should be evaluated for clean utility, triggered success, knowledge assumptions and resource costs. If it uses a known trigger to filter examples, describe that knowledge; it is not a general unknown-trigger detector. If it removes suspicious data, report how many clean examples are removed and whether the comparison model receives an equivalent retraining budget. Avoid claiming a general cure from one trigger, one target and one dataset.

## Exercises and self-check

1. A report includes target-class examples in ASR. Recompute with 120 triggered examples, 20 target originals and 60 successful target predictions among non-target originals. **Check:** non-target ASR is 60%, not a denominator based on all 120.
2. Why must the clean and poisoned datasets be separate copies? **Check:** an in-place edit can poison the baseline or evaluation data and invalidate controls.
3. Design a table showing poison count, clean accuracy, clean-model trigger target rate, poisoned-model ASR and eligible count.
4. Explain why a low ASR for one trigger does not prove the model is backdoor-free. **Check:** the tested trigger family and attack process do not cover every possible mechanism.

## Primary reading

- [Gu, Dolan-Gavitt and Garg: BadNets](https://arxiv.org/abs/1708.06733): identify the supply-chain threat and compare its assumptions with this deliberately small local study.
- [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10): connect the experiment to risk documentation and limitations rather than treating one score as a safety certificate.
