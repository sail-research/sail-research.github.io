# Capstone brief: Efficient Model Trade-off Study

**Estimated project effort:** 12–20 hours after Efficient ML. **Prerequisites:** a trained baseline, measurement protocol and one compression/adaptation technique. Complete this capstone if assigned; the other two briefs are alternatives.

## 1. Research question and decision context

Choose one primary intervention—pruning, quantization, SVD factorization or distillation—and ask how it changes predictive quality and a precisely measured resource under a fixed workload. A suitable question is: “For batch-one CPU inference on the digit task, which SVD ranks reduce raw parameter storage while preserving a predeclared validation-quality tolerance, and do they also improve latency?”

Do not promise that every method makes a model faster. The purpose is to test whether theoretical savings survive representation and hardware details. A measured slowdown with a sound explanation is a valid research outcome.

## 2. Required comparison design

Use a saved baseline and at least three settings of the chosen intervention, selected without final test labels. Keep data split, preprocessing and inference workload fixed. For methods involving additional training, report that budget and include the appropriate control: for distillation, a same-size hard-label student; for prune-and-fine-tune, a baseline with a comparable extra training opportunity.

State the target device, thread policy, input/batch shapes, dtype, backend, warm-up, repetitions and timed region. If using simulated quantization followed by float inference, label it exactly that way. Actual integer speed claims require an integer execution path. Actual peak-memory or energy claims require corresponding measurements.

## 3. Worked storage gate

Before testing rank r for an m-by-n matrix, compare `r*(m+n)` with `m*n`. For a 64-by-64 matrix, rank 8 reduces 4,096 weight values to 1,024 factor values; rank 40 increases them to 5,120. This arithmetic filters unreasonable compression settings but does not predict latency or accuracy.

```python
def factor_storage(m,n,r):
    if not 1<=r<=min(m,n): raise ValueError('Invalid rank')
    return {'dense_values':m*n,'factor_values':r*(m+n),
            'saves_values':r*(m+n)<m*n}
assert factor_storage(64,64,8)['saves_values']
assert not factor_storage(64,64,40)['saves_values']
```

Verify the implemented factor shapes, bias placement and full-rank equivalence before interpreting a low-rank result. Similar mechanism-specific checks apply to masks, quantization ranges and frozen-teacher parameters.

## 4. Required measurements

Report accuracy, macro F1, class supports, parameter count, raw parameter bytes, actual serialized bytes and latency median/p95 for at least one declared batch size. Preserve raw timing samples and repeat complete sessions if differences are small. Include a Pareto plot for quality versus the primary resource and explain the decision rule.

Keep analytical metrics separate from measured metrics. Counted FLOPs are not measured energy; parameter bytes are not peak RAM; compressed disk bytes are not necessarily runtime storage. If the result depends on backend conversion, show which representation was executed.

## 5. Analysis and deliverables

Identify prediction changes after compression and inspect whether particular classes degrade. Discuss timing noise, kernel overhead and training-budget differences. State whether your conclusion transfers beyond the tested CPU/device, batch, precision and dataset; normally such transfer remains untested.

Submit a proposal and protocol, a baseline/mechanism-check milestone, a complete setting grid, and a final 4–6 page report with 5–8 slides. The reproduction package contains code/environment, configs, split IDs, selected artifacts, raw timing/quality outputs, tables/plots and commands. Include measured runtime expectations for reproduction on your machine, while noting that other machines differ.

## 6. Rubric and essential gates

| Criterion | Points | Evidence |
|---|---:|---|
| Question and resource contract | 15 | Clear workload and optimization target |
| Method and control design | 20 | Valid mechanism, comparator and selection |
| Implementation correctness | 20 | Representation checks and reproducible artifacts |
| Measurement and tradeoff analysis | 25 | Raw timings, units, uncertainty and Pareto reasoning |
| Communication and reproducibility | 20 | Fresh-run instructions, report and oral defense |

Essential gates: correct metric labels, no test-driven selection presented as held out, comparable inference workload, no invented speed/memory/energy claims and reproducible raw evidence. Pass recommends at least 70 with gates met. Excellent recommends at least 90, a careful extension and a well-supported practical recommendation, including “none of the tested options meets the constraint” when appropriate.

## Oral-defense questions

Which resource actually decreased? Why might fewer weights fail to improve latency? Was your quantized model executed with integer kernels? What uncertainty affects the speedup? Which configuration would you choose under a different batch-size or memory constraint, and what new evidence would be needed?

## Primary reading

- [Deep Compression](https://arxiv.org/abs/1510.00149), [integer quantization](https://arxiv.org/abs/1712.05877), [LoRA](https://arxiv.org/abs/2106.09685), or [distillation](https://arxiv.org/abs/1503.02531): select the source matching your intervention.
- [PyTorch benchmark utilities](https://docs.pytorch.org/docs/2.9/benchmark_utils.html): audit the timing design.
