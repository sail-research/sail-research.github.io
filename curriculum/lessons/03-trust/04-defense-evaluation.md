# Evaluating defenses without a false sense of security

**Core time:** 120 minutes. **Prerequisites:** adversarial and backdoor experiments. **Outcomes:** compare clean utility and attack resistance; identify gradient masking symptoms; specify defender knowledge; design an adaptive, budget-aware evaluation plan.

## 1. A defense changes the system being evaluated

Input preprocessing, adversarial training, data filtering and randomized prediction modify different parts of a learning system. Write down the complete defended prediction function, including transforms and randomness. An attack against the old model alone may not evaluate the defended system. Conversely, an attack that ignores a transform's actual input scale can violate or underuse the intended threat budget.

For a local teaching comparison, consider a fixed smoothing transform before classification. Clean accuracy may drop because smoothing removes useful strokes. A weak attack may also become less effective. Neither observation alone establishes a useful defense. Measure both, use an attack suited to the actual defended computation and state what remains untested.

## 2. Robust optimization is a training objective

Adversarial training approximately minimizes a worst-case loss over a stated perturbation set. The inner maximization is implemented by a finite attack procedure and the outer minimization updates model parameters. This is computationally more expensive than a clean training step. Specify whether the loss uses clean and adversarial examples, how the inner attack is configured and whether gradients through the attack construction are retained or stopped.

```math
\min_\theta\;\mathbb{E}_{(x,y)}\left[\max_{\delta\in\Delta(x)}\ell(f_\theta(x+\delta),y)\right].
```

This expression defines the objective; the implementation only approximates it. A model trained against a particular norm budget may remain vulnerable to other shifts or perturbation families. A robustness gain at one epsilon is not a general privacy or fairness guarantee.

## 3. Worked comparison: calculate the actual tradeoff

Imagine a clean baseline is correct on 190 of 200 examples and remains correct on 80 under a tested attack suite. A defended model is clean-correct on 180 and remains correct on 110 under the same suite. Report clean accuracy 95% versus 90% and empirical suite survival 40% versus 55%. The defense sacrifices five points of clean accuracy for fifteen points of measured survival in this setting. Whether that trade is acceptable depends on the intended use.

Do not compare a baseline's 20-step attack with a defense's one-step attack or change the test subset to remove inconvenient failures. If reporting conditional attack success, denominators differ because clean-correct counts differ; show them explicitly alongside all-example metrics.

```python
rows = [{'name':'baseline','clean_correct':190,'survive':80},
        {'name':'defended','clean_correct':180,'survive':110}]
for row in rows:
    row['clean_accuracy'] = row['clean_correct']/200
    row['suite_survival'] = row['survive']/200
    assert row['survive'] <= row['clean_correct']
print(rows)
```

These counts are illustrative, not lab measurements. Your assignment table must come from saved predictions.

## 4. Gradient masking is an evaluation warning

A defense may make gradients discontinuous, stochastic or numerically unhelpful without removing vulnerable inputs. Warning patterns include iterative attacks unexpectedly underperforming simple attacks, large increases in attack budget producing no change, or black-box/transfer attacks finding failures missed by a naive white-box procedure. These are clues to investigate, not a theorem that any unusual curve proves masking.

Adaptive evaluation accounts for the defense's actual computation and randomness within the stated attacker knowledge. For stochastic systems, evaluate the relevant expected or probabilistic objective and report repetitions. For nondifferentiable transforms, an appropriate evaluation may require methods beyond the introductory gradient implementation. Do not claim a defense passes those tests if you have not run them.

## 5. Compare costs and information access

If the defense needs clean validation labels, a known trigger, additional training data or privileged model internals, include that requirement. Compare retraining budgets and report inference overhead. A detector's accuracy should include false alarms and rejection behavior; rejecting every input is not a useful classifier unless the task explicitly permits that policy and its consequences are reported.

## Exercises and self-check

1. A defense achieves high “accuracy on accepted inputs” while rejecting 90% of data. What is missing? **Check:** coverage, rejection rates by group/class, overall utility and the handling of rejected cases.
2. Why is a failure of one attack insufficient to certify robustness? **Check:** optimization may miss allowed adversarial points.
3. Design a defense comparison with matched selection data and declared extra computation. Include a no-defense control and clean evaluation.
4. A filtering defense removes 20% of training data. Propose a random-removal control and explain what it can and cannot isolate.

## Primary reading

- [Athalye, Carlini and Wagner: Obfuscated Gradients Give a False Sense of Security](https://arxiv.org/abs/1802.00420): study why an attack can fail for reasons other than robustness.
- [Madry et al.: adversarial robustness](https://arxiv.org/abs/1706.06083): connect the robust objective to the finite approximation used in practice.
