# From a broad interest to a testable research question

**Core time:** 2 hours. **Prerequisites:** foundations and at least one pillar. **Outcomes:** delimit a research question; build a primary-source evidence map; separate reproduction, replication and extension; write a short protocol before inspecting final outcomes.

## 1. Reduce scope until the question has a measurable answer

“Make AI trustworthy” is a motivation, not a mini-project question. “Under a fixed local digit experiment, how does one training-poisoning fraction affect clean accuracy and non-target trigger ASR?” identifies an intervention, outcomes and setting. A small question can produce a rigorous answer within the onboarding period. A broad question with many moving parts often produces a collection of numbers that cannot support a conclusion.

Write the population, model, intervention, comparator, outcomes and budget. Identify which assumption, if false, would change your interpretation. A useful project can test a known mechanism in a new small setting; novelty claims require a literature review and should not be asserted merely because you have not seen the idea before.

## 2. Read papers as arguments

For each primary paper, record the problem, claimed contribution, formal assumptions, algorithm, evaluation data, baselines, metrics, computational scope and limitations. Separate what the authors measured from the explanation they propose and from your own hypothesis. Abstracts help orient you but usually omit details needed to reproduce an experiment.

Prefer the publisher/proceedings page, original paper and authors' implementation when available. Check title, author list, year, version and venue. An arXiv posting is not automatically a peer-reviewed publication; a later conference version may differ. Cite the version you actually used. Do not cite a secondary summary as though it were the original source of an algorithm.

| Evidence-map column | What to write |
|---|---|
| Source/version | Direct primary URL and bibliographic details |
| Claim | A narrow paraphrase in your own words |
| Assumptions | Data, threat, optimization or system conditions |
| Evidence | Experiments/theory actually supplied |
| Gap or uncertainty | What the source does not establish |
| Your use | Background, baseline, reproduced mechanism or extension |

## 3. Worked narrowing process

Start with “Federated learning is bad on non-IID data.” This is too universal. Narrow to a fixed model and partition family. Choose a global test population, local-step budget and aggregation rule. A final question might be: “For a four-feature synthetic binary problem with five clients, does increasing local full-gradient steps from 1 to 5 change the IID-versus-label-skew validation trajectory at matched communication rounds?” The question still has a budget tradeoff—local computation differs—which must be reported.

A hypothesis could predict larger client deltas under skew. The primary prediction metric might remain unchanged. That result can support a mechanism diagnostic without demonstrating a utility degradation. Define both quantities so you do not change the intended claim after seeing the curves.

## 4. Label the type of project accurately

This program uses “reproduction” for rerunning or independently implementing a specified published procedure, with exact meaning explained in the report because communities use the terms differently. A teaching demonstration illustrates an idea on a simplified setup. An extension changes a defined element beyond the reproduced baseline. Do not call a logistic CPU simulator a reproduction of a large neural-network system's numerical results.

Your report should contain a fidelity table: original setting, your setting, reason for each difference and expected implication. This turns resource constraints into transparent scope rather than hidden deviations.

## 5. Predeclare a protocol

Before final evaluation, save a dated protocol containing the question, hypotheses, primary/secondary metrics, split, tuning budget, seed schedule, stop rule and analysis plan. Commit it in version control or preserve another timestamped record. If you later change it, record the amendment and why. Exploratory work is legitimate; pretending it was predeclared is not.

```python
protocol = {
 'question':'Effect of local steps under a fixed label-skew partition',
 'factor':{'local_steps':[1,5]},
 'primary_metric':'held-out accuracy at fixed final round',
 'secondary_metrics':['client macro accuracy','calculated payload bytes'],
 'selection_data':'validation only',
 'seeds':[7,17,27],
 'stop_rule':'30 rounds for every configuration'
}
assert protocol['selection_data'] == 'validation only'
```

This schema check does not prove you followed the protocol. The run history and artifacts provide that evidence.

## Exercises and self-check

1. Rewrite a broad interest into a question with one main experimental factor.
2. Build an evidence map for three primary sources, including one result that limits or complicates your hypothesis.
3. Explain which part of your plan is a teaching simplification, reproduction or extension.
4. List two results that would contradict your initial expectation and how you would report them.

## Primary reading

- [NeurIPS paper checklist](https://nips.cc/public/guides/PaperChecklist): use the questions on claims, assumptions, reproducibility and limitations to refine the protocol.
- [FedAvg](https://proceedings.mlr.press/v54/mcmahan17a.html), [BadNets](https://arxiv.org/abs/1708.06733), or [Deep Compression](https://arxiv.org/abs/1510.00149): choose the source corresponding to your assigned pillar and inspect its actual experimental scope.
