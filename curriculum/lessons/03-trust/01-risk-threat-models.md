# Trustworthy AI begins with a risk model

**Core time:** 100 minutes. **Prerequisites:** ML evaluation and probability. **Outcomes:** distinguish reliability, robustness, privacy and fairness questions; specify a threat model; separate distribution shift from intentional manipulation; design a bounded audit.

## 1. A trustworthy system requires more than a good average score

A model can have strong held-out accuracy and still fail when inputs shift, expose sensitive information, perform unevenly across groups or be used outside its intended purpose. These are different problems with different evidence requirements. A robustness test does not establish privacy. A fairness metric does not establish causal fairness. Encryption during transport does not establish that model outputs reveal nothing about training examples.

The NIST AI RMF 1.0 provides a risk-management structure around Govern, Map, Measure and Manage. We use it as a framework for asking who is responsible, what context the system operates in, how risks are measured and what actions follow. This course is not a compliance certification, and completing a toy benchmark does not satisfy every organizational or domain-specific requirement.

## 2. Write the threat model before selecting a method

A threat model identifies the asset, adversary goal, knowledge, access, capabilities and constraints. For a teaching classifier, the asset might be reliable prediction, the goal untargeted misclassification, knowledge full model parameters, access inference inputs and constraint an L-infinity perturbation no larger than 0.1 in a `[0,1]` input domain. State whether the adversary acts during training or inference and whether success is targeted to a chosen label.

An alternative training-time threat allows modifying 10% of training examples with a visible trigger and changing their labels to zero. That is a different experiment from inference-time perturbation. Reporting only “attack success” without the allowed actions makes comparisons meaningless. The attacker budget, eligible population and defender knowledge must be explicit.

| Field | Example for a local teaching experiment |
|---|---|
| System and data | Own small classifier; bundled or synthetic data |
| Asset | Correct predictions on the stated input population |
| Goal | Untargeted error, or a separately defined target label |
| Access | Input gradients and model weights in white-box evaluation |
| Budget | Explicit norm/range or poisoning fraction |
| Defender | Frozen baseline or specified retrained variant |
| Success measure | Defined numerator, denominator and clean performance |
| Scope | Local educational model; no third-party service or private data |

## 3. Distribution shift is not one phenomenon

Covariate shift changes the input distribution under a particular assumption about the conditional label relationship. Label shift changes class prevalence under a different conditional invariance assumption. Concept shift changes the relationship between input and label. Real deployments may combine several changes. A corruption test such as added Gaussian noise is a controlled perturbation, not evidence that every real-world shift is covered.

Worked example: a digit model trained on centered images is evaluated on images shifted one pixel right. Accuracy drops. This observation supports a claim about that transformation and dataset. It does not prove malicious manipulation, nor does it imply that retraining on shifted examples solves all domain shift. Record the transformation, padding rule and whether labels are plausibly preserved; on an 8-by-8 image, a large transformation may erase the digit.

## 4. Construct a risk register with actions

A useful risk entry connects a failure mechanism to affected stakeholders, evidence and a decision. For example: “High-confidence mistakes under modest brightness change; measured on a held-out corruption set; investigate training augmentation and confidence calibration; do not extend the model to unseen acquisition conditions on this evidence alone.” The entry should name an owner and an action, not merely a severity adjective.

```python
risk = {
    'failure': 'prediction changes under a specified brightness shift',
    'population': 'held-out bundled digits',
    'metric': 'accuracy by predeclared shift magnitude',
    'control': 'identical unmodified held-out examples',
    'action': 'investigate preprocessing and document scope',
    'owner': 'student researcher and assigned reviewer'
}
required = {'failure','population','metric','control','action','owner'}
assert required <= risk.keys()
```

The dictionary checks documentation completeness, not safety. An entry can contain every field and still be scientifically wrong. Review whether the control, metric and decision actually relate to the stated risk.

## 5. Build an audit that can fail

Choose one primary risk question, define the expected failure condition and preserve a clean baseline. Evaluate a fixed stress grid and show all settings. If a method improves one metric but worsens another, report both. A model card should identify intended use, excluded use, data, evaluation, limitations and unresolved risks. Never infer absence of risk from an experiment that had no power to reveal it.

## Exercises and self-check

1. Write distinct threat models for test-time perturbation and training-time poisoning. **Check:** timing, permitted modifications, knowledge and goals differ.
2. A model has 99% clean accuracy. What additional information is needed for a robustness claim? **Check:** threat set, attack procedure, budget, denominators and scope.
3. Propose one non-adversarial shift test and explain how you would assess label preservation.
4. Convert “privacy risk is low” into an auditable statement. **Check:** specify the information, observer, access, mechanism and evidence; a vague adjective is insufficient.

## Primary reading

- [NIST: AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10): use the four functions to organize responsibility and evidence.
- [Mitchell et al.: Model Cards for Model Reporting](https://arxiv.org/abs/1810.03993): adapt the reporting questions to the small model you actually evaluated.
