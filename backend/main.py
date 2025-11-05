"""FastAPI entry point for the VetPathogen backend service."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.amr_detection import load_reference as load_amr_reference
from backend.classify_pathogen import load_reference as load_pathogen_reference
from backend.database import init_db
from backend.job_runner import create_job_runner
from backend.sequence_handler import load_sequences_from_string

DATA_DIR = Path("data")
AMR_REFERENCE_CSV = DATA_DIR / "resistance_genes_reference.csv"
PATHOGEN_REFERENCE_CSV = DATA_DIR / "pathogen_reference.csv"

app = FastAPI(
    title="VetPathogen Backend",
    description="Pipeline integrating sequence parsing, classification, and AMR detection.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()

    if not AMR_REFERENCE_CSV.exists():
        raise RuntimeError(f"AMR reference file missing: {AMR_REFERENCE_CSV}")
    if not PATHOGEN_REFERENCE_CSV.exists():
        raise RuntimeError(f"Pathogen reference file missing: {PATHOGEN_REFERENCE_CSV}")

    amr_reference_df = load_amr_reference(AMR_REFERENCE_CSV)
    pathogen_reference_df = load_pathogen_reference(PATHOGEN_REFERENCE_CSV)

    app.state.amr_reference_df = amr_reference_df
    app.state.pathogen_reference_df = pathogen_reference_df
    app.state.job_runner = create_job_runner(
        amr_reference_df=amr_reference_df,
        pathogen_reference_df=pathogen_reference_df,
        output_dir=DATA_DIR,
    )


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze/")
async def analyze_sequences(
    fasta: UploadFile = File(...),
    seed: Annotated[int | None, Query(description="Optional seed for deterministic risk scoring")] = None,
    sample_id: Annotated[str | None, Form(description="Optional sample identifier")] = None,
    notes: Annotated[str | None, Form(description="Optional submission notes")] = None,
) -> dict[str, object]:
    contents = await fasta.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        fasta_text = contents.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Unable to decode uploaded FASTA file.") from exc

    # Quick validation to surface issues early
    if not load_sequences_from_string(fasta_text):
        raise HTTPException(status_code=400, detail="No sequences found in FASTA.")

    job_runner = getattr(app.state, "job_runner", None)
    if job_runner is None:
        raise HTTPException(status_code=500, detail="Job runner not initialised.")

    submission_metadata = {
        key: value.strip()
        for key, value in {
            "sample_id": sample_id if sample_id is not None else None,
            "notes": notes if notes is not None else None,
        }.items()
        if isinstance(value, str) and value.strip()
    }

    job_id, payload = job_runner.enqueue(fasta_text, seed, metadata=submission_metadata)
    job_info = job_runner.get_job(job_id) or {"status": "unknown"}

    response: dict[str, object] = {
        "job_id": job_id,
        "status": job_info.get("status", "unknown"),
        "pipeline_version": job_info.get("pipeline_version"),
        "report_path": job_info.get("report_path"),
        "summary_path": job_info.get("summary_path"),
        "pdf_path": job_info.get("pdf_path"),
        "metadata": job_info.get("reference_metadata"),
        "results": job_info.get("results") or [],
        "count": len(job_info.get("results") or []),
    }

    if payload:
        if payload.get("results") is not None:
            response["results"] = payload["results"]
            response["count"] = len(payload["results"])  # type: ignore[arg-type]
        if payload.get("report_path"):
            response["report_path"] = payload["report_path"]
        if payload.get("summary_path"):
            response["summary_path"] = payload["summary_path"]
        if payload.get("pdf_path"):
            response["pdf_path"] = payload["pdf_path"]
        if payload.get("metadata"):
            response["metadata"] = payload["metadata"]
            response["pipeline_version"] = payload["metadata"].get("pipeline_version")
        if payload.get("error"):
            response["error"] = payload["error"]
            response["status"] = payload.get("status", response["status"])

    if job_info.get("error"):
        response["error"] = job_info["error"]

    # Normalise download paths to API endpoints for the client
    if job_id:
        response["report_path"] = f"/jobs/{job_id}/report"
        if job_info.get("summary_path") or payload and payload.get("summary_path"):
            response["summary_path"] = f"/jobs/{job_id}/summary"
        if job_info.get("pdf_path") or payload and payload.get("pdf_path"):
            response["pdf_path"] = f"/jobs/{job_id}/pdf"

    return response


@app.get("/jobs")
def list_jobs(limit: int = 20) -> dict[str, object]:
    job_runner = getattr(app.state, "job_runner", None)
    if job_runner is None:
        raise HTTPException(status_code=500, detail="Job runner not initialised.")
    jobs = job_runner.list_jobs(limit=limit)
    return {"items": jobs}


@app.get("/jobs/{job_id}")
def job_detail(job_id: str) -> dict[str, object]:
    job_runner = getattr(app.state, "job_runner", None)
    if job_runner is None:
        raise HTTPException(status_code=500, detail="Job runner not initialised.")
    job = job_runner.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/jobs/{job_id}/report")
def download_job_report(job_id: str) -> FileResponse:
    job_runner = getattr(app.state, "job_runner", None)
    if job_runner is None:
        raise HTTPException(status_code=500, detail="Job runner not initialised.")
    job = job_runner.get_job(job_id)
    if job is None or not job.get("report_path"):
        raise HTTPException(status_code=404, detail="Report not found for this job.")

    report_path = Path(str(job["report_path"]))
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report file missing on disk.")

    return FileResponse(report_path, media_type="text/csv", filename=report_path.name)


@app.get("/jobs/{job_id}/summary")
def download_job_summary(job_id: str) -> FileResponse:
    job_runner = getattr(app.state, "job_runner", None)
    if job_runner is None:
        raise HTTPException(status_code=500, detail="Job runner not initialised.")
    job = job_runner.get_job(job_id)
    summary_path = job.get("summary_path") if job else None
    if summary_path is None:
        raise HTTPException(status_code=404, detail="Summary not available for this job.")
    path = Path(str(summary_path))
    if not path.exists():
        raise HTTPException(status_code=404, detail="Summary file missing on disk.")
    return FileResponse(path, media_type="text/csv", filename=path.name)


@app.get("/jobs/{job_id}/pdf")
def download_job_pdf(job_id: str) -> FileResponse:
    job_runner = getattr(app.state, "job_runner", None)
    if job_runner is None:
        raise HTTPException(status_code=500, detail="Job runner not initialised.")
    job = job_runner.get_job(job_id)
    pdf_path = job.get("pdf_path") if job else None
    if pdf_path is None:
        raise HTTPException(status_code=404, detail="PDF report not available for this job.")
    path = Path(str(pdf_path))
    if not path.exists():
        raise HTTPException(status_code=404, detail="PDF file missing on disk.")
    return FileResponse(path, media_type="application/pdf", filename=path.name)


@app.get("/report")
def download_latest_report() -> FileResponse:
    latest_report = DATA_DIR / "report.csv"
    if not latest_report.exists():
        raise HTTPException(status_code=404, detail="No report generated yet.")
    return FileResponse(latest_report, media_type="text/csv", filename=latest_report.name)
