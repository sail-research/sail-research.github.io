# Privacy: membership risk, differential privacy and the meaning of a guarantee

**Core time:** 2 hours. **Prerequisites:** probability, expectations and training workflows. **Outcomes:** distinguish access controls from statistical privacy; define neighboring datasets; calculate sensitivity for a bounded statistic; explain composition and the ingredients of DP-SGD without inventing an epsilon guarantee.

## 1. Identify what an observer can learn

Keeping raw data on one machine reduces some exposure paths but does not prove that a released model reveals nothing about it. Model outputs, gradients, checkpoints and logs can carry information. A membership-inference question asks whether a particular record was included in training. Reconstruction asks a different question about recovering information. State the observer's access and auxiliary knowledge before evaluating either.

A weak empirical attack can fail even when information exists. Low membership-attack accuracy under one setup is therefore not a formal privacy guarantee. Conversely, a successful bounded test demonstrates a vulnerability under its assumptions, not a complete characterization of every privacy risk.

## 2. Differential privacy compares neighboring datasets

A randomized mechanism is approximately differentially private if its output probabilities are close for every pair of neighboring datasets and every output event, according to the definition below. Neighbors must be defined: add/remove one record, replace one record or add/remove one user's entire contribution are different choices.

```math
\Pr[M(D)\in S]\le e^\epsilon\Pr[M(D')\in S]+\delta.
```

Epsilon controls a multiplicative bound and delta an additive allowance. Smaller values generally correspond to a stronger guarantee under a fixed definition, but numbers from different adjacency units and accounting assumptions are not directly comparable. Delta is not simply “the probability one person's data are leaked.” The guarantee concerns distributions of outputs and a stated neighboring relation.

## 3. Worked example: a bounded mean

Assume exactly n=100 values in `[0,1]` and replace-one adjacency. Replacing one record changes their mean by at most 1/100, so its global L1 sensitivity is 0.01. The Laplace mechanism adds noise with scale `sensitivity/epsilon`; at epsilon 0.5 this is 0.02. The mathematical guarantee requires the stated bounds, adjacency and correctly sampled noise. If the data are not bounded, the sensitivity argument fails.

```python
import numpy as np
n,epsilon = 100,0.5
values = np.linspace(0,1,n)
sensitivity = 1/n
rng = np.random.default_rng(7)
noise = rng.laplace(0,sensitivity/epsilon,size=5000)
print({'true_mean_for_teaching':values.mean(),
       'noise_scale':sensitivity/epsilon,
       'noise_sample_std':noise.std(ddof=1)})
```

This code demonstrates a noise distribution on public synthetic values. It deliberately uses a reproducible seed for teaching and prints the true mean. It is **not a private release mechanism** for confidential data. Publishing the randomness or original sensitive answer can defeat the intended protection; production randomness, release control and accounting require an appropriate implementation.

## 4. Composition prevents unlimited free queries

Repeated releases consume privacy budget. Under basic sequential composition, releases with epsilons epsilon1 and epsilon2 can be bounded by their sum, with the corresponding delta sum for approximate DP. More advanced accountants can provide tighter bounds under their assumptions. Releasing many noisy answers and averaging them reduces noise and changes the privacy analysis; one query's epsilon cannot be reused as the claim for the whole history.

Post-processing a genuinely private output without additional sensitive access does not worsen that mechanism's guarantee. This does not mean that arbitrary preprocessing is private. Data-dependent clipping thresholds, model selection, hyperparameter tuning and extra statistics may themselves require accounting if they depend on protected data.

## 5. DP-SGD has several necessary parts

The usual conceptual recipe computes per-example gradients, clips each to a norm bound, aggregates them, adds calibrated noise and updates parameters. An accountant combines sampling assumptions, noise multiplier, clipping convention, number of steps and adjacency into a reported bound. Clipping the already averaged batch gradient is not the same operation as clipping each example. User-level privacy needs a user-level contribution definition, not merely a record-level accountant with a new label.

Our introductory lab checks the clipping arithmetic and demonstrates noise on synthetic data; it does not implement or advertise certified DP-SGD. For an extension, use a maintained privacy library, inspect its current documentation and report the accountant configuration. Never label a model “epsilon-private” because Gaussian noise was added somewhere in the loop.

## Exercises and self-check

1. For fixed n=50 values in `[0,10]` with replace-one adjacency, calculate mean sensitivity. **Check:** 10/50=0.2.
2. Two pure-DP releases use epsilons 0.3 and 0.7 on the same protected population. Give the basic composition bound. **Check:** epsilon 1.0, with the same adjacency assumptions.
3. Why does federated learning alone not imply DP? **Check:** locality is not a bound on how released updates/outputs change between neighboring datasets.
4. Explain why a fixed published random seed is inappropriate for claiming a confidential randomized release, even though it is useful for this public-data demonstration.

## Primary reading

- [Dwork and Roth: The Algorithmic Foundations of Differential Privacy](https://www.cis.upenn.edu/~aaroth/privacybook.html): consult definitions, sensitivity, Laplace noise and composition.
- [Abadi et al.: Deep Learning with Differential Privacy](https://arxiv.org/abs/1607.00133): identify per-example clipping, noise and privacy accounting; separate these ingredients from the toy illustration.
