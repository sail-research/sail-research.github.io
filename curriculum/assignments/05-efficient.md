# Assignment: a measured efficiency tradeoff

## Objective and scope

Test whether a specified compression or small-model strategy improves a declared resource while preserving a stated quality requirement. Estimated effort: 5–8 hours after the module. The purpose is accurate measurement and interpretation, including cases with no speedup.

## Required experiment

Run the reference efficiency lab, then choose one technique for a controlled extension. Use at least three settings, such as pruning fractions, SVD ranks, quantization granularities or student widths. Select settings on validation and keep final test outcomes separate. Preserve the baseline and report construction/training budgets.

For pruning, distinguish dense zeroing from a sparse or structurally smaller representation. For quantization, distinguish packed storage, simulated/dequantized evaluation and actual integer kernels. For SVD, check factor shapes, bias placement and full-rank reconstruction. For distillation, freeze the teacher and include the same small student trained with hard labels under a comparable update/selection policy.

## Measurement contract

Specify device, threads, dtype, input/batch shape, warm-up, repetitions and timed region. Report raw parameter bytes, actual artifact bytes, accuracy/macro F1 and median/p95 latency. Preserve raw timing samples. Do not label parameter bytes as peak RAM or operation counts as measured energy. If you add those quantities, use appropriate instrumentation and define its scope.

Create a Pareto plot for quality versus the primary resource and explain which measured points are dominated. A frontier over tested points does not prove global optimality. Discuss variability when latency differences are small and show which classes/examples change predictions after the intervention.

## Deliverables

Provide a 3–5 page report, runnable code/environment, configs, split IDs, mechanism checks, selected artifacts, full metric/timing tables, plots and a reproduction command. Include a table distinguishing analytical, measured and unmeasured quantities. Explain at least one reason theoretical savings might not become runtime savings on the tested hardware.

## Rubric

| Criterion | Points | Full-credit evidence |
|---|---:|---|
| Question and resource definition | 15 | Clear workload, target and quality constraint |
| Correct mechanism and controls | 25 | Valid representation and appropriate training comparator |
| Measurement quality | 25 | Consistent timing, units, raw samples and honest scope |
| Tradeoff/error analysis | 20 | Pareto reasoning, prediction changes and uncertainty |
| Reproducibility and clarity | 15 | Artifacts, environment, command and bounded conclusion |

Essential gates: no fabricated measurements, no false integer-inference/peak-memory/energy labels, no test-driven selection presented as held out and a reproducible comparable workload. Pass recommends at least 70 with gates. Excellent recommends at least 90 plus a sound extension and a practical recommendation grounded in the evidence.

## Reviewer guidance

Inspect the executed representation and raw timings. Ask why a smaller model might be slower and whether the measured difference exceeds noise. Recompute a parameter count and one Pareto comparison. A truthful null or negative result can receive full credit. Use Revision for repairable measurement/documentation gaps before the deadline; do not reward an unsupported speedup narrative.
