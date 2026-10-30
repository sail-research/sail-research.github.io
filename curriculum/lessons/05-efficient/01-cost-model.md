# Efficient ML: define the resource before optimizing it

**Core time:** 100 minutes. **Prerequisites:** neural layers and evaluation. **Outcomes:** calculate parameter storage and arithmetic counts; distinguish training/inference costs; identify activation and optimizer memory; define a multidimensional efficiency question.

## 1. “Smaller” and “faster” describe different quantities

A model can have fewer parameters and still run more slowly because its operators are poorly supported, it launches many small kernels or it moves data inefficiently. A compressed file can load into the same dense runtime representation. An unstructured sparse matrix can contain many zeros while a dense kernel still multiplies them. Therefore an efficiency claim must name its resource: parameters, serialized bytes, arithmetic, latency, throughput, peak memory, energy or training cost.

Quality also has several dimensions. A compressed model may preserve overall accuracy while degrading a rare class or calibration. The relevant optimization is usually constrained: minimize a resource while meeting a quality/latency/memory requirement, or expose the tradeoff without selecting a universal winner.

## 2. Count parameters and bytes carefully

A dense layer from d inputs to h outputs has `d*h+h` parameters with bias. A two-layer MLP with widths 64,32,10 has `64*32+32+32*10+10=2,410` parameters. If all are float32, raw parameter storage is 9,640 bytes. A serialized checkpoint has additional metadata; runtime memory includes more than parameters.

```python
d,h,c = 64,32,10
parameters = d*h+h+h*c+c
raw_parameter_bytes = parameters*4
assert parameters == 2410 and raw_parameter_bytes == 9640
print(parameters,raw_parameter_bytes)
```

During training, gradients and optimizer state add storage. Adam commonly keeps first and second moment tensors in addition to parameters, while activations saved for backpropagation can dominate memory. Mixed-precision training may retain master weights or other state depending on the implementation. Avoid a universal “training uses exactly four times the parameter memory” formula without defining the optimizer and precision policy.

## 3. Arithmetic counts need a convention

A dense matrix-vector product with d inputs and h outputs performs roughly d*h multiply-accumulate pairs per example, plus bias/activation work. Some reports count one multiply-add as two floating-point operations; others count one MAC. State the convention. For convolution, multiply the per-output channel/filter cost by the number of output spatial positions and batch size.

These counts are useful for reasoning but do not fully predict wall time. Memory bandwidth, caches, vectorization, parallelism, kernel selection and launch overhead matter. A workload can be compute-bound or memory-bound depending on its operational intensity and hardware. An optimized fused operator can outperform a theoretically smaller sequence of unfused operations.

## 4. Worked example: rank reduction may not reduce parameters

A matrix with shape `(m,n)` can be represented by factors `(m,r)` and `(r,n)`, requiring `r*(m+n)` values. This is fewer than `m*n` only when r is below `m*n/(m+n)`. For a 32-by-64 matrix, rank 8 uses 768 factor values instead of 2,048. Rank 24 uses 2,304, more than the dense matrix. A method named “low rank” does not automatically save storage at every chosen rank.

The factorized operator also performs two matrix products and creates an intermediate. Even when parameter count decreases, latency may increase for a small batch. That is why the laboratory measures rather than infers speed.

## 5. Design an efficiency contract

State the device, input shape, batch size, dtype, operator/backend, quality metric, allowable quality loss and resource target. For example: “On one CPU thread, batch-one digit inference, compare median and p95 latency while reporting test accuracy and raw/serialized parameter storage.” This is a narrow, measurable contract. It does not claim performance on a phone, GPU or production service.

Training-efficient methods may reduce trainable parameters without reducing inference parameters. LoRA is an example of a method whose adaptation cost and deployable representation need separate accounting. Distillation adds teacher-training cost even when the final student is smaller. Include the cost stage relevant to your claim.

## Exercises and self-check

1. Count parameters of a 64–16–10 MLP with bias. **Check:** 1,210.
2. Explain why zeroing half the weights does not halve dense parameter bytes. **Check:** the same tensors and dtypes remain allocated unless representation changes.
3. For a 100-by-100 matrix, determine the ranks that reduce factor storage. **Check:** integer r below 50; r=50 ties before metadata/bias.
4. Write separate contracts for training memory and batch-one inference latency. Identify measurements that one contract cannot support.

## Primary reading

- [Han, Mao and Dally: Deep Compression](https://arxiv.org/abs/1510.00149): distinguish pruning, quantization and coding stages rather than attributing all savings to zeros.
- [PyTorch: benchmark utilities](https://docs.pytorch.org/docs/2.9/benchmark_utils.html): connect operation-level measurement to a precisely specified workload.
