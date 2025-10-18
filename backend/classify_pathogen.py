"""Heuristic pathogen classification utilities."""

from __future__ import annotations

import pandas as pd

PATTERN_MAP = {
    "GCG": "Escherichia_coli",
    "CCC": "Pseudomonas_aeruginosa",
}

DEFAULT_SPECIES = "Staphylococcus_aureus"


def classify_sequence(sequence: str) -> str:
    """Return a predicted species label based on simple pattern heuristics."""

    seq = sequence.upper()
    for motif, species in PATTERN_MAP.items():
        if motif in seq:
            return species
    return DEFAULT_SPECIES


def classify_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Attach a predicted species column to the provided dataframe."""

    if "sequence" not in df.columns:
        raise KeyError("DataFrame must contain a 'sequence' column.")

    classified = df.copy()
    classified["predicted_species"] = classified["sequence"].map(classify_sequence)
    return classified


def classify_records(records: list[dict[str, str]]) -> list[dict[str, str]]:
    """Return records augmented with predicted species."""

    df = pd.DataFrame(records)
    classified_df = classify_dataframe(df)
    return classified_df.to_dict(orient="records")
