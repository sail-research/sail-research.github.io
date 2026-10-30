# Distributed and federated learning: objectives before architecture

**Core time:** 100 minutes. **Prerequisites:** supervised objectives and gradient descent. **Outcomes:** distinguish centralized, distributed and federated training; define an example-weighted objective; identify statistical/system heterogeneity; separate a local simulation from a deployment.

## 1. Distribution describes more than where code runs

Centralized training places the training data under one logical training process. Data-parallel distributed training commonly divides minibatches across workers and synchronizes gradients under coordinated infrastructure. Federated learning organizes training across clients whose data remain locally held and whose availability, data distributions and resources may differ. Cross-silo settings involve a relatively small set of organizations; cross-device settings may involve many intermittently participating devices. These are useful categories, not strict guarantees about trust or infrastructure.

Federation is not inherently private, secure or fair. Updates can reveal information; some clients can dominate an objective; network participants can be malicious. Keeping raw records local changes the data flow, but the protocol still needs an explicit threat and governance model.

## 2. State whose loss is being minimized

Let client k hold n_k examples and have average local loss F_k. A common global objective weights each local average by its fraction of all examples. An equal-client objective uses weight 1/K instead. The first gives equal weight to examples; the second gives equal weight to clients. Neither is automatically the right policy for every application.

```math
F(w)=\sum_{k=1}^{K}p_kF_k(w),\qquad
F_k(w)=\frac1{n_k}\sum_{i=1}^{n_k}\ell(w;x_{ki},y_{ki}),\qquad
p_k=\frac{n_k}{\sum_j n_j}.
```

Worked example: two clients contain 90 and 10 examples, with local mean losses 0.2 and 1.0. The example-weighted global loss is `0.9*0.2+0.1*1=0.28`; the equal-client mean is 0.6. Reporting only 0.28 hides the smaller client's poor performance. Report both when client equity is relevant and explain which objective trained the model.

```python
import numpy as np
n = np.array([90,10])
local_loss = np.array([.2,1.])
weighted = np.average(local_loss,weights=n)
macro = local_loss.mean()
assert np.isclose(weighted,.28)
assert np.isclose(macro,.6)
print(weighted,macro)
```

## 3. Synchronous rounds define a coordination policy

A basic round broadcasts the current model, selects available clients, performs local optimization and aggregates returned updates. The server's round counter is not an epoch counter: clients may take different numbers of steps over different data sizes. Specify whether local work means minibatches, full local epochs or a fixed number of gradient steps.

Synchronous training waits for the chosen participation policy to complete. Stragglers can increase wall-clock duration. Dropping slow clients can bias participation toward particular resources or populations. Asynchronous schemes introduce staleness and a different aggregation process. A single-process simulation can study algorithms and data heterogeneity, but does not measure real network delay, failures or cryptographic overhead.

## 4. Heterogeneity has several axes

Statistical heterogeneity concerns differences in local data distributions, class proportions, sample counts or feature/label relationships. System heterogeneity concerns compute, memory, bandwidth, power and availability. Objective heterogeneity concerns clients needing different models or utility tradeoffs. A benchmark that varies only class proportions does not cover all three.

Before selecting an algorithm, define the intended evaluation population: future observations from current clients, entirely new clients, or a pooled population. These require different splits and metrics. A high pooled score can coexist with poor worst-client performance. New-client generalization cannot be claimed from a test set containing only already participating clients.

## 5. Laboratory scope

The federation lab uses a compact synthetic binary problem and a logistic model with five coefficients including bias. It runs clients sequentially in one CPU process so that aggregation, partitioning and budget accounting are inspectable. It compares a pooled reference, IID FedAvg, non-IID FedAvg and a specified FedProx variant. Communication is calculated from the stated payload format; it is not measured network traffic.

## Exercises and self-check

1. Two clients have 20 and 80 examples and accuracies 0.9 and 0.6. Compute example-weighted and equal-client accuracy. **Check:** 0.66 and 0.75.
2. Explain why ten rounds with five local steps are not equivalent to fifty rounds with one local step. **Check:** aggregation frequency and client drift differ even when a rough local-step count matches.
3. List one statistical, one system and one governance assumption a simulator does not test.
4. Write a deployment question that requires holding out entire clients and another that requires holding out examples within clients.

## Primary reading

- [McMahan et al.: Communication-Efficient Learning of Deep Networks from Decentralized Data](https://proceedings.mlr.press/v54/mcmahan17a.html): identify the iterative model-averaging protocol and its experimental scope.
- [Li et al.: Federated Optimization in Heterogeneous Networks](https://proceedings.mlsys.org/paper_files/paper/2020/hash/1f5fe83998a09396ebe6477d9475ba0c-Abstract.html): separate statistical and system heterogeneity.
