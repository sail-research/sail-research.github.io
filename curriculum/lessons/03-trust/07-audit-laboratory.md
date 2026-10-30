# Trustworthy-AI laboratory: a bounded audit with reproducible evidence

**Core time:** 3–4 hours. **Prerequisites:** Trustworthy AI 1–6. **Outcomes:** produce an auditable threat model, implement controls, report correctly conditioned metrics and write a model card with justified limitations.

## 1. Choose one primary investigation

The required laboratory contains a clean classifier, bounded adversarial evaluation and a controlled backdoor demonstration. For the assessed extension choose one primary investigation: perturbation-budget sensitivity, poisoning-fraction sensitivity or a clearly specified defense comparison. Privacy and group-metric demonstrations are conceptual checks, not claims that the digit model is formally private or socially fair.

Write the question before modifying code. For example: “At fixed model/data/training settings, how does a visible training trigger affect target predictions on non-target held-out digits?” Define the target, trigger, poisoning denominator, selection rule, eligible evaluation population and clean utility metric. A question this precise can produce an interpretable negative result.

## 2. Run and inspect the baseline artifacts

Run `python lab04_trust.py --output outputs/trust`. The output must distinguish clean-model metrics, attack constraints, conditioned success, poisoned-model clean utility and triggered target rate. Inspect the stored indices and counts. Verify that no training edit affected the validation or test arrays. Check epsilon-zero identity and legal input bounds before interpreting robustness numbers.

An output file saying “passed” is only as useful as its checks. Read which invariants are tested: projection around the original input, no trigger mutation of the original data, non-target ASR eligibility and finite gradients. State what remains untested, such as adaptive attacks against a new defense or broader trigger families.

## 3. A minimum evidence matrix

| Comparison | Fixed elements | Changed element | Required outcomes |
|---|---|---|---|
| Clean versus attacked input | Model, examples, labels | Permitted perturbation | Clean accuracy, attacked/suite survival, eligible count, actual norm |
| Clean versus poisoned training | Architecture, split, training policy | Training-only poison operation | Clean utility, target ASR, clean-model trigger control |
| Defense versus baseline | Threat model, evaluation population | Documented defense | Utility, resistance, knowledge assumptions and cost |

For each row, list the seeds and the precise budget. An apparent improvement caused by reducing attack steps or evaluating an easier subset is not evidence for the defense. A worse result under a stronger test may improve the audit by exposing a previously hidden weakness.

## 4. Worked interpretation of a null result

Suppose the poisoned model's triggered target rate is close to the clean model's rate. Do not conclude that backdoors are impossible. Check whether the trigger was actually inserted, whether selected labels were changed, whether the model fitted the training data and whether the eligible denominator is correct. If the implementation is valid, report that this particular poisoning rate, trigger, model and training budget did not produce a clear additional effect. That bounded result is scientifically useful.

If a stronger trigger or higher poison fraction is explored after seeing the result, label it as exploratory and use validation to develop the next protocol. Do not silently replace the original experiment with a favorable run while retaining a preregistration claim.

## 5. Model card and risk register

Your model card should state the training data and original attribution, intended educational use, excluded uses, preprocessing, architecture, selection, metrics, subgroup/shift scope, attack assumptions and unresolved limitations. The risk register should connect each observed issue to an action or a reason more evidence is needed. Avoid generic statements such as “all ethical risks considered.” Name the risks that were examined and those that were outside scope.

Provide representative failure examples with original labels and predictions. Visual illustrations support interpretation but do not replace aggregate counts. Do not choose only dramatic or successful examples; describe the sampling rule used to select them.

## Exercises and self-check

1. Write a one-page threat model and have a peer implement the evaluation without asking you which denominator to use. Revise any ambiguous field.
2. Intentionally include target originals in an ASR calculation, then show how the corrected eligibility changes the value. Explain why both numbers cannot share the same label.
3. Draft a defense claim that your experiment supports and a broader claim it does not support.
4. Explain why the privacy noise demonstration and fairness count example cannot be presented as deployment guarantees for the trained model.

## Submission readiness

Submit a 3–5 page report, runnable code, environment, split/poison indices, complete metric tables, representative examples, model card and risk register. The reviewer should be able to recover every reported denominator from saved counts. A high attack success rate is not the grading objective; correct threat-model reasoning and reproducible evidence are. Follow the module assignment's rubric and submit only your own local experiments.

## Primary reading

- [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10): organize risks and actions.
- [BadNets](https://arxiv.org/abs/1708.06733): compare training-time assumptions.
- [Obfuscated Gradients](https://arxiv.org/abs/1802.00420): audit the limits of attack-based evidence.
