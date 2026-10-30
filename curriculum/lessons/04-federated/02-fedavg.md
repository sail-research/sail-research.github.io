# FedAvg: implement and verify a complete round

**Core time:** 2 hours. **Prerequisites:** global/local objectives and gradient descent. **Outcomes:** implement client initialization, local updates and weighted aggregation; distinguish parameters from deltas; test aggregation on an exact numerical case.

## 1. Every selected client starts from the round model

At round t, the server holds w_t. Each selected client receives a copy, performs local optimization on its own training data and returns its updated parameters or an explicitly defined delta. Clients must not accidentally train on a shared mutable array: if client two starts from client one's completed state, the implementation becomes sequential training rather than parallel-from-a-common-start FedAvg.

If clients return parameters, aggregate their returned models with normalized nonnegative weights. If they return deltas `delta_k=w_k-w_t`, average those deltas and add the result to w_t. The two forms are algebraically equivalent when all clients share the same starting point and weights sum to one. Mixing returned parameters and deltas can double-count the server model.

```math
w_{t+1}=\sum_{k\in S_t}\frac{n_k}{\sum_{j\in S_t}n_j}w_{t+1}^{(k)}
=w_t+\sum_{k\in S_t}\frac{n_k}{\sum_{j\in S_t}n_j}\Delta_k.
```

The normalization shown is over participating clients. Under partial/nonuniform participation, this does not automatically yield an unbiased estimate of every desired full-population objective. Sampling and weighting assumptions must be analyzed together.

## 2. Worked example with unequal client sizes

The server starts at `[1,1]`. A client with 3 examples returns `[2,0]`; a client with 1 example returns `[0,4]`. Weighted averaging gives `0.75*[2,0]+0.25*[0,4]=[1.5,1]`. The deltas are `[1,-1]` and `[-1,3]`; their weighted mean is `[0.5,0]`, giving the same final server vector. The equal-client average `[1,2]` corresponds to a different weighting policy.

```python
import numpy as np
server = np.array([1.,1.])
client_models = np.array([[2.,0.],[0.,4.]])
sizes = np.array([3,1])
weights = sizes/sizes.sum()
parameter_average = weights@client_models
delta_average = server + weights@(client_models-server)
np.testing.assert_allclose(parameter_average,[1.5,1.])
np.testing.assert_allclose(parameter_average,delta_average)
assert np.isclose(weights.sum(),1)
print(parameter_average)
```

This check should run before training any benchmark. Also test identical client models, a single participating client and rejection of empty client sets or nonpositive total weight.

## 3. One local step connects to centralized gradients

With full participation, a shared initial model, one full-batch local gradient step, common learning rate and example-count weighting, the aggregate update equals one gradient step on the pooled empirical objective. This is a useful invariant for a simulator. It stops holding in that simple form after multiple local steps because each client evaluates later gradients at its own diverging parameters.

For a binary logistic model, each client gradient is `X_k.T@(sigmoid(X_k@w)-y_k)/n_k`. Add a constant-one feature to represent bias. Be explicit about any regularization and whether it applies to bias. The teaching simulator uses no penalty in the basic objective so the weighted-gradient equivalence is easy to verify.

## 4. Local work and optimizer state are algorithm choices

The original family of FedAvg procedures is often described using local epochs/minibatches. Our introductory simulator uses a fixed number of full local gradient steps. This is an intentionally simple variant, not a numerical reproduction of the original deep-network experiments. Documenting that difference is part of correct scholarship.

Momentum or adaptive optimizer state may be reset each round or retained locally; those choices alter the algorithm. Batch-normalization buffers and other non-parameter state also require an aggregation policy in neural models. Averaging every dictionary entry without checking dtype and meaning can corrupt counters or statistics. The logistic lab avoids these additional states so you can focus on the core update.

## 5. Guided implementation

Run `python lab05_federated.py --output outputs/federated`. Inspect the exact aggregation check and one-step equivalence check. Trace one client round by hand: starting model, local gradient, updated model, sample weight and server result. Confirm client index sets are nonempty, disjoint and cover the intended training pool. Keep validation/test data out of local optimization.

## Exercises and self-check

1. Three clients return scalar models 1,3,5 with counts 2,1,1. Compute the server result. **Check:** 2.5.
2. Show algebraically why normalized parameter and delta averaging agree.
3. A simulator initializes each client with `local=server` and updates in place. What can go wrong? **Check:** shared memory can alter the server and subsequent clients; create a copy.
4. Design a one-step equivalence test using independently computed pooled gradients. Explain why testing only identical client data is weak.

## Primary reading

- [McMahan et al.: FedAvg](https://proceedings.mlr.press/v54/mcmahan17a.html): inspect Algorithm 1 and distinguish local epochs, batch size and participation from our simplified full-gradient laboratory.
