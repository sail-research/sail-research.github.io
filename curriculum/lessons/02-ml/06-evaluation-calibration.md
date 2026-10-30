# Evaluation: imbalance, thresholds, calibration and uncertainty

**Core time:** 120 minutes. **Prerequisites:** conditional probability, uncertainty and classification. **Outcomes:** derive metrics from a confusion matrix; distinguish ranking, decisions and probabilities; select thresholds/calibration on validation data; report denominators and uncertainty.

## 1. Start with counts

For a binary task, true positives are positive examples predicted positive; false positives are negative examples predicted positive; false negatives are positive examples predicted negative; true negatives are the remaining correctly rejected negatives. Precision conditions on predicted positives. Recall, also called true-positive rate, conditions on actual positives. The false-positive rate conditions on actual negatives. These denominators must appear in an audit, especially when prevalence is small.

```math
\operatorname{precision}=\frac{TP}{TP+FP},\quad
\operatorname{recall}=\frac{TP}{TP+FN},\quad
F_1=\frac{2TP}{2TP+FP+FN}.
```

A zero denominator means the empirical quantity is undefined under its ordinary definition. A library may substitute zero or emit a warning; disclose the convention. Treating an empty subgroup as a perfect or perfectly fair classifier is particularly misleading.

## 2. Worked example: 95% accuracy can retrieve nothing

In 100 examples with 5 positives, an always-negative classifier has accuracy 95% and positive recall zero. A second classifier finds 4 positives but falsely flags 9 negatives. Its counts are TP=4, FN=1, FP=9, TN=86. Accuracy drops to 90%, precision is 4/13, recall is 4/5 and F1 is 8/18. Which is preferable depends on the consequences and workload, not on one universally best metric.

```python
tp,fn,fp,tn = 4,1,9,86
metrics = {'accuracy':(tp+tn)/(tp+fn+fp+tn),
    'precision':tp/(tp+fp),'recall':tp/(tp+fn),
    'f1':2*tp/(2*tp+fp+fn)}
assert metrics['accuracy'] == .90
assert metrics['recall'] == .80
print(metrics)
```

For multiclass problems, macro averaging gives each class equal weight; weighted averaging weights class metrics by support; micro averaging combines counts. These choices answer different questions. Always include class supports and a confusion matrix so the reader can see which classes drive the aggregate.

## 3. Ranking is different from a deployed threshold

ROC-AUC evaluates ranking over true-positive/false-positive rates, while precision–recall summaries emphasize retrieval of positives relative to flagged observations. Their interpretation depends on the task and prevalence. A high AUC does not identify a usable operating point or guarantee calibrated probabilities. Average precision and a trapezoidal area under a precision–recall curve are also not interchangeable definitions; name the metric implementation.

Select thresholds on validation data under a stated objective or constraint, such as maximizing recall subject to a false-positive workload limit. A sample estimate of satisfying that constraint is uncertain. Freeze the threshold before final evaluation. Do not choose a threshold independently for every test subgroup and then present the result as a single preexisting policy.

## 4. Calibration asks whether probabilities mean what they say

Among cases predicted around 0.8 confidence, an appropriately calibrated prediction system should be correct at a compatible frequency on the population under study. Reliability diagrams group predictions into bins and compare confidence with observed accuracy. Bin count, boundaries and sample size affect the picture. Expected calibration error is a useful summary but depends on those choices and can hide local problems.

Negative log-likelihood and Brier score evaluate probabilistic predictions with proper scoring rules under their standard definitions. Multiclass Brier normalization conventions vary, so record yours. Temperature scaling divides logits by one positive scalar fitted on validation data. It preserves argmax labels for a fixed positive temperature while changing confidence, so accuracy can remain unchanged as probabilistic quality changes.

```math
p_k(T)=\frac{\exp(z_k/T)}{\sum_j\exp(z_j/T)},\qquad T>0.
```

Fit T without test labels, then evaluate the frozen transformation on test. Calibration on one distribution does not guarantee calibration under a different distribution. A lower estimated calibration error is not a certificate of safety.

## 5. Evaluation protocol for this program

Report the split and unit of analysis; selection metric; final threshold/calibrator; accuracy, macro F1 and class counts for digits; per-seed scores for stochastic training; and a paired comparison when appropriate. Keep probabilities or logits with example indices so results can be audited. Do not expose personal identifiers in shared artifacts; the bundled data avoid that problem.

Run the evaluation outputs from `lab02_baselines.py` and `lab03_neural.py`. Check that probabilities sum to one and that confusion-matrix counts sum to the test-set size. Compare model predictions on the same indices. If one run used a different split, repair the comparison before computing a paired interval.

## Exercises and self-check

1. Derive specificity and balanced accuracy from the worked counts. **Check:** specificity `86/95`; balanced accuracy is the mean of that value and 0.8.
2. Why can temperature scaling change NLL without changing accuracy? **Check:** a positive common scale preserves the largest logit while changing probability concentration.
3. Design a reliability plot including bin sample counts. Explain how you handle empty bins and why tiny bins are noisy.
4. A paper reports only accuracy on a highly imbalanced dataset. List the additional evidence needed before judging its usefulness. Include operating costs and prevalence as well as more metrics.

## Primary reading

- [scikit-learn: model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html): compare definitions and averaging conventions.
- [Guo et al.: On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html): read the temperature-scaling construction and distinguish the published empirical findings from your own experiment.
