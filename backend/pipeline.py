"""Pipeline orchestration helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd

from backend.amr_detection import detect_amr_genes
from backend.report import build_report, save_report
from backend.sequence_handler import load_sequences_from_string


class PipelineError(RuntimeError):
    """Raised when the analysis pipeline fails."""


def run_pipeline(
    fasta_text: str,
    *,
    seed: Optional[int],
    amr_reference_df: pd.DataFrame,
    pathogen_reference_df: pd.DataFrame,
    output_dir: Path,
    job_id: str,
) -> tuple[pd.DataFrame, Path]:
    """Execute the VetPathogen pipeline and persist a job-specific report."""

    sequences = load_sequences_from_string(fasta_text)
    if not sequences:
        raise PipelineError("No sequences found in FASTA input.")

    amr_matches = detect_amr_genes(sequences, amr_reference_df)
    report_df = build_report(
        sequences,
        amr_results=amr_matches,
        seed=seed,
        pathogen_reference=pathogen_reference_df,
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    job_report_path = output_dir / f"report_{job_id}.csv"
    save_report(report_df, job_report_path)

    # Update the default location for backwards compatibility
    latest_report_path = output_dir / "report.csv"
    save_report(report_df, latest_report_path)

    return report_df, job_report_path
