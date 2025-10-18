"""FastAPI entry point for the VetPathogen backend service."""

from __future__ import annotations

from io import StringIO
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from backend.amr_detection import detect_amr_genes, load_reference
from backend.report import build_report, save_report
from backend.sequence_handler import load_sequences_from_string

DATA_DIR = Path("data")
REFERENCE_CSV = DATA_DIR / "resistance_genes_reference.csv"
REPORT_CSV = DATA_DIR / "report.csv"

app = FastAPI(
    title="VetPathogen Backend",
    description="Mock pipeline integrating sequence parsing, classification, and AMR detection.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _load_reference() -> None:
    """Load the AMR reference catalog at startup."""

    if not REFERENCE_CSV.exists():
        raise RuntimeError(f"Reference file missing: {REFERENCE_CSV}")
    app.state.reference_df = load_reference(REFERENCE_CSV)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    """Simple health endpoint for monitoring."""

    return {"status": "ok"}


@app.post("/analyze/")
async def analyze_sequences(
    fasta: UploadFile = File(...),
    seed: Annotated[int | None, Query(description="Optional seed for deterministic risk scoring")] = None,
) -> dict[str, object]:
    """Accept a FASTA upload, run the pipeline, and return structured results."""

    contents = await fasta.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        fasta_text = contents.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Unable to decode uploaded FASTA file.") from exc

    sequences = load_sequences_from_string(fasta_text)
    if not sequences:
        raise HTTPException(status_code=400, detail="No sequences found in FASTA.")

    reference_df = getattr(app.state, "reference_df", None)
    if reference_df is None:
        raise HTTPException(status_code=500, detail="Reference data not loaded.")

    amr_matches = detect_amr_genes(sequences, reference_df)
    report_df = build_report(sequences, amr_results=amr_matches, seed=seed)
    save_path = save_report(report_df, REPORT_CSV)

    return {
        "count": len(report_df),
        "report_path": str(save_path),
        "results": report_df.to_dict(orient="records"),
    }
