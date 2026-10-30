# Group evaluation, fairness criteria and calibrated claims

**Core time:** 120 minutes. **Prerequisites:** confusion matrices and calibration. **Outcomes:** compute group-conditioned rates with support counts; distinguish common fairness criteria; identify tradeoffs and missing context; avoid treating a toy metric as a social or legal verdict.

## 1. Start with the decision and affected population

A group disparity is a measurement requiring interpretation. Which groups matter, how membership is collected, what a label represents and what decisions follow are contextual questions. Labels may reflect historical decisions rather than an unbiased ground truth. An apparently equal metric can coexist with serious harms outside what was measured.

The course uses synthetic group labels to practice arithmetic. It does not infer demographic attributes or evaluate real people. A real assessment would require appropriate data governance, domain expertise and stakeholder input. The technical task here is to make metric definitions and limitations explicit.

## 2. Different criteria condition on different events

Demographic parity compares positive prediction rates across groups. Equality of opportunity compares true-positive rates among actual positives. Equalized odds compares both true-positive and false-positive rates. Calibration asks whether a given score corresponds to comparable observed outcome frequencies within a population/group. These criteria answer different questions and can conflict, especially when base rates differ and prediction is imperfect.

```math
\mathrm{TPR}_g=P(\hat Y=1\mid Y=1,G=g),\qquad
\mathrm{FPR}_g=P(\hat Y=1\mid Y=0,G=g).
```

Choosing one criterion is a substantive decision, not a library default. “Fairness improved” is incomplete without naming the criterion, groups, population, threshold and uncertainty. A smaller maximum gap may come from harming the better-performing group rather than improving outcomes for the worse-performing group; inspect absolute values and consequences.

## 3. Worked example: similar selection rates, unequal recall

Group A has 40 positive and 60 negative examples; the classifier finds 30 positives and falsely flags 10 negatives. Group B has 20 positive and 80 negative examples; it finds 10 positives and falsely flags 30 negatives. Both groups have 40 positive predictions out of 100, satisfying equal observed selection rates in this sample. Yet TPR is 0.75 versus 0.50 and FPR is about 0.167 versus 0.375. One parity statement clearly does not imply the others.

```python
groups = {'A':{'tp':30,'fn':10,'fp':10,'tn':50},
          'B':{'tp':10,'fn':10,'fp':30,'tn':50}}
def rates(c):
    total=sum(c.values())
    return {'count':total,'positive_count':c['tp']+c['fn'],
        'selection':(c['tp']+c['fp'])/total,
        'tpr':c['tp']/(c['tp']+c['fn']),
        'fpr':c['fp']/(c['fp']+c['tn'])}
result={g:rates(c) for g,c in groups.items()}
assert result['A']['selection'] == result['B']['selection']
print(result)
```

This example has nonzero denominators. In general, return an explicit missing/undefined value when a group has no positive or negative examples. Do not replace an undefined rate with zero and then claim the disparity is small.

## 4. Small groups require uncertainty, not silence

A rate based on five positives can change dramatically when one prediction changes. Report support counts, intervals or an appropriate uncertainty analysis. Group comparisons across many overlapping subgroups introduce selection concerns: discovering the worst gap after an unrestricted search is different from testing predeclared groups. Preserve the search scope and avoid selectively reporting only favorable slices.

Intersectional analysis can reveal patterns hidden in broad averages, but sparse intersections make estimates noisy. The response is not to erase small groups; state uncertainty and decide what additional evidence is needed. Bootstrap units must follow the independence structure, such as persons or devices rather than correlated rows.

## 5. Thresholds and mitigation change the policy

Changing a common threshold alters selection, recall and false-positive rates. Group-specific thresholds define a different decision policy and require contextual justification; they are not merely a numerical calibration trick. Fit any proposed policy on development data and evaluate it on held-out data. Show utility and group metrics together, along with coverage or abstention if used.

This lesson does not prescribe one universally correct fairness criterion. Its research standard is to explain the choice, expose the tradeoffs and avoid conclusions that exceed the evidence.

## Exercises and self-check

1. Compute precision for both groups in the worked example. **Check:** 30/40=0.75 and 10/40=0.25.
2. A group contains no true positives in the dataset. What is its empirical TPR? **Check:** undefined because the actual-positive denominator is zero.
3. Create a synthetic threshold sweep and plot absolute group rates plus their gap. Explain a case where a smaller gap accompanies worse performance for everyone.
4. Draft a model-card paragraph that reports one disparity without claiming the system is “fair” overall.

## Primary reading

- [Hardt, Price and Srebro: Equality of Opportunity in Supervised Learning](https://arxiv.org/abs/1610.02413): inspect conditional-rate definitions and post-processing assumptions.
- [Guo et al.: calibration](https://proceedings.mlr.press/v70/guo17a.html): distinguish probability calibration from thresholded error-rate parity.
- [Mitchell et al.: Model Cards](https://arxiv.org/abs/1810.03993): place subgroup evidence in a contextual report.
