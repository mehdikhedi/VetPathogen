"""Match sequences against an AMR gene reference catalog."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

import pandas as pd


def load_reference(reference_csv: str | Path) -> pd.DataFrame:
    """Load the AMR reference genes sheet."""

    path = Path(reference_csv)
    if not path.exists():
        raise FileNotFoundError(f"Reference CSV not found: {path}")
    df = pd.read_csv(path)
    required = {"gene_name", "sequence"}
    if not required.issubset(df.columns):
        raise ValueError(f"Reference CSV must contain {required}, got {df.columns.tolist()}")
    df["sequence"] = df["sequence"].str.upper()
    return df


def compute_similarity(sample: str, reference: str) -> float:
    """Return simple base-to-base similarity percentage."""

    sample_seq = sample.upper()
    reference_seq = reference.upper()
    if not sample_seq or not reference_seq:
        return 0.0

    matches = sum(1 for s, r in zip(sample_seq, reference_seq) if s == r)
    total = max(len(sample_seq), len(reference_seq))
    if total == 0:
        return 0.0
    return round((matches / total) * 100, 2)


def detect_amr_genes(
    records: Iterable[dict[str, str]], reference_df: pd.DataFrame
) -> list[dict[str, str | float]]:
    """Return the closest AMR gene match for each record."""

    results = []
    for record in records:
        sequence = record["sequence"]
        best_gene = "N/A"
        best_similarity = 0.0
        for _, row in reference_df.iterrows():
            similarity = compute_similarity(sequence, row["sequence"])
            if similarity > best_similarity:
                best_gene = row["gene_name"]
                best_similarity = similarity
        results.append(
            {
                "id": record["id"],
                "amr_gene": best_gene,
                "similarity": best_similarity,
            }
        )
    return results
