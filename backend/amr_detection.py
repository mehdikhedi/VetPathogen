"""Match sequences against an AMR gene reference catalog using alignment metrics."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

import pandas as pd

from backend.alignment import best_match


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


def detect_amr_genes(
    records: Iterable[dict[str, object]],
    reference_df: pd.DataFrame,
) -> list[dict[str, object]]:
    """Return the closest AMR gene match with alignment metrics for each record."""

    results = []
    reference_iterable = reference_df[["gene_name", "sequence"]].itertuples(index=False, name=None)
    reference_cache = list(reference_iterable)

    for record in records:
        sequence = str(record["sequence"]).upper()
        gene_name, metrics = best_match(sequence, reference_cache)
        result = {
            "id": record["id"],
            "amr_gene": gene_name or "N/A",
            "amr_identity": metrics.identity,
            "amr_coverage": metrics.coverage,
            "amr_score": metrics.score,
        }
        # Backwards-compatible field for existing UI
        result["similarity"] = metrics.identity
        results.append(result)
    return results
