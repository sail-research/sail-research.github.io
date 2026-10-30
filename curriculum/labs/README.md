# SAIL CPU research laboratories

These are original, inspectable teaching experiments accompanying the 42-lesson English curriculum. They illustrate methods; they do not reproduce the original papers' full numerical benchmarks. No runtime dataset or model download is needed: examples use generated data and scikit-learn's bundled digits.

## Install

Use Python 3.11 or 3.12 and create a separate virtual environment. On Windows PowerShell:

```powershell
py -3.11 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip==26.2.2
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m pip install torch==2.9.1 --index-url https://download.pytorch.org/whl/cpu
```

On Linux use `.venv/bin/python`. On macOS install `torch==2.9.1` from the standard PyPI index instead of the CPU wheel index. No activation or PowerShell execution-policy change is required when using the environment's interpreter explicitly. Installation requires internet and enough disk space for the scientific libraries. The code records actual package versions in each output directory. Exact results across different versions/devices are not promised.

## Run

The following commands use `python` to mean your virtual environment's interpreter. Run from the extracted bundle root, where the scripts reside. Choose a new output folder for each experiment; repeating the same path replaces that run's generated files.

```text
python lab01_math.py --output outputs/math
python lab02_baselines.py --seed 7 --split-seed 7 --output outputs/baselines
python lab03_neural.py --model mlp --width 32 --output outputs/mlp
python lab03_neural.py --model cnn --output outputs/cnn
python lab04_trust.py --output outputs/trust
python lab05_federated.py --rounds 30 --local-steps 5 --output outputs/federated
python lab06_efficiency.py --output outputs/efficiency
python lab07_project.py --root outputs --output outputs/artifact-inventory.json
python run_all.py --output outputs/all
```

`--seed` controls experiment randomness. `--split-seed` is separate and defaults to 7; keep it fixed while varying training randomness. For the federated synthetic task, the experiment seed also changes generated data and client allocation, which the protocol records. Do not describe that as pure initialization variation.

## What to inspect

| Lab | Main artifacts | Meaningful checks |
|---|---|---|
| Math | `math.json` | Hand-computed affine/least-squares answers, residual orthogonality, finite-difference gradient, SVD error, optimization stability |
| Baselines | `validation_search.csv`, `test_metrics.csv`, predictions | Training-only scaler, disjoint split, frozen validation selection, probability/count consistency |
| Neural | `history.csv`, `neural.json`, model state, predictions | Analytic/autograd agreement, causal mask, exact same-environment checkpoint replay |
| Trust | `robustness.csv`, `backdoor.json`, SVG curve | Epsilon-zero identity, norm/domain constraints, clean-correct/non-target eligibility, no source-data mutation |
| Federated | partition records, `summary.csv`, histories, SVG | Exact aggregation, one-step pooled equivalence, mu-zero equivalence, client coverage, pooled/client count agreement |
| Efficiency | `tradeoffs.csv`, raw timings, states, NPZ, SVG | Frozen teacher, quantization error bound, SVD error, LoRA arithmetic, honest representation labels |
| Project | artifact inventory | File sizes/hashes and JSON parsing; not scientific or security certification |

All trainable-model choices use validation or a fixed declared budget. Test predictions are evaluated after selection. If you modify experiments after reading test results, disclose that exploration and preserve an independent final evaluation for assessed claims.

## Important scope distinctions

- Robustness is empirical survival against tested candidates, not certified worst-case accuracy.
- Backdoor experiments use your own small local models and visible triggers; no third-party target is involved.
- The privacy arithmetic uses public synthetic data and a public seed; it is not a confidential DP release or DP-SGD implementation.
- Federated execution is a single-process simulation with calculated dense float32 payloads, not measured networking or secure aggregation.
- Pruning leaves dense tensor shapes unchanged. Quantized weights are dequantized before float inference; no integer-kernel speed claim is made.
- Parameter bytes/checkpoint bytes are not peak RAM. Energy is not measured.
- Timing repetitions characterize one machine/run; they are not independent training seeds.

## Notebooks and exercises

The generated module notebooks contain the full readings and executable Python examples. Optional notebook software is not required for the `.py` labs. If using Jupyter, install it in a suitable environment and select the same Python kernel; restart and run all cells before trusting outputs. Markdown shell commands remain instructions, not automatically executed cells. The lab scripts are the primary reproducible experiment entry points.

Formative answers are visible in the readings. The assignments require new controlled variations and your own outputs, not copied demonstration numbers. Keep all raw evidence and cite the original method papers listed in each lesson. The upstream scientific libraries and bundled dataset retain their own licenses/attribution; this bundle does not relicense them.
