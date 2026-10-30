# Before the first lesson: environment, habits and diagnostic

## A reproducible workspace

Use Python 3.11 or 3.12 in a new virtual environment. The tested teaching environment pins NumPy 2.3.5, SciPy 1.16.3, scikit-learn 1.7.2, Matplotlib 3.10.7 and PyTorch 2.9.1 CPU. These are deliberate reproducibility pins, not a claim to be the newest releases. Avoid mixing this environment with an existing research project. Package installation needs internet access; the core laboratories do not download datasets or models at runtime.

Download and extract the [SAIL laboratory bundle](https://www.sail-research.com/training/materials/sail-training-labs.zip). Open a terminal in the extracted folder, where `requirements.txt` is visible. On Windows PowerShell:

```powershell
py -3.11 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip==26.2.2
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m pip install torch==2.9.1 --index-url https://download.pytorch.org/whl/cpu
.venv\Scripts\python.exe run_all.py --output outputs
```

On macOS/Linux, replace the interpreter path with `.venv/bin/python`. macOS users install `torch==2.9.1` from the default PyPI index rather than the CPU wheel index. Activation is optional: using the environment's interpreter explicitly avoids PowerShell execution-policy changes. A Python version error means the requested interpreter is not installed; inspect `py -0p` on Windows or `python3 --version` on Unix before creating the environment. The official [Python virtual-environment guide](https://docs.python.org/3/tutorial/venv.html) explains isolation and activation.

Start with one lab, not the entire suite. `python lab01_math.py --output outputs/math` runs only the mathematical laboratory. All commands shown as `python` in lessons assume the isolated environment's interpreter. Each lab writes results to the output path you choose. Keep different experiment runs in different folders; do not overwrite the baseline while changing a parameter. `run_all.py` collects the demonstrations; it is not a substitute for designing your assignment experiments.

## What a research record contains

Create `research-log.md`. Every entry should contain a question, prediction, command, configuration, seed, environment, observed result, interpretation and next action. For example: “Does feature scaling improve optimization conditioning? I predict faster decrease for the same learning-rate policy. Run seed 7 with and without training-only scaling. Compare loss against steps, not merely the last number.” This entry makes a claim falsifiable before the result is seen.

Save raw metrics separately from prose. Prefer CSV or JSON with units: `latency_ms`, `accuracy_fraction`, `parameter_bytes`. Preserve a failed run with its error message and fix; do not silently remove inconvenient outcomes. A seed determines a pseudorandom sequence in a particular setup. It does not guarantee identical results across every device, library version or algorithm. Record those conditions as well.

The bundled digit data contain 1,797 grayscale handwritten-digit samples, each with 64 features representing an 8-by-8 image. Read the dataset's description and original attribution in [scikit-learn's dataset documentation](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html). Its small size makes teaching experiments accessible; it does not make it representative of modern vision deployment. Our synthetic data have known generation rules and no human identities. Never replace them with confidential data merely to make a project feel more realistic.

## Diagnostic: attempt before reading the hints

1. Write `mean(values)` without NumPy. What should happen for an empty list? Explain why returning zero would hide an undefined quantity.
2. An input matrix has shape `(12, 5)` and a weight matrix has shape `(5, 3)`. What is the output shape? Which axis indexes observations?
3. Differentiate `(2*w - 3)**2`. Evaluate at `w=1` and take one gradient-descent step with learning rate `0.1`.
4. A classifier predicts the majority class in a dataset containing 95 negative and 5 positive examples. What are its accuracy and positive-class recall? Is it useful for finding positive cases?
5. Why must the test set be excluded when selecting a learning rate?
6. You ran two models once and obtained 0.91 and 0.92 accuracy. List three facts needed before claiming that the second model is better.
7. A colleague cannot reproduce your result. List five artifacts you should provide before suggesting they buy a GPU.
8. Read a paper abstract and separate its research question, method, empirical scope and claimed conclusion. Which information must you inspect outside the abstract?

## Diagnostic self-check and bridge

For 1, sum and divide by length, explicitly rejecting an empty list. For 2, the output is `(12, 3)`; rows are observations. For 3, the derivative is `4*(2*w-3)`, so at 1 it is -4 and the next value is 1.4. For 4, accuracy is 95%, positive recall is 0%, and usefulness depends on the task's costs; it fails to retrieve any positive sample. For 5, selecting on test observations makes them part of model development. For 6, inspect sample size/dependence, paired predictions and variation across training runs, alongside the selection protocol. For 7, supply code revision, environment, data/split identifiers, configuration/seeds, commands and raw outputs. For 8, inspect definitions, assumptions, evaluation and limitations rather than extrapolating from an abstract.

If 1 is difficult, complete the official [Python tutorial's control-flow and function sections](https://docs.python.org/3/tutorial/controlflow.html), then write a function that returns the mean and count of valid measurements. If 2–3 are difficult, spend extra time on Math 1–3 and work every example by hand. If 4–6 are difficult, revisit the evaluation lessons before starting a pillar assignment. This diagnostic determines where to slow down, not whether you belong in research.

## Working agreement

Explain your own reasoning. Cite code or ideas that you adapt, retain license notices, and disclose substantial tool assistance. Inspect generated code and run its checks. A passing script can still implement the wrong experiment. Treat unexpected results as questions, not as evidence to conceal. When stuck, send the smallest command, complete error and expected behavior to your mentor; never include credentials in logs or screenshots.
