# Measure latency, memory and throughput honestly

**Core time:** 120 minutes. **Prerequisites:** resource accounting and evaluation mode. **Outcomes:** design a repeatable benchmark; report distributions and units; separate batch latency from throughput; distinguish parameter bytes from measured peak memory.

## 1. Define the timed region

Decide whether timing includes preprocessing, host-to-device transfer, model execution and postprocessing. A model-only benchmark is useful, but it is not end-to-end service latency. Construct inputs and load weights outside the timed region unless those operations are intentionally part of the question. Put the model in evaluation mode and use an appropriate inference context.

Warm-up calls can initialize kernels, caches or compilation. Record how many were used and whether cold-start latency is reported separately. Repetitions produce a distribution; a single fastest call is not a representative latency estimate. Background processes, CPU frequency changes and thread settings can influence measurements.

## 2. Worked timing procedure

The CPU lab fixes PyTorch to one thread, performs 20 warm-up calls and records 100 individual calls with a high-resolution monotonic timer. It reports median and p95 batch latency in milliseconds for batch sizes 1 and 64. These are measurements on the executing machine, not predictions for a production deployment.

```python
import time
import numpy as np
import torch
torch.set_num_threads(1)
model = torch.nn.Linear(64,10).eval()
x = torch.zeros(1,64)
samples = []
with torch.inference_mode():
    for _ in range(20): model(x)
    for _ in range(100):
        start = time.perf_counter_ns()
        model(x)
        samples.append((time.perf_counter_ns()-start)/1e6)
print({'median_ms':float(np.median(samples)),
       'p95_ms':float(np.quantile(samples,.95))})
```

For extremely small operations, timer overhead and Python dispatch can be significant. A library benchmark timer can amortize repetitions and provide a more robust operator-level measurement. State the implementation used. On asynchronous accelerators, synchronize the relevant work or use appropriate device events; otherwise the host timer may measure enqueue time rather than completed computation.

## 3. Batch latency and throughput answer different questions

If a batch of 64 takes 4 ms, batch throughput is 16,000 examples per second under that measurement. This does not mean a single request has 0.0625 ms latency; it may wait for batch formation and share a larger execution. Report batch size beside every number. A system optimized for high throughput can be unsuitable for an interactive latency target.

```python
batch_size,batch_ms = 64,4.0
throughput = batch_size/(batch_ms/1000)
assert throughput == 16000
print(throughput)
```

Theoretical throughput derived from one batch measurement excludes queueing, input delivery and service overhead. Label it accordingly.

## 4. Memory measurements need names

Raw parameter bytes sum tensor elements times element size. Serialized file bytes come from the artifact on disk. Peak process memory includes Python/runtime/library allocations and may retain allocator caches. Device allocated/reserved memory are different counters. Activation memory depends on batch size and model execution; training also retains backward state.

The core lab reports raw parameter bytes and actual checkpoint/container sizes. It does not claim to measure peak process/device memory or energy. An extension can add platform-appropriate peak-memory instrumentation, but must define the measurement window and baseline. Do not label a parameter-count calculation “RAM usage.”

## 5. A fair benchmark compares the same workload

Use identical inputs, batch size, dtype, thread policy, warm-up and timed region across methods. Randomize or alternate method order to reduce drift effects when necessary. Repeat complete benchmark sessions if results are close. Report dispersion and avoid claiming a speedup from differences smaller than observed noise. Preserve raw timings so a reviewer can inspect outliers rather than accepting a handpicked average.

Energy needs an actual power/energy measurement or a clearly labeled model with assumptions. Fewer FLOPs do not directly establish fewer joules. Carbon estimates additionally depend on hardware utilization, energy mix and boundaries; this course does not infer them from parameter counts.

## Exercises and self-check

1. Why can GPU timing without synchronization be misleading? **Check:** operations may still be running when the host timer stops.
2. A pruned dense model is 2% faster in one run and 3% slower in another. Write a justified conclusion. **Check:** no clear speed benefit has been established under the current measurement variability.
3. Design cold-start and steady-state benchmarks and explain what each includes.
4. Identify the incorrect label in “model RAM=number of weights times four.” **Check:** this computes raw float32 parameter storage, not total runtime memory.

## Primary reading

- [PyTorch: benchmark utilities](https://docs.pytorch.org/docs/2.9/benchmark_utils.html): read warm-up, synchronization and measurement guidance.
- [Python: performance counter](https://docs.python.org/3/library/time.html#time.perf_counter): verify the timer's monotonic duration semantics.
