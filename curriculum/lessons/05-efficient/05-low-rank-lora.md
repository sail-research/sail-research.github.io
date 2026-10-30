# Low-rank factorization and LoRA: two different efficiency questions

**Core time:** 120 minutes. **Prerequisites:** SVD, dense layers and parameter accounting. **Outcomes:** replace a dense matrix with rank-r factors; verify exact reconstruction at full rank; distinguish compressing weights from adapting a frozen model; account for merged and unmerged inference.

## 1. Factor a matrix, then inspect the operator

For a weight matrix W with shape `(out,in)`, truncated SVD yields a rank-r approximation. Factor it into B `(out,r)` and A `(r,in)`. A dense layer `x@W.T+b` becomes `(x@A.T)@B.T+b`. The first factor has no bias; the original bias belongs after the second factor. Accidentally introducing two biases changes the represented function.

```math
W_r=U_r\Sigma_rV_r^\top=BA,\qquad
B=U_r\Sigma_r^{1/2},\quad A=\Sigma_r^{1/2}V_r^\top.
```

Splitting square-root singular values between the factors is convenient; placing all singular values in one factor is algebraically possible too. At full available rank, the reconstructed matrix should match the original within numerical tolerance. At lower rank, compare reconstruction error and task quality separately.

## 2. Worked example: storage and error

A 32-by-64 matrix contains 2,048 values. Rank 8 factors contain `32*8+8*64=768`, before bias. The Frobenius squared reconstruction error equals the sum of squared discarded singular values. If those singular values are small, matrix reconstruction is good, but classification can still change near a decision boundary. The SVD objective does not directly optimize prediction accuracy.

```python
import numpy as np
rng = np.random.default_rng(7)
W = rng.normal(size=(6,4))
U,s,Vt = np.linalg.svd(W,full_matrices=False)
r = 2
B = U[:,:r]*np.sqrt(s[:r])
A = np.sqrt(s[:r,None])*Vt[:r]
error = np.linalg.norm(W-B@A,'fro')**2
np.testing.assert_allclose(error,(s[r:]**2).sum())
np.testing.assert_allclose((U*s)@Vt,W,atol=1e-12)
print(error,B.size+A.size,W.size)
```

For this 6-by-4 example, rank 2 uses 20 values versus 24. A larger rank could fail to save storage. Report the actual dimensions and parameter counts, not only the chosen rank.

## 3. LoRA adapts a frozen base rather than discarding it

LoRA parameterizes a trainable update to a frozen weight matrix as a low-rank product, often scaled by alpha/r. The effective weight is the original W plus the update. Training fewer parameters can reduce some adaptation memory and optimizer state, but the base weights remain present. It is not equivalent to replacing W with its truncated SVD.

```math
W_{effective}=W_0+\frac{\alpha}{r}BA.
```

For a 1,000-by-1,000 base and rank 8, the adapter has 16,000 parameters, but the million base parameters still exist. Unmerged inference may compute both base and adapter paths. For suitable linear layers and a fixed adapter, merging the update into the base can remove the extra branch, while producing a full-sized effective weight. Discuss trainable count, total count and deployment representation separately.

## 4. Initialization and gradients matter

If both adapter factors are initialized to zero, gradients through their product can initially be zero for both. A common construction initializes one factor nonzero and the other zero so the initial update is zero while a gradient can enter one factor. The exact convention and scaling are implementation choices to record. Bias training and which layers receive adapters also change trainable counts.

The core lab demonstrates SVD factorization and a small LoRA arithmetic/gradient check. It does not fine-tune a large language model or claim the original paper's performance results. A full LoRA extension needs a task, frozen base, training protocol and appropriate memory/runtime measurements.

## Exercises and self-check

1. For a 512-by-512 matrix and rank 16, count adapter parameters and total base-plus-adapter parameters. **Check:** 16,384 and 278,528, before any biases.
2. Why can two smaller matrix products be slower than one larger one at batch one? **Check:** dispatch, intermediate storage and kernel efficiency can dominate arithmetic savings.
3. Verify full-rank factorization preserves logits, then vary rank using validation and keep test reserved.
4. Explain the difference between “98% fewer trainable parameters” and “98% smaller deployed model.” **Check:** frozen base storage and merged representation remain relevant.

## Primary reading

- [Hu et al.: LoRA](https://arxiv.org/abs/2106.09685): inspect the frozen-base update parameterization and adaptation claims.
- [MIT: Singular Value Decomposition](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/positive-definite-matrices-and-applications/singular-value-decomposition/): connect matrix approximation to the factors implemented here.
