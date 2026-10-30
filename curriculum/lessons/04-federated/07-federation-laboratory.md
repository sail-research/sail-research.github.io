# Federated-learning laboratory: a controlled heterogeneity benchmark

**Core time:** 3–4 hours. **Prerequisites:** FL 1–6. **Outcomes:** run a transparent simulator; verify aggregation/partitions; compare IID and non-IID conditions under stated budgets; report client-level outcomes and system limitations.

## 1. Freeze the question and the comparison matrix

The core question is: “How does label-skewed client allocation affect a fixed federated optimization procedure on a small synthetic task?” The baseline matrix includes a pooled logistic reference, IID FedAvg, skewed FedAvg and skewed FedProx. These are fixed teaching configurations, not a claim that one algorithm is best. An assessed extension can vary local steps or proximal strength, but should not simultaneously change the dataset, learning rate and evaluation population.

The synthetic generator, split seed, client allocation and model initialization are recorded. A model includes four input coefficients and a bias. Clients take full local gradient steps; call them steps rather than epochs or minibatches. The simulator runs sequentially on one machine and calculates a declared dense float32 payload estimate.

## 2. Read the checks before the score

Run `python lab05_federated.py --output outputs/federated`. Confirm disjoint global splits, nonempty client training sets, no duplicated training indices, complete training coverage, normalized aggregation weights and the one-step equivalence to a pooled gradient. Confirm mu=0 agrees with the nonproximal update. These checks address plausible algorithm errors more directly than a high final accuracy.

Inspect partition counts and positive-class fractions. The realized skew matters more than its label. If a client is empty, the experiment must reject or explicitly handle it before training; dividing by zero or silently excluding it changes the intended population.

## 3. Compare quality against a budget

Plot validation quality versus round and cumulative payload bytes, and record local work. Test metrics are computed after the fixed round budget or a predeclared validation selection rule; do not pick the best test round. If comparing time-to-target, choose the target on development criteria and report methods that fail to reach it.

The pooled reference answers what the same model can do with centralized access to the training pool. It is a useful reference, not necessarily a feasible deployment option. A local-only reference answers a different question and is valuable for a personalization extension. Explain the legal data access and budget for every baseline.

## 4. Worked interpretation of heterogeneous outcomes

Suppose a skewed federation has good pooled accuracy but poor performance on one small client. The pooled result may be dominated by larger clients. Inspect that client's test support, label mix and uncertainty before diagnosing a systematic failure. A small sample can create an extreme estimate; a real disparity can also be hidden by averaging. Report both the counts and the pattern rather than choosing the narrative that favors the algorithm.

If FedProx reduces local delta norms but does not improve test quality, the result may still support the intended anchoring effect while showing that the chosen strength or setting did not improve the prediction objective. Separate mechanism diagnostics from the final utility claim.

## 5. Reproduction package

Include generator parameters, exact indices, client counts, full configuration, validation histories, final predictions, payload formula, unit tests and the environment. Store the actual outputs, not only plots. A peer should be able to recover a reported aggregate by recomputing it from the client-level counts. Save seed-level results before computing a summary.

An extension should repeat the comparison across at least three partition seeds or clearly justify a smaller scope. Keep training randomness separate when attributing differences to allocation. Because the core logistic simulator uses deterministic full-gradient steps, most variation comes from data generation and partitioning; do not invent stochastic optimizer variability that is absent from the implementation.

## Exercises and self-check

1. Recompute every aggregate from per-client numerator/denominator counts and compare with the saved global metric.
2. Match two methods by payload bytes and explain why their local computation may still differ.
3. Extend the protocol to partial participation with a declared sampling rule. Identify the change in the weighting interpretation.
4. Write a limitation statement separating synthetic data, sequential execution, analytical communication and missing privacy/security mechanisms.

## Submission readiness

Submit a 3–5 page report and reproducible package with at least one controlled extension. Show all compared configurations and explain the role of each baseline. A correct conclusion that a method does not improve the chosen setting is acceptable. Claims about real network performance, secure aggregation or DP require evidence beyond this simulator and should not appear as measured results here.

## Primary reading

- [McMahan et al.: FedAvg](https://proceedings.mlr.press/v54/mcmahan17a.html): locate the exact protocol differences from this laboratory.
- [Li et al.: FedProx](https://proceedings.mlsys.org/paper_files/paper/2020/hash/1f5fe83998a09396ebe6477d9475ba0c-Abstract.html): relate proximal reasoning to the measured local-drift diagnostics.
