# Capstone brief: Federated Learning Under Non-IID Data

**Estimated project effort:** 12–20 hours after the FL module. **Prerequisites:** a checked FedAvg simulator, partition auditing and budget accounting. Complete this capstone if assigned; the trustworthy and efficiency briefs are alternatives.

## 1. Research question and scope

Study one interaction between client heterogeneity and local optimization. A suitable question is: “Under a fixed five-client synthetic task, how does local-step count change FedAvg's behavior for IID versus label-skewed partitions?” A FedProx extension can ask whether a predeclared proximal penalty changes drift and utility in that same setting.

Use the provided logistic CPU simulator as an inspectable baseline. If replacing it with a neural model or another framework, document the algorithm/state changes and preserve the exact aggregation checks. A sequential simulation does not measure real cross-device networking, secure aggregation or energy. Do not label its runtime as deployment latency.

## 2. Required experimental matrix

Include pooled training as a reference, IID FedAvg and non-IID FedAvg. Vary one main factor, such as local full-gradient steps 1 versus 5. If adding FedProx, include mu=0 equivalence and select nonzero values using validation. Declare whether comparison budgets match rounds, cumulative payload or local computation; report the other quantities.

Use at least three data/partition seeds or justify a narrower scope with your reviewer. Preserve train/validation/test splits and client index lists. Show client sample counts and label proportions. Keep validation/test outside local optimization. Define whether the claim concerns existing clients, unseen clients or a pooled population; the required split follows that choice.

## 3. Correctness gates before training

Verify normalized sample-count weighting with an exact toy case. Verify one full local step under full participation matches the pooled gradient update under the stated assumptions. Check that each client starts from a copy of the same round model. Check nonempty client sets, disjointness and coverage. Confirm mu=0 matches the nonproximal implementation with all other settings identical.

```python
import numpy as np
models=np.array([[1.,2.],[3.,0.],[5.,4.]])
counts=np.array([2,1,1])
server=np.average(models,axis=0,weights=counts)
np.testing.assert_allclose(server,[2.5,2.])
assert counts.sum()==4
print(server)
```

A high final score cannot substitute for these checks: an accidentally centralized or sequentially shared model can also classify well.

## 4. Required evidence and analysis

Plot validation quality versus rounds and calculated payload bytes. Report final frozen test accuracy/log loss, example-weighted and equal-client accuracy, worst-client score with support and local delta diagnostics. State exact payload accounting, including dtype, parameter count, participation and excluded overhead. If all tested methods perform similarly, analyze why the simple task or budget may not expose a difference.

Preserve per-seed results. A larger local delta does not by itself prove worse generalization, and a smaller delta does not prove a better algorithm. Discuss mechanism and utility separately. If a method fails to reach a predeclared target, report the failure rather than removing it from the comparison.

## 5. Deliverables and milestones

Milestone 1: proposal, source evidence map, objective/weighting definition and original-versus-local fidelity table. Milestone 2: partition visualization and invariant checks. Milestone 3: complete fixed-budget experiment grid with raw histories. Milestone 4: 4–6 page report, reproduction package and 5–8 presentation slides.

The package must include generator parameters, indices, client allocations, configuration, code/environment, all run metrics, plots and commands. A peer should be able to recompute the pooled accuracy from client correct/count records and reconstruct the payload estimate without guessing units.

## 6. Rubric and essential gates

| Criterion | Points | Evidence |
|---|---:|---|
| Question, objective and source fidelity | 15 | Clear population and weighting policy |
| Partition and protocol design | 20 | Saved disjoint splits, realized skew and budgets |
| Algorithm correctness | 25 | Weighted aggregation, common initialization, equivalence checks |
| Evaluation and interpretation | 20 | Client/global metrics, seed results, budget-aware conclusions |
| Artifacts and communication | 20 | Reproduction command, raw histories, report and defense |

Essential gates: no client/test leakage, correct aggregation, no shared-state client bug, truthful simulation/payload labels and recoverable evidence. Recommended Pass is at least 70 with gates met. Excellent is at least 90 plus a valid extension and thoughtful explanation of scope. A correct null result can meet Excellent; a fabricated improvement cannot.

## Oral-defense questions

Which objective does your aggregation optimize? Why is one-step pooled equivalence useful? What changes when local steps increase? Is your communication number measured or calculated? How would the split change for unseen-client generalization?

## Primary reading

- [McMahan et al.: FedAvg](https://proceedings.mlr.press/v54/mcmahan17a.html): original algorithm and evaluation scope.
- [Li et al.: FedProx](https://proceedings.mlsys.org/paper_files/paper/2020/hash/1f5fe83998a09396ebe6477d9475ba0c-Abstract.html): proximal method and heterogeneity assumptions.
- [Bonawitz et al.: secure aggregation](https://research.google/pubs/practical-secure-aggregation-for-privacy-preserving-machine-learning/): distinguish absent deployment mechanisms from the simulator's claims.
