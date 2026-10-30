# Gradients, matrix calculus and the chain rule

**Core time:** 120 minutes. **Prerequisites:** affine layers, squared error and elementary derivatives. **Outcomes:** derive a batch gradient with correct dimensions; trace a computation graph; verify an analytic gradient numerically; explain what automatic differentiation does and does not check.

## 1. A derivative is a local prediction of change

For a scalar function, the derivative predicts the change in output caused by a sufficiently small change in input. For a scalar loss depending on a parameter vector, the gradient collects the partial derivatives in the same shape as the parameters. Its dot product with a small displacement approximates the loss change. Moving in the negative-gradient direction is locally downhill when the gradient is nonzero and the step is sufficiently small. A huge step can increase the loss despite having the correct direction.

For a vector-valued function, the Jacobian organizes how each output changes with each input. Writing the full Jacobian is often unnecessary: backpropagation repeatedly applies vector–Jacobian products to carry the derivative of one scalar loss back through a graph. This is why a training framework can differentiate a model with millions of parameters without constructing every possible derivative matrix.

## 2. Derive a loss before coding it

Let `X` have shape `(n,d)`, `w` shape `(d,)`, and `y` shape `(n,)`. Define residual `r=Xw-y` and the half mean-squared loss below. The factor one-half cancels the derivative's factor two; the factor `1/n` controls the scale relative to batch size.

```math
L(w)=\frac{1}{2n}\sum_{i=1}^n(x_i^\top w-y_i)^2,
\qquad \nabla_w L=\frac{1}{n}X^\top(Xw-y),
\qquad \nabla_w^2 L=\frac{1}{n}X^\top X.
```

To derive one coordinate, differentiate each squared residual with respect to `w_j`: it contributes `r_i*x_ij/n`. Summing over observations gives component j of `X.T@r/n`. Check dimensions: `(d,n)@(n,)` gives `(d,)`, exactly the parameter shape. The Hessian is positive semidefinite because for any vector v, `v.T@X.T@X@v/n = ||Xv||²/n >= 0`. It is positive definite when the design has full column rank. This explains convexity and when the unregularized optimum is unique.

For a multi-output affine layer `Z=XW+b`, suppose `G` is the derivative of the scalar loss with respect to `Z`, shape `(n,k)`. Then the weight gradient is `X.T@G`, the bias gradient sums G over the batch, and the input gradient is `G@W.T`. If the loss already averages observations, do not divide by n again in the layer gradient.

## 3. Worked example: a complete backward pass

Use `X=[[1,2],[3,4]]`, `y=[1,2]` and `w=[0.2,-0.1]`. Predictions are `[0,0.2]`, residuals are `[-1,-1.8]`, and the half mean-squared loss is `(1+3.24)/4=1.06`. The gradient is `[(-1-5.4)/2,(-2-7.2)/2]=[-3.2,-4.6]`. A step of size 0.01 produces `w=[0.232,-0.054]`. Notice that both weights increase because both gradient coordinates are negative.

```python
import numpy as np
X = np.array([[1., 2.], [3., 4.]])
y = np.array([1., 2.])
w = np.array([0.2, -0.1])
def loss(v):
    r = X @ v - y
    return float(r @ r / (2 * len(y)))
analytic = X.T @ (X @ w - y) / len(y)
h = 1e-5
numeric = np.zeros_like(w)
for j in range(len(w)):
    direction = np.zeros_like(w)
    direction[j] = h
    numeric[j] = (loss(w + direction) - loss(w - direction)) / (2*h)
np.testing.assert_allclose(analytic, [-3.2, -4.6])
np.testing.assert_allclose(analytic, numeric, rtol=1e-6, atol=1e-8)
assert loss(w - 0.01*analytic) < loss(w)
print(loss(w), analytic, numeric)
```

Central differences use two loss evaluations per coordinate. They are useful for small checks, not an efficient replacement for reverse-mode differentiation of a large network. Make the check deterministic and use float64. Dropout, random augmentation and changing minibatches otherwise cause changes unrelated to the derivative you are checking.

## 4. Chain rule through a nonlinearity

Consider `z=w*x+b`, `a=max(0,z)`, and `L=(a-y)^2/2`. If `z>0`, the derivative through ReLU is one; if `z<0`, it is zero. At zero the classical derivative is undefined and implementations choose a convention. For `x=2,w=0.5,b=0,y=3`, z and a are one, the derivative of loss with respect to a is -2, the weight derivative is -4 and bias derivative -2. Change the bias to -2 and the preactivation becomes -1: this example's ReLU derivative is zero even though the prediction is poor.

Automatic differentiation follows the operations actually executed. If a programmer detaches a tensor, converts it to a plain Python number or accidentally evaluates the wrong residual, autograd cannot infer the intended model. A correct derivative of an incorrect computation is still an incorrect experiment. Inspect tensor shapes, gradient presence and the objective definition separately.

## 5. Gradient-check failure modes

Very large finite-difference steps introduce approximation error; extremely small steps lose information through subtraction of nearly equal numbers. Try a range such as `1e-3,1e-4,1e-5,1e-6` in float64. Avoid points at a nonsmooth activation boundary. Compare absolute error near a zero gradient and relative error for larger gradients; a relative error with a nearly zero denominator can be misleading. A scalar loss may be averaged over examples, outputs or both; record which convention was differentiated.

## Exercises and self-check

1. Add `lambda*||w||²/2` to the worked loss. Derive the additional gradient and Hessian. **Check:** add `lambda*w` and `lambda*I` respectively.
2. For `X` of shape `(8,3)`, `W` `(3,4)` and G `(8,4)`, state the shapes of all three affine-layer gradients. **Check:** `(3,4)`, `(4,)` and `(8,3)`.
3. A finite-difference check fails only near ReLU zero. Design a diagnostic before concluding autograd is broken. **Check:** move away from the kink, test a smooth function, vary step size and verify deterministic inputs.
4. Implement a two-layer network with tanh, derive its gradients and compare with both numerical differences and PyTorch autograd. Submit the maximum coordinate error and the tested input/parameter shapes, not only “passed.”

Run `lab01_math.py` for the executable linear-gradient check; the PyTorch module later extends the same reasoning to an MLP.

## Primary reading

- [PyTorch: automatic differentiation](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html): connect graph construction and accumulated gradients to the derivation above.
- [Goodfellow, Bengio and Courville: Numerical Computation](https://www.deeplearningbook.org/contents/numerical.html): read the gradient-based optimization discussion and identify its smoothness assumptions.
