# Build an experiment package another researcher can inspect

**Core time:** 2 hours. **Prerequisites:** a focused question and reproducible lab experience. **Outcomes:** organize code/configuration/data provenance; preserve raw evidence; define checks and a clean reproduction command; document data and artifact boundaries.

## 1. Separate source, configuration and results

Put reusable implementation in source files, experimental choices in a configuration and generated outputs in a run-specific directory. A notebook can explain the analysis, but hidden execution state must not be required for reproduction. Restart and run all cells in order before submitting. Avoid manual spreadsheet edits that cannot be regenerated from raw outputs.

A small package can contain `README.md`, `requirements.txt`, `protocol.json`, `src/`, `configs/`, `results/`, `report.pdf` and `LICENSES.md`. Include the exact command for the main result and a smaller smoke command. Explain whether the command retrains, evaluates saved weights or only regenerates plots; these are different tasks.

## 2. Data provenance makes indices meaningful

Record source URL, version, license/usage conditions, download or generation method, preprocessing and split identifiers. For generated data, save generator parameters and seeds. For external data, retain attribution and verify what redistribution is permitted. If data cannot be shared, provide an authorized access path and a synthetic smoke example without pretending the latter reproduces the real-data result.

Do not place credentials, student records or confidential research data in the repository, notebook outputs or shared screenshots. The course's bundled/synthetic data avoid those needs. If your proposed extension requires restricted data, discuss the data-governance requirements with your supervisor before changing the scope.

## 3. Worked artifact identity check

A file checksum helps verify that a colleague has the same bytes. It does not prove that the file's contents are correct, legally usable or unmodified before the checksum was recorded. Store hashes together with a description of what each artifact represents.

```python
import hashlib
from pathlib import Path
def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda:stream.read(1024*1024),b''):
            digest.update(block)
    return digest.hexdigest()
# Call sha256 on your saved configuration, split file and final metrics file.
assert len(hashlib.sha256(b'SAIL teaching example').hexdigest()) == 64
```

A code commit ID identifies a version-controlled source state, while uncommitted local changes can still alter a run. Record whether the working tree was clean. Do not embed environment secrets in an “environment dump”; record package/device information selectively.

## 4. Checks should match the scientific claim

For a robustness project, verify attack bounds, eligibility and clean controls. For FL, verify partition disjointness, weighting and local initialization. For efficiency, verify equivalent inputs, representation labels and timing boundaries. For all projects, verify no test-driven selection, finite metrics and recoverable denominators. A generic “script exited zero” check is necessary but not sufficient.

Use `lab07_project.py --root YOUR_OUTPUT_FOLDER` to create a structural artifact inventory and hashes. Its report explicitly states that it does not validate scientific correctness, privacy or the absence of all secrets. You still need the method-specific checks and a reviewer.

## 5. Keep raw and derived evidence connected

Save per-run metrics and relevant predictions before computing means, intervals or plots. A figure caption should identify the configuration, sample size, aggregation and uncertainty definition. If a plot excludes failed runs, explain the exclusion rule and list them. Prefer a predeclared failure policy to decisions made after seeing whether the failure favors the hypothesis.

A run log should record start/end status, command, configuration, output path and error if failed. A failed experiment can reveal a feasibility limitation; erasing it removes evidence. Do not merge results from different code versions without preserving that distinction.

## Exercises and self-check

1. Ask a peer to reproduce a small result using only the README. Record every missing instruction and repair the package.
2. Explain why a seed without dataset order/version cannot identify a split uniquely.
3. Create an artifact inventory with sizes and SHA-256 values. Verify that changing a file changes its hash.
4. Write a data statement distinguishing public bundled data, generated data and any unperformed restricted-data extension.

## Primary reading

- [Python: virtual environments](https://docs.python.org/3/tutorial/venv.html): document environment creation clearly.
- [NeurIPS paper checklist](https://nips.cc/public/guides/PaperChecklist): audit code/data availability, experimental details and computational requirements.
- [Model Cards](https://arxiv.org/abs/1810.03993): connect the artifact package to intended use and limitations.
