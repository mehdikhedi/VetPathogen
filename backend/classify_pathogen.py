"""Pathogen classification using alignment-based matching."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

import pandas as pd

from backend.alignment import AlignmentResult, best_match

PATHOGEN_REFERENCE_CSV = Path("data/pathogen_reference.csv")


def load_reference(csv_path: str | Path | None = None) -> pd.DataFrame:
    """Load pathogen reference sequences."""

    path = Path(csv_path or PATHOGEN_REFERENCE_CSV)
    if not path.exists():
        raise FileNotFoundError(f"Pathogen reference CSV not found: {path}")
    df = pd.read_csv(path)
    required = {"species", "sequence"}
    if not required.issubset(df.columns):
        raise ValueError(f"Reference CSV must contain columns {required}, found {df.columns.tolist()}")
    df["sequence"] = df["sequence"].str.upper()
    return df


def classify_sequence(sequence: str, reference_df: pd.DataFrame) -> tuple[str, AlignmentResult]:
    """Return the best-matching species and alignment metrics."""

    sequence = sequence.upper()
    reference_records = reference_df[["species", "sequence"]].itertuples(index=False, name=None)
    species, metrics = best_match(sequence, reference_records)
    return species, metrics


def classify_dataframe(df: pd.DataFrame, reference_df: pd.DataFrame | None = None) -> pd.DataFrame:
    """Attach predicted species and alignment metrics to the dataframe."""

    if "sequence" not in df.columns:
        raise KeyError("DataFrame must contain a 'sequence' column.")

    reference_df = reference_df if reference_df is not None else load_reference()
    classified = df.copy()

    species: list[str] = []
    identities: list[float] = []
    coverages: list[float] = []
    scores: list[float] = []

    for sequence in classified["sequence"]:
        label, metrics = classify_sequence(str(sequence), reference_df)
        species.append(label or "Unknown")
        identities.append(metrics.identity)
        coverages.append(metrics.coverage)
        scores.append(metrics.score)

    classified["predicted_species"] = species
    classified["species_identity"] = identities
    classified["species_coverage"] = coverages
    classified["species_score"] = scores
    return classified


def classify_records(
    records: Iterable[dict[str, object]], reference_df: pd.DataFrame | None = None
) -> list[dict[str, object]]:
    """Return records augmented with predicted species and alignment metrics."""

    df = pd.DataFrame(records)
    classified_df = classify_dataframe(df, reference_df=reference_df)
    return classified_df.to_dict(orient="records")
