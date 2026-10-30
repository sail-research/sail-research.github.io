# Tensors, shapes and linear maps

**Core time:** 90–120 minutes, plus exercises. **Prerequisites:** basic Python, sums and multiplication. **Outcomes:** translate a model expression into array shapes; compute dot products and norms; distinguish matrix multiplication from elementwise operations; diagnose broadcasting errors.

## 1. Begin with the question an array answers

Suppose a laboratory records three measurements for each of four devices. An array `X` with shape `(4, 3)` is useful only after we say what the axes mean: row = device, column = measurement. A transposed array has the same twelve values but a different interpretation. In this course, a tabular batch normally has shape `(n_samples, n_features)`. An image batch in PyTorch normally uses `(batch, channels, height, width)`. Write these conventions beside a calculation before writing code.

A scalar has no indexing axes, a vector has one, a matrix has two, and a higher-order array has more. The word tensor here means such a numerical array; it does not automatically mean that coordinate-transformation rules from differential geometry are being used. Array order is also different from matrix rank: a matrix is a two-axis object even when all its columns are multiples of one another and its rank is one.

The dimensions tell you what combinations are possible. If each observation has three features and we want two scores, choose a weight matrix with shape `(3, 2)` and a bias with shape `(2,)`. Multiplication sums over the shared feature dimension, producing `(4, 2)`. The same weights are applied to every observation; the weights do not depend on batch size.

```math
X\in\mathbb{R}^{n\times d},\quad W\in\mathbb{R}^{d\times k},\quad b\in\mathbb{R}^{k},\qquad Z=XW+\mathbf{1}b^\top.
```

Each output `Z[i,j]` is the dot product of input row `i` and weight column `j`, followed by a bias. This is a linear map plus a translation, usually called an affine layer. A strictly linear map sends zero to zero. The bias makes the layer affine unless it is zero. Later, nonlinear activation functions allow stacked layers to express more than one affine transformation.

## 2. Geometry supplies checks that shapes cannot

For vectors `u` and `v`, the dot product adds products of matching coordinates. The Euclidean norm is the square root of the dot product of a vector with itself. A vector can have a small norm yet a large effect on a sensitive model; a norm describes a perturbation size, not its consequence. Other useful norms are the sum of absolute values (L1) and largest absolute coordinate (L-infinity). The allowed perturbation set in a robustness experiment depends on which norm is used.

If both vectors are nonzero, cosine similarity divides their dot product by the product of their Euclidean norms. It measures direction agreement and ignores positive rescaling. It is undefined for a zero vector. Code must decide explicitly how to handle that case rather than quietly divide by a tiny constant and describe the result as a true cosine.

For `u=[3,4]` and `v=[4,-3]`, the dot product is `12-12=0`, both norms are 5, and the vectors are orthogonal. For `2*u`, the norm doubles but the cosine with `u` remains one. These simple invariants are useful tests for an embedding or normalization implementation.

## 3. Worked example: two devices, two outputs

Take `X=[[1,2],[3,4]]`, `W=[[2,-1],[0,3]]` and `b=[1,-2]`. For the first observation, output 1 is `1*2 + 2*0 + 1 = 3`; output 2 is `1*(-1) + 2*3 - 2 = 3`. For the second observation the outputs are 7 and 7. Therefore `Z=[[3,3],[7,7]]`.

The elementwise operation `X*W` also happens to be legal because both shapes are `(2,2)`, but it produces `[[2,-2],[0,12]]`. This is a particularly dangerous bug: there is no shape exception. Always test a tiny case whose answer you know, then test a non-square case so accidental shape coincidences cannot rescue a wrong implementation.

```python
import numpy as np
X = np.array([[1., 2.], [3., 4.]])
W = np.array([[2., -1.], [0., 3.]])
b = np.array([1., -2.])
Z = X @ W + b
assert Z.shape == (2, 2)
np.testing.assert_allclose(Z, [[3., 3.], [7., 7.]])
u = np.array([3., 4.])
v = np.array([4., -3.])
assert u @ v == 0
assert np.linalg.norm(u) == 5
print(Z)
```

The `@` operator expresses a matrix product. Floating-point assertions should generally use a tolerance; exact equality is appropriate here only for the deliberately small integer-representable calculations. Later gradient calculations accumulate rounding error.

## 4. Broadcasting is useful and capable of lying to you

NumPy compares dimensions from the right: dimensions are compatible when they are equal or one is 1; missing leading dimensions behave as 1. Thus a bias of shape `(k,)` can be added to an `(n,k)` batch. But subtracting targets with shape `(n,1)` from predictions with shape `(n,)` produces an `(n,n)` matrix, not a length-n residual. A loss averaged over this matrix is a number and can even decrease during training, while measuring the wrong thing.

Inspect `prediction.shape == target.shape` before a regression loss. Use `keepdims=True` when a reduction must preserve an axis. `X.mean(axis=0)` averages observations for each feature; `X.mean(axis=1)` averages features within each observation. These are different statistical questions. Avoid using `reshape` as a cure for a semantic mismatch: it changes interpretation without checking what the axes mean.

## 5. Guided laboratory

Run `python lab01_math.py --output outputs/math`. Find the shape and gradient checks in its result file. Then create three observations with four features and a `(4,2)` weight matrix. Compute one output by hand and compare it to the program. Add a test that intentionally supplies a `(3,1)` target to a `(3,)` prediction and rejects it before subtraction. Finally, normalize two nonzero vectors and verify their lengths are one. Keep the original vectors so that normalization does not silently modify data used in a later calculation.

## Exercises

1. **Shapes:** A batch contains 16 observations with 7 features; the layer has 5 outputs. State the shapes of weights, bias, output and output-gradient. How many trainable scalar parameters are present?
2. **Reasoning:** Show algebraically why two affine layers with no intervening nonlinearity are equivalent to a single affine layer. Does adding depth alone increase their function class?
3. **Debugging:** Explain why `(5,) - (5,1)` gives `(5,5)`. Construct a case where the incorrect loss is zero and discuss why one passing example is weak evidence.
4. **Extension:** Compare L1, L2 and L-infinity norms of `[1,-2,2]`. Which perturbations can share an L-infinity budget while having different L2 sizes?

## Self-check

1. Weights `(7,5)`, bias `(5,)`, output and output-gradient `(16,5)`; parameters `7*5+5=40`. 2. `(XW1+b1)W2+b2 = X(W1W2)+(b1W2+b2)`, so the composition is affine. 3. The prediction expands across one axis and target across the other; all predictions and targets equal to the same constant hide the bug. Test unequal values as well. 4. The norms are 5, 3 and 2. A one-coordinate change of size 2 and a three-coordinate change of size 2 each both satisfy the same L-infinity budget but have different Euclidean lengths.

## Primary reading

- [NumPy: broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html): check the right-to-left compatibility rule against your residual example.
- [Goodfellow, Bengio and Courville: Linear Algebra, Chapter 2](https://www.deeplearningbook.org/contents/linear_algebra.html): use the notation and norm sections as a reference, then restate each in your own words.
