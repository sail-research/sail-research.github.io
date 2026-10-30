# A reproducible learning problem and a leakage-safe data workflow

**Core time:** 90–120 minutes. **Prerequisites:** setup guide, arrays and basic probability. **Outcomes:** define inputs/targets and the deployment question; reserve an appropriate test set; fit preprocessing only on training data; preserve split identifiers and a baseline.

## 1. Define the prediction event

A supervised-learning example contains an input available at prediction time and a target representing the desired output. Before fitting anything, describe what generates an observation, when a prediction is made and which information exists at that time. A feature measured after the outcome can predict well in a retrospective table while being unusable in practice. Duplicate records can put nearly identical examples in both training and evaluation sets.

Our teaching task classifies 8-by-8 handwritten digits from scikit-learn's bundled dataset. The inputs are 64 pixel intensities; the target is one of ten digit classes. This is a small classification benchmark, not evidence about a deployed handwriting system. Treat the data description and original attribution as part of the artifact. Scaling intensities by the documented constant 16 uses a known measurement range; estimating a mean or standard deviation from data would instead be a fitting step.

## 2. Three sets have three jobs

The training set estimates model parameters and preprocessing statistics. The validation set supports hyperparameter selection, early stopping and threshold choices. The test set estimates final performance after those choices are frozen. Cross-validation can replace a single validation split, but every preprocessing step must be refitted inside each training fold. Reusing test scores to choose another model turns the test set into a development set.

For independent examples, a seeded stratified split can preserve approximate class proportions. For grouped observations, separate groups rather than rows. For future forecasting, preserve temporal direction and consider an appropriate gap. Random splitting is not automatically the most rigorous choice; the correct split matches the intended generalization question.

```python
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
data = load_digits()
idx = np.arange(len(data.target))
train, rest = train_test_split(idx, test_size=0.4,
    stratify=data.target, random_state=7)
validation, test = train_test_split(rest, test_size=0.5,
    stratify=data.target[rest], random_state=8)
assert not (set(train)&set(validation) or set(train)&set(test)
            or set(validation)&set(test))
assert len(train)+len(validation)+len(test) == len(idx)
print(len(train), len(validation), len(test))
```

Saving integer indices is stronger than recording only the seed: it preserves the actual split even if another library version changes sampling behavior. Record dataset version, ordering and a hash too, because indices have meaning only relative to a specific ordered dataset.

## 3. Leakage can enter before the model exists

Imputation, standardization, feature selection and PCA learn something from data. Fit them on training and apply the fitted transformation to validation/test. A pipeline combines preprocessing and the estimator into one fitted object, making it easier to repeat the procedure correctly during cross-validation. It does not protect against every leakage source: an answer-containing feature or an incorrect group split still defines the wrong experiment.

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
X = data.data.astype(float)
y = data.target
model = make_pipeline(StandardScaler(),
    LogisticRegression(C=1.0, max_iter=2000, random_state=7))
model.fit(X[train], y[train])
print("Validation accuracy:", model.score(X[validation], y[validation]))
# Reserve test indices until model selection is frozen.
```

Both validation and future inputs use the scaler fitted on training observations. Centering validation data by its own mean is a different transformation and can use information about the evaluation population that would not be available under the intended prediction protocol.

## 4. Worked example: a seemingly harmless mean

Training values are `[0,2]` and a held-out value is 100. The training mean is 1, so centered training values are `[-1,1]`. Including the held-out value makes the mean 34 and centered training values `[-34,-32]`. The preprocessing now depends on the held-out population before training begins. This exaggerated example makes the dependency visible; leakage can also be subtle and can create optimistic or otherwise distorted estimates.

## 5. Establish a baseline and an audit trail

A majority-class classifier supplies a minimal sanity baseline. A linear model tests whether a sophisticated architecture is needed. Record class counts, missing values, duplicate/group checks, preprocessing and metric definitions. The baseline should use the same legal information and evaluation split as the proposed model. Deliberately weakening it to inflate an improvement is not a controlled comparison.

Run `python lab02_baselines.py --output outputs/baselines`. Inspect `split_indices.json`, the environment record and validation-selection table. The lab chooses regularization using validation and records test metrics after selection. Adding candidates after reading the test score would change that protocol. Preserve unsuccessful candidates; selection evidence should not consist only of the winner.

## Exercises and self-check

1. Design a split for photographs from 50 people when deployment concerns new people. **Check:** group by person, keeping each person's photographs in one partition; class stratification may need extra care.
2. Why does fitting a scaler before cross-validation leak information? **Check:** each validation fold influences the transform applied to its corresponding training fold.
3. Create a manifest containing data source, license/usage terms, prediction time, unit of analysis, split hashes and label definition. Identify one plausible shortcut feature and how you would test for it.
4. A student reruns random splits until accuracy is high. Explain what was selected and how to repair the report. **Check:** the evaluation partition became a tuned choice; disclose it and reserve a genuinely independent final assessment.

## Primary reading

- [scikit-learn: common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html): audit preprocessing dependencies using the leakage examples.
- [scikit-learn: `load_digits`](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html): inspect data shape, intensity range and attribution.
- [scikit-learn: cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html): compare independent, grouped and time-ordered evaluation.
