"""Shared deterministic data, evaluation and artifact helpers for SAIL CPU labs."""
from __future__ import annotations
import argparse
import csv
import hashlib
import importlib.metadata
import json
import platform
from pathlib import Path
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split


def arguments(description: str, configure=None):
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('--seed', type=int, default=7)
    parser.add_argument('--output', type=Path, default=Path('outputs'))
    parser.add_argument('--split-seed', type=int, default=7)
    if configure: configure(parser)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    return args


def write_json(path: Path, value):
    def convert(item):
        if isinstance(item, np.ndarray): return item.tolist()
        if isinstance(item, np.generic): return item.item()
        if isinstance(item, Path): return str(item)
        raise TypeError(type(item).__name__)
    path.write_text(json.dumps(value, indent=2, default=convert, allow_nan=False)+'\n', encoding='utf-8')


def record_environment(output: Path, seed: int):
    packages = {}
    for name in ['numpy', 'scipy', 'scikit-learn', 'matplotlib', 'torch']:
        try: packages[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError: packages[name] = 'not installed'
    write_json(output/'environment.json', {'python': platform.python_version(),
        'platform': platform.platform(), 'packages': packages, 'seed': seed,
        'device': 'CPU', 'note': 'Seeds do not guarantee equivalence across environments.'})


def digits_split(seed: int = 7):
    """Fixed domain scaling [0,16] -> [0,1]; stratified 60/20/20 split.

    Scaling uses the documented pixel range, not an estimated whole-data statistic.
    Split indices are returned for audit. There are no runtime network downloads.
    """
    data = load_digits()
    X = data.data.astype(np.float32) / 16.0
    y = data.target.astype(np.int64)
    indices = np.arange(len(y))
    train, rest = train_test_split(indices, test_size=0.4, stratify=y, random_state=seed)
    val, test = train_test_split(rest, test_size=0.5, stratify=y[rest], random_state=seed+1)
    assert not (set(train)&set(val) or set(train)&set(test) or set(val)&set(test))
    assert len(train)+len(val)+len(test) == len(y)
    return X, y, {'train': train, 'validation': val, 'test': test}


def save_split(output: Path, splits):
    write_json(output/'split_indices.json', splits)
    raw = json.dumps({k:v.tolist() for k,v in splits.items()}, sort_keys=True).encode()
    return hashlib.sha256(raw).hexdigest()


def paired_bootstrap(a, b, seed=7, resamples=3000):
    a, b = np.asarray(a), np.asarray(b)
    if a.shape != b.shape or a.ndim != 1 or len(a) == 0:
        raise ValueError('Require nonempty paired one-dimensional observations.')
    differences = b.astype(float)-a.astype(float)
    rng = np.random.default_rng(seed)
    values = np.array([differences[rng.integers(0,len(a),len(a))].mean() for _ in range(resamples)])
    return {'mean_difference': float(differences.mean()),
            'percentile_95_interval': np.quantile(values,[.025,.975]).tolist(),
            'resamples': resamples, 'unit': 'paired independent observations', 'seed': seed}


def table_csv(path, rows):
    if not rows: raise ValueError('No rows to write.')
    with Path(path).open('w', newline='', encoding='utf-8') as handle:
        writer=csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)
