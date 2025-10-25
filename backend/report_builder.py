"""Utilities for generating VetPathogen reports."""

from __future__ import annotations

from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Iterable

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

PIPELINE_VERSION = "0.4.0"


def build_summary(report_df: pd.DataFrame) -> dict[str, object]:
    species_counts = Counter(report_df.get("predicted_species", [])).most_common()
    amr_counts = Counter(report_df.get("amr_gene", [])).most_common()
    return {
        "sequence_count": int(len(report_df)),
        "species_counts": species_counts,
        "amr_counts": amr_counts,
    }


def save_summary_csv(summary: dict[str, object], output_path: Path) -> Path:
    rows = []
    for label, counts in ("species", summary.get("species_counts", [])), ("amr_gene", summary.get("amr_counts", [])):
        for name, count in counts:
            rows.append({"category": label, "name": name, "count": count})
    if rows:
        df = pd.DataFrame(rows)
        df.to_csv(output_path, index=False)
    else:
        output_path.write_text("category,name,count\n")
    return output_path


def build_pdf_report(
    report_df: pd.DataFrame,
    summary: dict[str, object],
    reference_metadata: dict[str, object],
    output_path: Path,
) -> Path:
    doc = SimpleDocTemplate(str(output_path), pagesize=letter)
    styles = getSampleStyleSheet()
    elements: list = []

    title = Paragraph("VetPathogen Analysis Report", styles["Title"])
    elements.append(title)
    elements.append(Spacer(1, 12))

    meta_lines = [
        f"Generated: {datetime.utcnow().isoformat()} UTC",
        f"Pipeline Version: {reference_metadata.get('pipeline_version', PIPELINE_VERSION)}",
    ]
    ref_info = reference_metadata.get("references", {}) if reference_metadata else {}
    if ref_info:
        meta_lines.append("References: " + ", ".join(f"{k}: {v}" for k, v in ref_info.items()))

    for line in meta_lines:
        elements.append(Paragraph(line, styles["Normal"]))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("Summary", styles["Heading2"]))
    elements.append(Paragraph(f"Sequences analysed: {summary.get('sequence_count', 0)}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    if report_df.empty:
        elements.append(Paragraph("No sequences were processed.", styles["Normal"]))
    else:
        table_data = [[
            "Sample ID",
            "Predicted Species",
            "Species Identity %",
            "AMR Gene",
            "AMR Identity %",
            "Resistance Risk",
        ]]
        for row in report_df.itertuples():
            table_data.append(
                [
                    row.id,
                    str(row.predicted_species).replace("_", " "),
                    f"{getattr(row, 'species_identity', 0):.2f}",
                    row.amr_gene,
                    f"{getattr(row, 'amr_identity', 0):.2f}",
                    row.resistance_risk,
                ]
            )
        table = Table(table_data, repeatRows=1)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("ALIGN", (2, 1), (4, -1), "RIGHT"),
                ]
            )
        )
        elements.append(table)

    doc.build(elements)
    return output_path


def build_reference_metadata() -> dict[str, object]:
    return {
        "pipeline_version": PIPELINE_VERSION,
        "generated_at": datetime.utcnow().isoformat(),
    }
