# Adversarial robustness: gradients, constraints and measured failure

**Core time:** 2–3 hours. **Prerequisites:** gradients, norm budgets and a trained classifier. **Outcomes:** derive an FGSM step; implement projected iterative evaluation on your own model; verify perturbation constraints; distinguish empirical attack accuracy from certified robustness.

## 1. Turn the threat model into an optimization problem

For an untargeted inference-time attack, seek a permitted perturbation that increases the loss on the true label. The model is frozen. In this course the input domain is `[0,1]` and the permitted L-infinity displacement is at most epsilon. Both constraints matter: a point inside the norm ball can still be outside the legal input range.

```math
\max_{\delta}\;\ell(f_\theta(x+\delta),y)
\quad\text{subject to}\quad\|\delta\|_\infty\le\epsilon,\;x+\delta\in[0,1]^d.
```

The linear approximation to loss is `loss(x)+gradient.T@delta`. Under an L-infinity budget, each coordinate maximizes its contribution by taking epsilon times the gradient sign. This gives the fast gradient sign method. It is a local first-order construction; it does not solve every nonlinear constrained maximization exactly.

## 2. Worked example: a bounded update

For `x=[0.2,0.9]`, input gradient `[3,-2]` and epsilon 0.15, the sign step gives `[0.35,0.75]`, within the legal range and exactly 0.15 away in each changed coordinate. If the first input were 0.95 and its gradient positive, clipping would produce 1.0, a displacement of only 0.05. The actual perturbation norm can be smaller than the requested maximum because of domain boundaries.

```python
import torch
x = torch.tensor([[.2,.9]])
gradient = torch.tensor([[3.,-2.]])
epsilon = .15
adv = (x + epsilon*gradient.sign()).clamp(0,1)
assert (adv-x).abs().max() <= epsilon+1e-7
torch.testing.assert_close(adv,torch.tensor([[.35,.75]]))
print(adv)
```

For a real model, create an input tensor requiring gradients, compute loss and request its input gradient. Keep the model in evaluation mode. Do not wrap the attack construction in `no_grad`, and do not update model parameters during evaluation.

## 3. Iteration needs projection and a fixed reference input

Projected gradient descent repeatedly takes a gradient-ascent step, then clips the candidate to the original input's epsilon box and legal range. Projecting around the previous iterate instead would allow the total displacement to grow across steps. A random start samples a permitted initial point; multiple restarts can find different failures. Record step count, step size, restart count, random seed and whether the attack is targeted.

The bundled robustness lab implements these checks explicitly on the learner's own digit classifier. It includes the clean input as a candidate and tracks per-example failure across candidates. This is important: selecting a high-loss candidate alone is not identical to selecting any successful misclassification. Report the actual success rule.

## 4. Metrics need an eligible population

Clean accuracy counts correct unmodified predictions over all test examples. Accuracy on one attack's returned adversarial examples is an empirical measurement for that procedure. Worst-case robust accuracy over an entire allowed set is generally lower or equal to the accuracy under a particular attack, because the attack may miss a failing point. An empirical attack therefore does not certify robustness.

For attack success conditioned on initially correct examples, divide by the number of clean-correct examples. If this denominator is zero, report undefined. For an overall robust-correct indicator, require clean correctness and survival of every tested attack candidate. Show both the original test count and the conditioned denominator, so clean errors are not accidentally hidden.

## 5. Failure checks before interpreting a curve

At epsilon zero, the attacked input should equal the original. Increasing the tested candidate set cannot improve a per-example worst-case survival indicator when previous candidates are retained. However, two independently optimized attacks at different epsilons can produce nonmonotonic empirical curves because optimization is imperfect. Do not smooth away this evidence; investigate attack strength, random starts and implementation.

Gradient masking can make a gradient-based attack look weak without making a defense robust. A nondifferentiable or stochastic defense requires an evaluation suited to that behavior; a failed naive attack is not proof. In this introductory lab we use a simple differentiable model and avoid claiming an exhaustive defense evaluation.

## Guided lab and exercises

Run `python lab04_trust.py --output outputs/trust`. Inspect clean accuracy, epsilon-zero identity, L-infinity bounds and conditioned success counts. Then:

1. Change the input scaling from `[0,1]` to `[0,16]` and explain how the same physical perturbation budget should change. **Check:** multiply the numeric budget by 16; otherwise the threat changes.
2. Explain the sign reversal for a targeted loss minimizing the target-class cross-entropy. **Check:** targeted optimization uses descent on target loss, unlike untargeted ascent on true-label loss.
3. Compare one-step and iterative procedures under the same allowed set. Report stronger failure if found, not a universal ranking.
4. Why is “90% accuracy after FGSM” not “90% certified robust accuracy”? **Check:** FGSM explores only a particular construction inside the full threat set.

## Primary reading

- [Goodfellow, Shlens and Szegedy: Explaining and Harnessing Adversarial Examples](https://arxiv.org/abs/1412.6572): read the linearized sign-step argument.
- [Madry et al.: Towards Deep Learning Models Resistant to Adversarial Attacks](https://arxiv.org/abs/1706.06083): identify the constrained inner maximization and the empirical evaluation assumptions.
- [PyTorch: FGSM tutorial](https://docs.pytorch.org/tutorials/beginner/fgsm_tutorial.html): inspect input-gradient handling, while keeping this course's denominators explicit.
