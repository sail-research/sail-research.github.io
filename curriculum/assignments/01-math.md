# Assignment: a checked mathematical research notebook

## Objective and scope

Demonstrate that you can connect an equation, an implementation and evidence of correctness. Use original small numerical examples and synthetic data. The default outputs from `lab01_math.py` are a starting check, not the complete submission. Estimated effort: 4–6 hours after the lessons.

## Required tasks

1. **Shapes and geometry:** construct a non-square affine map with at least three observations and two outputs. Annotate every axis, compute one output by hand and verify the complete result. Add a residual-shape guard that catches accidental broadcasting.
2. **Least squares and conditioning:** fit an original small regression problem, verify residual orthogonality and create a nearly dependent feature. Perturb the responses and compare coefficient versus prediction changes. Explain what regularization changes and how any predictive regularization choice would be selected.
3. **Gradients:** derive the half mean-squared gradient with L2 regularization. Compare analytic, central-difference and autograd values at three nontrivial points. Use unequal sample/feature counts and report tolerances, dtype and maximum errors.
4. **SVD:** compute at least three ranks for a small matrix. Verify the discarded-singular-value error relation and explain why matrix reconstruction error is not automatically task error.
5. **Probability and uncertainty:** solve an original base-rate example and analyze a paired model comparison. State the estimand, independence unit, bootstrap method and what the interval does not establish.
6. **Optimization:** compare stable and deliberately excessive learning rates on a known quadratic. Derive the stability range and connect the observed trajectory to curvature.

## Deliverables

Submit a notebook or Python package, a 2–3 page explanation, raw numeric outputs and a README with an environment and one reproduction command. Include at least one intentionally failing example followed by a repair. Keep the failure as a documented teaching case, not a broken default execution. Provide the primary references used and distinguish your original examples from source material.

## Rubric

| Criterion | Points | Full-credit evidence |
|---|---:|---|
| Shape/notation and hand calculation | 15 | Correct dimensions and independently checked values |
| Least squares/conditioning | 20 | Residual invariant, perturbation experiment, sound interpretation |
| Derivation and gradient checks | 25 | Three methods, suitable points/tolerances, no hidden averaging bug |
| SVD and optimization reasoning | 15 | Error/stability relations verified and explained |
| Probability/uncertainty | 15 | Correct conditioning, pairing and inference limits |
| Reproducibility and clarity | 10 | Fresh execution, actual outputs and concise explanation |

Essential gates: no fabricated outputs, gradients match the stated objective, test tolerances are justified and the main script runs. Recommended Pass: at least 70 points and all gates. Recommended Excellent: at least 90 plus a thoughtful extension, such as a conditioning sweep or a comparison of finite-difference step sizes that explains both truncation and rounding error. The reviewer records the actual portal result.

## Self-review and reviewer guidance

Ask a peer to recover one result without reading your code. If the derivation and implementation disagree, repair the discrepancy before interpreting the experiment. Reviewers should ask why a test would detect a plausible mistake rather than accept a list of passing assertions. A clear explanation of a numerical failure can earn credit; hiding it behind a loose tolerance cannot.

Use Revision for correctable gaps while the deadline remains open, with a specific requested repair. A high point total does not override an essential validity failure. Reading-completion checkmarks do not replace this assignment.
