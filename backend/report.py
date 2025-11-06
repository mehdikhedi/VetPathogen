"""Combine sequence metrics, classification, and AMR detection into a report."""

from __future__ import annotations

import random
from pathlib import Path
from typing import Iterable

import pandas as pd

from backend.classify_pathogen import classify_dataframe
from backend.sequence_handler import compute_gc_content

RISK_LEVELS: tuple[str, ...] = ("Low", "Medium", "High")


def _ensure_dataframe(records: Iterable[dict[str, object]]) -> pd.DataFrame:
    """Create a DataFrame from record dicts and normalise column order."""

    df = pd.DataFrame(records)
    if "gc_content" not in df.columns and "sequence" in df.columns:
        df["gc_content"] = df["sequence"].map(lambda seq: compute_gc_content(str(seq)))
    return df


def attach_resistance_risk(df: pd.DataFrame, seed: int | None = None) -> pd.DataFrame:
    """Append a random resistance risk label to each row."""

    rng = random.Random(seed)
    enriched = df.copy()
    enriched["resistance_risk"] = [rng.choice(RISK_LEVELS) for _ in enriched.index]
    return enriched


def merge_amr_results(
    df: pd.DataFrame, amr_records: Iterable[dict[str, object]]
) -> pd.DataFrame:
    """Merge AMR gene matches into the main dataframe."""

    amr_df = pd.DataFrame(amr_records)
    return df.merge(amr_df, on="id", how="left")


def build_report(
    sequence_records: Iterable[dict[str, object]],
    *,
    amr_results: Iterable[dict[str, object]],
    seed: int | None = None,
    pathogen_reference: pd.DataFrame | None = None,
    submission_metadata: dict[str, object] | None = None,
) -> pd.DataFrame:
    """Return a consolidated DataFrame representing the pipeline output."""

    base_df = _ensure_dataframe(sequence_records)
    classified_df = classify_dataframe(base_df, reference_df=pathogen_reference)
    with_amr = merge_amr_results(classified_df, amr_results)
    final_df = attach_resistance_risk(with_amr, seed=seed)

    # Attach submission-level metadata as repeated columns for downstream artefacts.
    metadata = submission_metadata or {}
    sample_id = str(metadata.get("sample_id") or "")
    notes = str(metadata.get("notes") or "")
    final_df = final_df.copy()
    final_df["sample_id"] = sample_id
    final_df["notes"] = notes

    # Reorder columns for readability
    columns = [
        "id",
        "sample_id",
        "notes",
        "sequence",
        "length",
        "ambiguous",
        "qc_flags",
        "gc_content",
        "predicted_species",
        "species_identity",
        "species_coverage",
        "species_score",
        "amr_gene",
        "amr_identity",
        "amr_coverage",
        "amr_score",
        "similarity",
        "resistance_risk",
    ]
    existing_columns = [col for col in columns if col in final_df.columns]
    return final_df[existing_columns]


def save_report(df: pd.DataFrame, output_csv: str | Path) -> Path:
    """Persist the report dataframe to disk."""

    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    return output_path
