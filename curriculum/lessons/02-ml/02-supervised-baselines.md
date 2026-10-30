# Supervised baselines, losses and regularization

**Core time:** 120 minutes. **Prerequisites:** likelihood, gradients and data splitting. **Outcomes:** relate losses to modeling assumptions; derive logistic gradients; select regularization with validation data; interpret a baseline beyond headline accuracy.

## 1. A model family encodes a restriction

Linear regression predicts a real-valued response with an affine function. Logistic regression applies a sigmoid to an affine score to model a binary class probability. Despite its name, it is a classification model. A multiclass linear classifier produces one logit per class and uses softmax. These models cannot represent every nonlinear boundary in raw inputs; feature engineering changes the space in which the decision is linear.

A supervised objective averages a per-example loss and may add regularization. Squared error emphasizes large residuals and corresponds to a Gaussian-noise likelihood under particular assumptions. Cross-entropy corresponds to a categorical/Bernoulli conditional likelihood. The loss is a surrogate for the eventual decision metric; a lower loss need not change predicted labels or improve every thresholded metric.

## 2. Derive binary logistic regression

For a scalar score z, sigmoid produces probability p. Binary cross-entropy penalizes assigning low probability to the observed label. Combining its derivative with the sigmoid derivative simplifies the derivative with respect to the logit to `p-y`.

```math
p_i=\sigma(x_i^\top w+b),\quad
L=-\frac1n\sum_i[y_i\log p_i+(1-y_i)\log(1-p_i)],\quad
\nabla_wL=\frac1nX^\top(p-y).
```

For `x=[1,2]`, `w=[0,0]`, `b=0` and `y=1`, p is 0.5 and the one-example weight gradient is `[-0.5,-1]`. A descent step increases both weights, increasing the logit and moving toward the positive label. If y were zero, the gradient reverses. This sign check catches an implementation error before a large training run.

## 3. Stable losses work directly with logits

Extreme logits can make an explicitly computed sigmoid round to one or zero. A stable binary loss uses `logaddexp(0,z)-y*z` instead of taking logs of rounded probabilities. For multiclass problems, use stable log-sum-exp. Framework functions designed for logits implement these calculations; inspect the target type and reduction convention.

```python
import numpy as np
X = np.array([[1.,2.],[-1.,-2.]])
y = np.array([1.,0.])
w = np.zeros(2)
for _ in range(100):
    logits = X@w
    p = 1/(1+np.exp(-np.clip(logits,-50,50)))
    gradient = X.T@(p-y)/len(y) + 0.1*w
    w -= 0.1*gradient
loss = np.mean(np.logaddexp(0,X@w)-y*(X@w)) + 0.05*(w@w)
assert loss < np.log(2)
print(w,loss)
```

This tiny separable dataset verifies update direction and numerical behavior, not generalization. The L2 term prevents weights from growing indefinitely merely to make perfectly separated training probabilities more extreme. Clipping in the educational sigmoid protects the exponential; a production implementation should use a numerically stable library operation.

## 4. Regularization changes the preferred solution

L2 discourages large coefficients. L1 can produce exact zeros under suitable optimization. Neither penalty is automatically fair across differently scaled features: standardization changes the meaning of coefficient magnitude. Put scaling inside the fitted pipeline and document it. In scikit-learn logistic regression, C is inverse regularization strength; smaller C generally means stronger regularization. It is not the lambda multiplying a penalty in the derivation above.

A learning curve compares training and validation behavior as data quantity or optimization changes. Poor training quality might reflect insufficient expressiveness, excessive regularization, unsuccessful optimization or a bug. Strong training and weak validation quality might reflect overfitting or distribution mismatch. These patterns motivate diagnoses; they do not uniquely identify the cause.

## 5. A controlled selection protocol

Predeclare a grid such as `C in [0.01,0.1,1,10]`. Fit candidates on training data, compare the same validation metric and use a stated tie rule. Freeze the winner and evaluate test once. Record all validation candidates, including weak ones. If retraining on train plus validation, explain that additional step and keep test untouched; the teaching baseline keeps the original training fit to make the selection chain transparent.

Run `lab02_baselines.py`. Compare the majority baseline with the selected linear model and inspect classwise recall and the confusion matrix. Scores are measurements to be produced by your run, not targets to copy from a lesson. A method that fails to beat the linear baseline can still teach you that a more complex architecture was unnecessary at this scale.

## Exercises and self-check

1. Derive the bias gradient. **Check:** the average of `p-y`.
2. Why can stronger regularization improve validation while worsening empirical fit? **Check:** it can reduce variance or complexity, but an improvement is not guaranteed.
3. Build a nonlinear synthetic problem and compare raw linear features with a polynomial expansion under the same split. Select the expansion on validation and report the search.
4. A report says “C=10 gave the best test score.” **Check:** test selected C and is no longer an untouched evaluation; use validation or nested evaluation.

## Primary reading

- [scikit-learn: logistic regression](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression): inspect objective conventions, solver compatibility and penalties.
- [PyTorch: BCEWithLogitsLoss](https://docs.pytorch.org/docs/2.9/generated/torch.nn.BCEWithLogitsLoss.html): compare a stable combined loss with an explicit sigmoid/logarithm calculation.
