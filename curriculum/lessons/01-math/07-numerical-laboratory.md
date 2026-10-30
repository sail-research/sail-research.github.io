# Mathematical foundations laboratory: from equations to checked evidence

**Core time:** 2–3 hours. **Prerequisites:** Math 1–6. **Outcomes:** organize a numerical experiment; choose meaningful assertions; connect numerical conditioning, gradient correctness and uncertainty; prepare the first assessed artifact.

## 1. The scientific question

The laboratory asks: “Can I explain and verify the numerical computations underlying a simple learning algorithm?” It deliberately uses small matrices and synthetic observations. Small examples make it possible to inspect every intermediate quantity, which is valuable before scaling to a neural network. Passing these examples does not prove a general library correct, but failing them reveals a concrete inconsistency to investigate.

Download the [laboratory bundle](https://www.sail-research.com/training/materials/sail-training-labs.zip), follow the setup guide, and run `python lab01_math.py --output outputs/math-baseline`. Preserve the output JSON and the terminal output. The program checks an affine map, a least-squares solution, a gradient, a truncated SVD and stable versus unstable optimization. It also records a paired-bootstrap demonstration. Read the code before changing its inputs.

## 2. Floating-point arithmetic is a model of computation

Real arithmetic on paper and finite-precision arithmetic on a machine are different. A floating-point format represents a finite set of values. Rounding error can accumulate, and subtracting nearly equal quantities can lose relative accuracy. Associativity need not hold exactly: `(a+b)+c` can differ from `a+(b+c)`. This does not mean the computer is random; it means the operation order and representation matter.

```python
import numpy as np
a = np.float64(1e16)
b = np.float64(-1e16)
c = np.float64(1.)
print((a+b)+c, a+(b+c))
small = np.array([1e-8, 2e-8], dtype=np.float64)
assert np.isfinite(small).all()
```

Do not use an unnecessarily large tolerance to make a failed test pass. Relate the tolerance to scale, dtype, conditioning and the operation being checked. An absolute tolerance is useful near zero; a relative tolerance scales with the expected magnitude. A result that is “close” under a loose threshold may still be scientifically unusable if the effect of interest is smaller than the numerical error.

## 3. Write tests that would catch a plausible mistake

For matrix multiplication, test a hand-computed non-square example and reject incompatible feature dimensions. For a least-squares solution, test residual orthogonality and compare against a trusted solver. For a gradient, compare analytic and central-difference values at several nontrivial parameter points. For SVD, check reconstruction and that rank-k approximation error matches the discarded singular values within tolerance. For probabilities, check finite values, nonnegativity and unit sum.

These are semantic tests: they connect code to a mathematical claim. A test that merely reproduces the same implementation formula can share its bug. For example, copying `X*r` into both the implementation and expected-value calculation does not independently verify matrix multiplication. Use a tiny manually computed answer, an invariant or an independently implemented method.

## 4. Guided investigation: conditioning and optimization

Generate a two-feature regression problem where the second feature is almost a multiple of the first. Use a fixed random generator and record its seed. Solve the original problem and a version with a tiny perturbation to y. Measure both the norm of the parameter change and the norm of the prediction change. Compare with a ridge solution over a small, declared lambda grid. Choose lambda using validation data if making a predictive claim; for this numerical demonstration you may show all values without declaring a winning predictive method.

Next scale one feature by 1,000. Compute the Hessian of the half mean-squared objective, estimate its largest eigenvalue, and choose a step smaller than `2/lambda_max`. Compare a deliberately excessive step and a safe step. Plot loss against updates and state whether feature scaling changes the underlying fitted prediction family or merely its parameterization and optimization behavior.

## 5. Guided investigation: stable log probabilities

Compare naive softmax with max-shifted softmax on logits `[1000,1001,999]`. The naive exponential can overflow. An overflow warning is evidence of a numerical problem, not a harmless message to suppress. Then add a constant of 10,000 to every logit and verify the stable probabilities do not change substantially. This checks a mathematical invariance independently of a specific expected probability vector.

```python
import numpy as np
def stable_softmax(z):
    z = np.asarray(z, dtype=np.float64)
    shifted = z-z.max()
    return np.exp(shifted)/np.exp(shifted).sum()
p = stable_softmax([1000., 1001., 999.])
q = stable_softmax([11000., 11001., 10999.])
np.testing.assert_allclose(p, q)
np.testing.assert_allclose(p.sum(), 1.)
```

## 6. From observations to a report

Your report should contain a question, the relevant equation and assumptions, the implementation decision, a table or plot of actual results, an interpretation and a limitation. A suitable limitation is that finite-difference agreement was tested only at particular smooth points in float64. An unsuitable conclusion is “autograd is always correct” or “ridge always improves prediction,” because the experiment did not test those universal claims.

Keep demonstration outputs separate from the assessed variations. Copying the bundle's default results proves that the script ran, not that you can design a check. The module assignment requires at least one new shape example, one new gradient point, a conditioning perturbation and a paired comparison that you explain yourself.

## Exercises

1. Replace the correct gradient's averaging factor `1/n` with `1/d`. Predict when this bug is hidden, then choose a test where it is visible.
2. Construct a finite-difference test at a ReLU kink and explain why failure is inconclusive there.
3. Change bootstrap seed while keeping the original paired observations fixed. Separate Monte Carlo variability from data uncertainty in your explanation.
4. Add a test for a zero-vector cosine input. State whether your API rejects it or returns an explicitly documented sentinel.

## Self-check and readiness gate

For 1, the mistake is hidden when n equals d; choose unequal dimensions and nonzero gradients. For 2, the classical derivative is undefined at the kink and central differences can cross both branches. For 3, only the resampling computation changes, not the original evidence. For 4, silently returning a meaningful-looking cosine for an undefined case is poor documentation; a clear error is reasonable.

You are ready to submit when a peer can run your command in a fresh environment, see the same qualitative conclusions, inspect the raw metrics and locate the tests that would catch your chosen failure cases. Continue to the module assignment in the portal for deliverables and the 100-point rubric.

## Primary reading

- [NumPy: numerical `allclose` comparison](https://numpy.org/doc/stable/reference/generated/numpy.allclose.html): read the tolerance equation and the warning about small reference values.
- [Goodfellow, Bengio and Courville: Numerical Computation](https://www.deeplearningbook.org/contents/numerical.html): connect overflow, underflow and conditioning to the concrete failures you observed.
