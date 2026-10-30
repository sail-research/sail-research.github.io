# FedProx, local drift and personalization

**Core time:** 120 minutes. **Prerequisites:** FedAvg, gradients and non-IID partitions. **Outcomes:** derive a proximal local gradient; test the zero-penalty equivalence; distinguish a shared global model from personalized models; design adaptation without test leakage.

## 1. A proximal term anchors local optimization

FedProx modifies a client's local objective by penalizing distance from the current round's server model. The reference is fixed during that client's local work. The proximal gradient is proportional to the difference between the current local parameters and the reference, not to the local parameters alone. Confusing this with ordinary L2 regularization changes the method.

```math
\min_w F_k(w)+\frac\mu2\|w-w_t\|_2^2,
\qquad g_k^{prox}(w)=\nabla F_k(w)+\mu(w-w_t).
```

At the beginning of a round, local w equals w_t, so the proximal contribution is zero. Later it pulls the local trajectory toward the reference. Mu controls the strength. A large mu can limit useful adaptation; a smaller drift is not automatically a better predictive model. Select mu on validation under a documented search budget.

## 2. Worked gradient and an invariant

Suppose the local loss gradient is `[0.3,-0.2]`, local parameters are `[1.2,0.8]`, server reference is `[1,1]` and mu=0.5. The proximal contribution is `[0.1,-0.1]`, so the complete gradient is `[0.4,-0.3]`. With mu=0 and otherwise identical implementation, the local update should match the FedAvg local update.

```python
import numpy as np
local = np.array([1.2,.8])
reference = np.array([1.,1.])
gradient = np.array([.3,-.2])
proximal_gradient = gradient + .5*(local-reference)
np.testing.assert_allclose(proximal_gradient,[.4,-.3])
np.testing.assert_allclose(gradient+0*(local-reference),gradient)
print(proximal_gradient)
```

The lab implements this objective with fixed full local gradient steps. That is a transparent teaching simplification; the published FedProx framework addresses broader heterogeneous-work conditions. Do not describe the small simulator as a complete reproduction of the paper's systems experiments.

## 3. Personalization changes the output of training

A shared model produces one parameter vector for all clients. Personalization may fine-tune local copies, learn client-specific heads, combine shared and local parameters or optimize a meta-learning objective. These are different methods with different storage, communication and adaptation costs. “Personalized” is not an explanation of which parameters differ or how they were selected.

A straightforward extension initializes each client from the global model and fine-tunes on that client's adaptation data. It needs a separate local validation policy and an untouched local test set. If the client has very little data, local fine-tuning can overfit. Compare global-only, local-only and personalized references when relevant; otherwise an apparent benefit may simply come from giving one method extra training data or work.

## 4. Evaluate both average benefit and who loses

Report per-client before/after metrics with supports, an example-weighted aggregate, an equal-client average and a clearly defined lower-tail or worst-client summary. Count how many clients improve or worsen. A positive mean improvement can conceal substantial deterioration for a subset. If clients have different objectives, explain whether the same metric is meaningful across all of them.

Use the same adaptation budget for compared personalization methods or state the difference. A new-client evaluation requires clients not used to develop the shared initialization or select adaptation hyperparameters. Reusing their final test outcomes to choose the number of local steps is leakage.

## Guided lab and exercises

Run the FedAvg and FedProx configurations in `lab05_federated.py`. Inspect local delta norms, validation curves and payload accounting. The default mu is a fixed teaching configuration, not a tuned optimum.

1. Verify exact FedAvg equivalence when mu=0 with identical partitions and starting weights.
2. Explain why the proximal term has no effect on the first local gradient step from the reference. **Check:** `w-w_t=0` initially.
3. Design a three-way global/local/personalized comparison with distinct adaptation and test data.
4. A larger mu reduces update norms but lowers accuracy. Is the implementation necessarily wrong? **Check:** no; restricting movement can trade off optimization progress and drift.

## Primary reading

- [Li et al.: Federated Optimization in Heterogeneous Networks](https://proceedings.mlsys.org/paper_files/paper/2020/hash/1f5fe83998a09396ebe6477d9475ba0c-Abstract.html): inspect the proximal objective and assumptions; identify differences from the simplified lab.
