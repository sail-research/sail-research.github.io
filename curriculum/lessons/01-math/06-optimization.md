# Optimization: curvature, stochastic gradients and adaptive steps

**Core time:** 120 minutes. **Prerequisites:** gradients, expectations and matrix rank. **Outcomes:** analyze gradient descent on a quadratic; distinguish an objective from an optimizer; explain minibatch noise; compare momentum and Adam without claiming universal superiority.

## 1. Separate the destination from the route

An objective specifies what is minimized. An optimizer specifies how parameters are updated. Regularization changes the objective or update rule; learning-rate scheduling changes the route taken. A validation metric may differ from the training objective. A decrease in training cross-entropy does not guarantee an improvement in every fairness metric, every class recall or deployment latency.

For differentiable `f(w)`, gradient descent updates `w` by subtracting a positive learning rate times the gradient. A first-order approximation predicts a decrease proportional to the squared gradient norm, but it ignores curvature. If curvature is large, the approximation is valid only over a smaller step. This is why “the gradient points downhill” does not justify an arbitrary learning rate.

```math
w_{t+1}=w_t-\eta\nabla f(w_t).
```

Convexity means every line segment between two domain points lies above the function graph in the appropriate inequality. A differentiable convex function has no strictly worse local minimum than its global minima. Strict or strong convexity adds stronger uniqueness or curvature properties. A neural network's parameter objective is generally nonconvex; successful optimization does not establish global optimality.

## 2. Worked example: see instability before running a network

Take `f(w)=2w²`, gradient `4w`, and start at w=1. The update is `w_next=(1-4*eta)*w`. Convergence to zero requires the magnitude of this multiplier to be below one, giving `0<eta<0.5`. With eta=0.1, successive values are 1, 0.6, 0.36 and 0.216. With eta=0.6, they are 1, -1.4, 1.96 and -2.744; alternating signs do not prevent divergence.

For a positive-definite quadratic with Hessian H, each eigen-direction behaves similarly. A sufficient fixed-step range is `0<eta<2/lambda_max(H)`. A large ratio between largest and smallest eigenvalues produces narrow directions that restrict the step while broad directions converge slowly. Feature scaling can improve this conditioning. It does not remove all challenges of a nonconvex network.

```python
import numpy as np
def trajectory(eta, steps=8):
    w = 1.0
    values = [w]
    for _ in range(steps):
        w -= eta * 4*w
        values.append(w)
    return np.array(values)
assert abs(trajectory(0.1)[-1]) < 0.02
assert abs(trajectory(0.6)[-1]) > 1
print(trajectory(0.1))
print(trajectory(0.6))
```

## 3. A minibatch gradient estimates a full-data gradient

If examples are sampled uniformly and the per-example gradients are averaged, the minibatch gradient is an unbiased estimator of the empirical full-data gradient under the sampling assumptions. This is a statement about the empirical objective, not a guarantee about the population objective. Biased sampling, incorrectly weighted losses or stateful transformations can change the relationship.

Larger batches often reduce gradient noise but require more memory and change the number of updates per epoch. Comparing two batch sizes at equal epochs does not equalize update count. Comparing at equal steps does not equalize examples processed. State the budget: examples, optimizer updates, wall-clock time or energy. An experiment cannot claim these are all held fixed unless they actually are.

Shuffling without replacement is common but is not identical to drawing independent samples with replacement. For a short teaching run this distinction may have modest practical consequences; in a theoretical claim, the sampling convention is part of the assumptions. Never turn a convenient approximation into an unstated theorem.

## 4. Momentum and Adam change how history is used

One momentum convention forms a velocity `v=beta*v+g` and updates `w-=eta*v`. Another uses `(1-beta)*g`, changing the scaling. Check the exact library convention before matching a paper's hyperparameters. Momentum can smooth oscillations but can also overshoot after an abrupt change.

Adam tracks exponential averages of gradients and squared gradients, corrects their initial bias, and divides the first-moment estimate by a square root of the second-moment estimate plus epsilon. The denominator is coordinatewise; it is not the full inverse Hessian. Epsilon prevents problematic division and affects behavior near very small values. Adam is not a proof of convergence for any arbitrary loss or learning rate.

```math
m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,\quad
v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2,\qquad
w_{t+1}=w_t-\eta\frac{m_t/(1-\beta_1^t)}{\sqrt{v_t/(1-\beta_2^t)}+\epsilon}.
```

L2 regularization and decoupled weight decay are not generally equivalent under adaptive optimizers. Record whether you used Adam, AdamW or another implementation, and which parameters receive decay. Biases and normalization parameters are often treated differently; if so, describe it rather than relying on an unstated convention.

## 5. Practical debugging sequence

First verify finite inputs, labels, loss and gradients. Next overfit a tiny batch using a simple model. Inspect whether gradients are absent, identically zero or extremely large. Check that gradients are cleared at the intended time, that the optimizer updates the model's actual parameters and that evaluation runs in evaluation mode. Only then compare optimizers or elaborate schedules. Gradient clipping limits a chosen norm; it does not repair a sign error, target leakage or a detached computation graph.

## Exercises and self-check

1. Analyze `f(w)=5w²/2`. What learning-rate interval converges? **Check:** gradient 5w; `0<eta<0.4`.
2. Two runs use batch sizes 32 and 128 for ten epochs on 1,024 examples. Count updates assuming no remainder. **Check:** 320 versus 80; this is not an equal-update comparison.
3. Why can a noisy training curve still reflect useful learning? **Check:** minibatch losses vary with sampled examples; inspect a consistently evaluated full validation metric and smoothed training diagnostics without hiding raw data.
4. Implement gradient descent for a diagonal quadratic with eigenvalues 1 and 100. Compare trajectories before and after a variable rescaling. Report the learning rate and stopping rule; do not only plot the easier case.

Run `lab01_math.py` for stable and unstable quadratic trajectories. The full assignment asks you to connect these observations to a checked gradient and a declared numerical tolerance.

## Primary reading

- [Boyd and Vandenberghe: Convex Optimization](https://web.stanford.edu/~boyd/cvxbook/): consult convexity and unconstrained minimization; distinguish their assumptions from neural-network training.
- [Kingma and Ba: Adam](https://arxiv.org/abs/1412.6980): read the update definition and bias correction, then compare it with your implementation.
- [PyTorch: AdamW](https://docs.pytorch.org/docs/2.9/generated/torch.optim.AdamW.html): inspect decay semantics and defaults before configuring experiments.
