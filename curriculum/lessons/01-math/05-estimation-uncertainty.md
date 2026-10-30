# Estimation, uncertainty and honest comparisons

**Core time:** 120 minutes. **Prerequisites:** expectation, variance and conditional probability. **Outcomes:** identify an estimand and unit of analysis; separate sampling variability from training variability; compute a paired comparison; interpret an interval without turning it into a probability claim about a fixed parameter.

## 1. State what you want to estimate

“Model quality” is too vague to estimate. A more precise estimand is the expected accuracy of a fixed trained model on future independent observations from a specified population. Another is the expected performance of an entire training procedure, averaged over new training samples and random initialization. A third is the average per-client performance in a federation. These are different quantities, even when each is reported as a percentage.

The observed average is an estimator, and the particular value computed from one dataset is an estimate. Bias concerns the estimator's expectation across repeated samples; variance concerns its spread. A smaller standard error does not repair selection bias, measurement error or a mismatch between the evaluation population and deployment. More duplicated observations do not supply the same information as more independent subjects.

## 2. The unit of independence determines the uncertainty calculation

Suppose ten measurements are collected from each of twenty devices. There are 200 rows but only twenty independently sampled devices. Resampling rows as if all 200 were independent can produce overly narrow intervals. If the target is performance on new devices, keep device groups intact during splitting and resample devices for uncertainty analysis. In time series, neighboring observations may be dependent; an appropriate block or time-aware method requires assumptions about the process.

For independent Bernoulli correctness indicators with a fixed classifier, an approximate standard error for accuracy is `sqrt(p_hat*(1-p_hat)/n)`. At 90 correct out of 100, that is 0.03. The familiar normal approximation gives roughly 0.90 ± 0.0588. This approximation can be poor for small n or extreme proportions; use a justified binomial interval such as Wilson's when appropriate. Do not silently reuse this formula for correlated client records or for a model chosen by repeatedly inspecting the same test set.

## 3. Compare models on paired observations

When two fixed classifiers predict the same examples, their errors are related. Form a difference in correctness for each example: +1 if only B is correct, -1 if only A is correct, and 0 if they agree in correctness. The mean difference is B's accuracy minus A's. Resample paired indices so that each example's two predictions stay together. Separately resampling the models destroys pairing and answers a different question.

Imagine 100 examples: both models are correct on 80, only A on 5, only B on 10, and both wrong on 5. A has accuracy 0.85 and B 0.90. Only 15 examples distinguish them; the observed five-point improvement should not be interpreted as certain superiority on all future data. An interval around the paired difference communicates finite-sample uncertainty under the resampling assumptions.

```python
import numpy as np
a = np.array([1]*80 + [1]*5 + [0]*10 + [0]*5)
b = np.array([1]*80 + [0]*5 + [1]*10 + [0]*5)
d = b - a
rng = np.random.default_rng(17)
indices = rng.integers(0, len(d), size=(5000, len(d)))
bootstrap_differences = d[indices].mean(axis=1)
lo, hi = np.quantile(bootstrap_differences, [0.025, 0.975])
np.testing.assert_allclose(d.mean(), 0.05)
print({"difference": d.mean(), "percentile_interval": [lo, hi]})
```

This percentile bootstrap is an accessible teaching method, not a universal optimal interval. State the number of resamples, random seed, resampling unit and interval construction. Do not treat a rounded boundary near zero as a verdict that the models are identical or different in every practical sense.

## 4. Training seeds answer another question

Training the same architecture with seeds 1, 2 and 3 probes variation from the stochastic training process conditional on the chosen data split. It does not create three independent test datasets. Report per-seed results as well as mean and standard deviation. Three seeds can reveal gross instability, but do not support a precise estimate of the full performance distribution. If algorithms share split and seed schedules, analyze paired per-run differences while explaining what aspects are genuinely matched.

Repeatedly trying models until one exceeds a target on the test set turns that set into development data. Even if every individual confidence interval is calculated correctly, selection can invalidate a naive interpretation of the winning result. Use a validation set for exploration, freeze the decision rule, and evaluate the reserved test set once for the final report. If you must revisit it, disclose the reuse and seek a new independent holdout rather than pretending it remained untouched.

## 5. Interpretation belongs beside the interval

A frequentist 95% confidence procedure has a coverage property across repeated samples under its assumptions. For a realized interval and a fixed parameter, “there is a 95% probability that the parameter is in this interval” is not its standard interpretation. A Bayesian credible interval is a different object based on an explicit prior and likelihood. Neither interpretation licenses ignoring distribution shift.

Separate statistical detectability from practical importance. A tiny improvement measured very precisely may not justify twice the inference latency. A practically large change may remain uncertain with a small sample. State a meaningful effect size or decision threshold before seeing results, then discuss both estimated benefit and uncertainty.

## Exercises and self-check

1. Explain why bootstrapping individual images is inappropriate when five images come from each independently sampled patient and deployment concerns new patients. **Check:** resample patients/groups and keep related images together; the medical context is only an independence example, not a deployment recommendation.
2. A report gives “0.92 ± 0.01.” List missing information. **Check:** metric, denominator, interval versus standard deviation, confidence level, number of runs/samples, resampling unit, split and selection procedure.
3. Run the paired example with 500, 5,000 and 20,000 bootstrap resamples. What uncertainty decreases as this number grows? **Check:** Monte Carlo error of the interval calculation, not uncertainty caused by having only 100 original observations.
4. Design a table for three seeds and two models that preserves pairing. Include an effect-size column and a statement of the experiment's limited scope.

## Primary reading

- [SciPy: `stats.bootstrap`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html): inspect paired resampling, interval methods and degeneracy warnings.
- [scikit-learn: cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html): choose a splitter according to groups, time and the intended generalization question.
