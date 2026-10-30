# Efficiency laboratory: build and interpret a Pareto frontier

**Core time:** 3–4 hours. **Prerequisites:** Efficient ML 1–6. **Outcomes:** compare several representations under one workload; distinguish measured and analytical metrics; identify nondominated options; make a bounded deployment recommendation.

## 1. The laboratory compares mechanisms, not slogans

Run `python lab06_efficiency.py --output outputs/efficiency`. The experiment trains a reference MLP, applies one-shot magnitude pruning, evaluates an INT8 storage/dequantization approximation, replaces a layer with SVD factors and compares small hard-label/distilled students. Every method has a distinct scope: pruning remains dense, quantization is dequantized float execution, SVD changes layer structure and distillation changes training.

Read the method labels before comparing numbers. A compressed container size and a dense inference latency measure different representations. The report should make these distinctions visible rather than collecting them under one ambiguous “model size” column.

## 2. Pareto dominance is a precise comparison

For a quality metric to maximize and a cost to minimize, method A dominates B if A is at least as good in both and strictly better in at least one. Nondominated methods form a Pareto set for the measured points. The set depends on the chosen metrics, workload and uncertainty. It is not a proof that no untested method can do better.

```python
points = [('A',.90,10),('B',.92,12),('C',.89,13),('D',.91,9)]
frontier = []
for name,quality,cost in points:
    dominated = any(q>=quality and c<=cost and (q>quality or c<cost)
                    for other,q,c in points if other!=name)
    if not dominated: frontier.append(name)
assert frontier == ['B','D']
print(frontier)
```

These are illustrative quality/cost pairs, not measured laboratory results. A is dominated by D; C is also dominated. B and D trade higher quality against lower cost. A decision requires a constraint or preference, such as maximum latency or minimum acceptable quality.

## 3. Benchmark protocol

Use the saved split, fixed validation-selection rules and identical CPU/thread/input policies. Record raw timings for batch one and batch 64, warm-up count, repetitions, median/p95 and environment. Compare raw parameter bytes, actual serialized artifacts and predictive quality. Do not label these as peak RAM or energy. If adding those measurements, define an appropriate instrument and boundary.

The one-shot transformations do not get fine-tuning in the core comparison. The small students do get training. Therefore the table compares resulting artifacts under explicitly different construction procedures, not an equal-total-training-compute competition. A focused assignment extension should isolate one factor more tightly.

## 4. Worked decision reasoning

Suppose a factorized model has fewer parameters but slightly worse median latency, with overlapping timing variation. A valid conclusion is that storage/parameter savings were observed while a latency benefit was not established on this CPU workload. It is not valid to remove the slower measurement because theory predicted a speedup. Conversely, a small latency gain with a large quality loss may violate the chosen quality constraint.

Choose the decision rule before final test evaluation. For example, require accuracy within a predeclared tolerance of a reference and then minimize measured median latency, while checking p95. The tolerance is a project design choice, not a universal acceptable loss. Use validation to select compression settings and report the frozen final test comparison.

## 5. Error analysis and reproducibility

Compare predictions to identify which examples change after compression. Report whether the changes concentrate in particular classes. Inspect calibration if probabilities are part of the use case. Save factor ranks, masks, scales, student architecture and training configuration so a peer can reconstruct the artifact rather than merely load an unexplained binary file.

Retain per-run metrics and raw timing samples. A timing distribution from 100 repeated calls of one trained model is not the same as variation across 100 independently trained models. Label the source of uncertainty. Repeat complete benchmark sessions when close results could be explained by machine noise.

## Exercises and self-check

1. Compute frontiers for accuracy versus parameter bytes and accuracy versus latency. Explain why they can differ.
2. Include p95 latency and discuss whether a method attractive by median remains acceptable.
3. Explain which additional evidence would be needed to claim a phone-deployment speedup from the CPU experiment. **Check:** actual target hardware/backend/workload measurements.
4. Write a recommendation under a memory constraint and another under an interactive latency constraint. State when no tested model satisfies the requirement.

## Submission readiness

Submit a 3–5 page report, runnable artifacts, selection protocol, measured table, Pareto plot, raw timing samples and one controlled extension. Explain at least one case where theoretical savings did or did not translate into runtime. Correct measurement and clear limits matter more than obtaining a positive speedup.

## Primary reading

- [PyTorch: benchmark utilities](https://docs.pytorch.org/docs/2.9/benchmark_utils.html): audit the measurement procedure.
- [Deep Compression](https://arxiv.org/abs/1510.00149), [LoRA](https://arxiv.org/abs/2106.09685) and [Distillation](https://arxiv.org/abs/1503.02531): identify the exact mechanism corresponding to each artifact and avoid borrowing performance claims from different settings.
