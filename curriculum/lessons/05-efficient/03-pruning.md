# Pruning: sparsity, structure and the cost of zeros

**Core time:** 120 minutes. **Prerequisites:** neural layers and efficiency measurement. **Outcomes:** implement magnitude pruning; distinguish masked dense weights from sparse storage; explain structured removal; compare quality and cost with an appropriate baseline.

## 1. Specify what is removed

Unstructured pruning sets individual weights to zero. Structured pruning removes larger units such as channels, neurons or blocks. A mask multiplied into a dense tensor leaves its shape unchanged. A genuinely smaller structured network changes dimensions and downstream connections. These representations can have very different hardware behavior even when both report “50% sparsity.”

Magnitude pruning selects weights with small absolute values under a chosen scope: globally across selected layers or separately within each layer. Biases and normalization parameters may be excluded. State the scope and tie rule, because repeated magnitudes can otherwise change the exact sparsity count.

## 2. Worked example: exact selection

For weights `[-0.1,2.0,0.05,-3.0]`, pruning the two smallest magnitudes removes -0.1 and 0.05, leaving `[0,2,0,-3]`. The representation still contains four values if stored as a dense array. The Euclidean parameter change is `sqrt(0.1²+0.05²)`, but prediction change depends on inputs and network sensitivity.

```python
import numpy as np
w = np.array([-.1,2.,.05,-3.])
pruned = w.copy()
indices = np.argsort(np.abs(w),kind='stable')[:2]
pruned[indices] = 0
np.testing.assert_allclose(pruned,[0.,2.,0.,-3.])
assert pruned.nbytes == w.nbytes
print(pruned,np.linalg.norm(pruned-w))
```

A threshold rule can prune more than the requested count when many values tie at the threshold. Selecting exact sorted indices makes the intended count explicit. In larger models, the implementation should preserve a mask if pruning is meant to persist during fine-tuning; otherwise zeroed weights can regrow.

## 3. Prune, evaluate and optionally fine-tune

First save a trained baseline. Apply a fixed pruning rule to a copy, evaluate validation quality and record sparsity. If fine-tuning, use training data and an explicit budget; select the resulting checkpoint on validation. Compare with a baseline given an equivalent additional training opportunity if making a claim about the pruning method rather than merely the final artifact.

The core efficiency lab performs one-shot magnitude zeroing without fine-tuning. It therefore measures an immediate perturbation of a trained model, not the full iterative prune/retrain pipeline in Deep Compression. This scope is intentional and should appear in the report.

## 4. Sparse arithmetic requires support

A dense matrix multiplication generally still processes a zero-valued matrix entry according to its dense kernel. Sparse formats store values and locations and can save space at high enough sparsity, but metadata and irregular memory access add costs. Hardware-supported sparsity patterns can help, yet their constraints and kernels must match the representation. Do not infer speed from a zero counter.

Structured pruning can reduce dense dimensions, but removing a hidden unit requires removing its incoming weights/bias and corresponding outgoing connections. Batch normalization, residual connections and grouped convolutions can introduce additional consistency constraints. A model that executes after dimension surgery still needs accuracy and shape checks.

## 5. Compare the whole tradeoff

Report fraction of selected weights zeroed, overall parameter count, raw/serialized bytes, predictive quality and measured latency under the same workload. If file compression shrinks a zero-filled checkpoint, distinguish that disk benefit from in-memory storage. A slower result is plausible for small workloads and should not be suppressed.

## Exercises and self-check

1. Why can a masked dense tensor use more storage during training than the unpruned tensor? **Check:** the mask and possibly original parameter representation add state.
2. Remove one hidden neuron from a two-layer MLP and list all affected arrays. **Check:** first-layer row and bias, second-layer input column, plus any associated state.
3. Compare global and per-layer pruning at equal overall sparsity. Identify a case where one policy damages a small sensitive layer disproportionately.
4. Explain why a 50% sparse dense model cannot honestly be reported as 50% fewer allocated parameters.

## Primary reading

- [PyTorch: pruning tutorial](https://docs.pytorch.org/tutorials/intermediate/pruning_tutorial.html): inspect masks, reparameterization and removing pruning hooks.
- [Han et al.: Deep Compression](https://arxiv.org/abs/1510.00149): distinguish the paper's full pipeline from this one-shot teaching intervention.
