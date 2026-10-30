# Least squares, rank, SVD and principal components

**Core time:** 120 minutes. **Prerequisites:** tensor shapes and dot products. **Outcomes:** interpret least squares as projection; recognize rank deficiency; use a numerical solver instead of an inverse; connect singular values to compression and PCA.

## 1. An imperfect equation can still have a best approximation

We would like to fit a line to three observations: at `x=0,1,2`, the measured responses are `1,2,2`. A line has only two parameters, intercept and slope, so it generally cannot pass through every noisy observation. Put a column of ones and the x-values into a design matrix `A`; let `theta=[intercept,slope]`. The vector `A@theta` lies in the space spanned by the columns of `A`. Least squares chooses the point in that space closest to the observed response vector.

```math
\hat\theta=\arg\min_\theta\frac12\|A\theta-y\|_2^2,\qquad
A^\top(A\hat\theta-y)=0.
```

The second expression says the residual is perpendicular to every column of the design matrix. It follows by differentiating the squared error, but also has a geometric explanation: if a residual component pointed along a column direction, moving slightly in that direction could reduce the distance. This condition is an excellent implementation check. It is not the same as requiring every residual to be zero.

## 2. Work the example all the way through

For the three data points, `A.T@A=[[3,3],[3,5]]` and `A.T@y=[5,6]`. The two normal equations are `3a+3b=5` and `3a+5b=6`. Subtracting them gives `2b=1`, so the slope is 0.5 and intercept is 7/6. Predictions are `[7/6,10/6,13/6]`; residuals `prediction-y` are `[1/6,-1/3,1/6]`. They sum to zero and their dot product with `[0,1,2]` is zero. The sum of squared residuals is 1/6.

These normal equations are valuable for a hand derivation. They are not an instruction to implement `inv(A.T@A)@A.T@y`. Forming the normal matrix squares the 2-norm condition number for a full-column-rank matrix, worsening numerical sensitivity. A least-squares routine using appropriate matrix factorization is usually preferable.

```python
import numpy as np
A = np.column_stack([np.ones(3), np.arange(3.)])
y = np.array([1., 2., 2.])
theta, residuals, rank, singular_values = np.linalg.lstsq(A, y, rcond=None)
r = A @ theta - y
np.testing.assert_allclose(theta, [7/6, 1/2])
np.testing.assert_allclose(A.T @ r, 0, atol=1e-12)
np.testing.assert_allclose(r @ r, 1/6)
print(theta, rank, singular_values)
```

The solver also reports rank and singular values. Do not interpret an empty `residuals` array from this API as proof of zero error; compute `A@theta-y` directly when you need residuals, because the returned summary depends on dimensions and rank.

## 3. Rank asks how many independent directions exist

If one feature is exactly twice another, its column adds no independent direction. Many parameter vectors can then produce the same fitted values. A solver can return a minimum-norm solution, but this does not make each coefficient independently identifiable. If columns are almost dependent, small changes in data can produce large coefficient changes even when predictions barely change.

Scale also matters. A feature measured in millions and another measured in tiny fractions create very different numerical scales. Feature scaling should use training data only. Ridge regularization adds a penalty on coefficient magnitude, stabilizing some ill-conditioned problems while introducing bias. If the intercept is not intended to be penalized, represent that choice explicitly; blindly adding an identity matrix penalizes every coordinate.

```math
\hat\theta_\lambda=\arg\min_\theta\frac12\|A\theta-y\|_2^2+\frac{\lambda}{2}\|\theta\|_2^2.
```

For strictly positive lambda this penalized objective has a unique solution when all coordinates are penalized. That numerical property is separate from whether the modeling assumptions are appropriate. Select regularization using validation data, not by making the test coefficient story attractive.

## 4. SVD reveals the directions a matrix preserves

The singular value decomposition factors a matrix into orthogonal directions and nonnegative scaling values. In a reduced decomposition, a matrix with shape `(m,n)` has `U` of shape `(m,r)`, a length-r vector of singular values, and `Vt` of shape `(r,n)`, where `r=min(m,n)` before discarding zero directions. Some libraries' “full” decomposition returns larger orthogonal factors, so state which form you use.

```math
A=U\Sigma V^\top,\qquad A_k=U_{:,1:k}\Sigma_{1:k,1:k}V_{:,1:k}^\top.
```

Retaining the largest k singular values gives a best rank-k approximation in Frobenius norm. The squared reconstruction error is the sum of squares of discarded singular values. For `diag(5,2,1)`, a rank-one approximation retains 5 and has squared error `2^2+1^2=5`. Rank two has squared error 1. This does not guarantee a classifier retains accuracy after its weight matrix is compressed: the matrix error and prediction error are different objectives.

## 5. PCA is a data transformation with a fitting step

Center training features by subtracting their training means, then take the right singular vectors of the centered matrix. Project observations onto the leading vectors to obtain principal components. With the usual sample-covariance convention and `n>1`, component variances equal squared singular values divided by `n-1`. If features use incompatible units, decide whether training-only standardization is appropriate before PCA.

PCA maximizes retained variance under its orthogonality constraints; it does not maximize class separation. A low-variance direction can carry important predictive information. Fitting PCA on the complete dataset before splitting leaks test-distribution information into preprocessing. Fit the mean and components only on training observations, and apply the same transformation to validation and test sets.

## Guided laboratory and exercises

Run the SVD section of `lab01_math.py` and inspect its reconstruction-error checks. Then complete these tasks:

1. Duplicate the slope column in the worked regression. Report the rank and explain why coefficients may change while fitted values do not.
2. For `diag(8,3,1,0)`, calculate the rank, rank-two squared error and fraction of squared singular-value energy retained at rank two.
3. Create a two-feature classification problem where the informative feature has very small variance and the irrelevant feature has large variance. Explain why raw PCA may discard the informative feature.
4. Compare solutions for a nearly dependent design under tiny response perturbations. Report both coefficient change and prediction change; do not infer instability solely from one coefficient.

## Self-check

1. Rank remains two; the duplicated features share an effect that is not uniquely attributable. 2. Rank three, squared error one, retained energy `73/74`. 3. PCA follows variance rather than labels; scaling changes the geometry but does not make PCA supervised. 4. Ill conditioning can amplify coefficient variation, while similar fitted predictions remain possible. The report should distinguish those quantities and state the numerical tolerance used to estimate rank.

## Primary reading

- [MIT 18.06SC: Singular Value Decomposition](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/positive-definite-matrices-and-applications/singular-value-decomposition/): study the geometry of the factorization rather than memorizing a decomposition recipe.
- [NumPy: `linalg.lstsq`](https://numpy.org/doc/stable/reference/generated/numpy.linalg.lstsq.html): inspect the return-value and rank-cutoff definitions before interpreting solver output.
