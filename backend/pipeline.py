"""Pipeline orchestration helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd

from backend.amr_detection import detect_amr_genes
from backend.report import build_report, save_report
from backend.report_builder import (
    PIPELINE_VERSION,
    build_reference_metadata,
    build_summary,
    build_pdf_report,
    save_summary_csv,
)
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
) -> tuple[pd.DataFrame, Path, Optional[Path], Optional[Path], dict[str, object]]:
    """Execute the VetPathogen pipeline and persist job-specific artefacts."""

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
    latest_report_path = output_dir / "report.csv"
    save_report(report_df, latest_report_path)

    summary = build_summary(report_df)
    summary_path: Optional[Path] = None
    if summary["sequence_count"]:
        summary_path = output_dir / f"summary_{job_id}.csv"
        save_summary_csv(summary, summary_path)

    metadata = build_reference_metadata()
    metadata["references"] = {
        "amr_reference": str(amr_reference_df.shape[0]) + " genes",
        "pathogen_reference": str(pathogen_reference_df.shape[0]) + " species",
    }
    metadata["pipeline_version"] = PIPELINE_VERSION

    pdf_path: Optional[Path] = None
    try:
        pdf_path = output_dir / f"report_{job_id}.pdf"
        build_pdf_report(report_df, summary, metadata, pdf_path)
    except Exception:
        pdf_path = None

    return report_df, job_report_path, summary_path, pdf_path, metadata
