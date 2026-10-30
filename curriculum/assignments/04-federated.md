# Assignment: an auditable federated-learning benchmark

## Objective and scope

Implement or inspect a complete federated round and compare IID/non-IID data under a stated budget. Use the provided synthetic CPU simulator or a carefully documented equivalent. Estimated effort: 5–8 hours after the module. Label the work as a simulation, with analytical communication accounting.

## Required tasks

Define the global objective and example/client weighting. Save data generation, global splits and client allocations. Show sample counts and label proportions. Verify client nonemptiness, disjointness and coverage. Demonstrate exact weighted aggregation on a small hand example and one-step equivalence to a pooled gradient under the required assumptions.

Compare pooled training, IID FedAvg and label-skewed FedAvg. Add one controlled factor such as local steps, participation or proximal strength. For FedProx, verify mu=0 equivalence and fixed round reference. Keep test data outside local fitting and selection. Use at least three data/partition seeds when feasible, naming what changes with the seed.

Report quality versus rounds and cumulative payload, local work and client delta diagnostics. State float precision, model size, uplink/downlink convention and excluded network overhead. If adding partial participation, explain its sampling/weighting implications. The simulator does not automatically implement privacy, authentication or secure aggregation.

## Required analysis and artifacts

Give pooled accuracy/log loss, equal-client average, worst-client score and supports. Recompute the pooled metric from client counts as a consistency check. Explain a case where mechanism diagnostics and final utility disagree. If differences are negligible, report that conclusion with the task/budget limitations.

Submit a 3–5 page report, code/environment, generator/configuration, exact indices, complete histories, predictions, plots and a reproduction command. Include a fidelity table comparing the local implementation with FedAvg/FedProx source definitions. Preserve the fixed configurations and all seeds, not only the strongest run.

## Rubric

| Criterion | Points | Full-credit evidence |
|---|---:|---|
| Objective and partition design | 20 | Weighting, saved splits and realized heterogeneity |
| Algorithm correctness | 25 | Independent client state, weighted aggregation and invariants |
| Controlled comparison | 20 | Valid baselines, one main factor, declared budgets |
| Evaluation and systems reasoning | 20 | Client/global metrics, payload units, simulation limits |
| Reproducibility and communication | 15 | Raw records, checks, report and working command |

Essential gates: no train/test leakage, correct weights, no shared mutable client state, truthful communication/simulation labels and authentic outputs. Pass recommends at least 70 with gates. Excellent recommends at least 90 plus an informative extension and discussion of alternative explanations.

## Reviewer guidance

Trace one round and one aggregate metric independently. Ask whether “local epochs” really means epochs in the submitted code. Check that a byte-saving claim includes both communication directions and relevant metadata. Do not require a particular algorithm to win. Request a specific Revision if the experiment is repairable before deadline; a high score cannot compensate for an invalid aggregation or split.
