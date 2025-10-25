"""Background job runner for VetPathogen."""

from __future__ import annotations

import asyncio
import os
from pathlib import Path
from typing import Optional

from backend.database import (
    SessionLocal,
    create_job,
    get_job,
    list_jobs as list_jobs_db,
    mark_job_completed,
    mark_job_failed,
    mark_job_running,
)
from backend.pipeline import run_pipeline
from backend.report_builder import PIPELINE_VERSION


class JobRunner:
    """Manage analysis jobs with optional async execution."""

    def __init__(
        self,
        *,
        amr_reference_df,
        pathogen_reference_df,
        output_dir: Path,
        async_enabled: bool = False,
    ) -> None:
        self.amr_reference_df = amr_reference_df
        self.pathogen_reference_df = pathogen_reference_df
        self.output_dir = output_dir
        self.async_enabled = async_enabled
        self.tasks: dict[str, asyncio.Task] = {}

    def enqueue(self, fasta_text: str, seed: Optional[int]) -> tuple[str, Optional[dict[str, object]]]:
        """Create a job record and either enqueue or run immediately."""

        with SessionLocal() as session:
            job = create_job(session, seed)
            job_id = job.id

        if self.async_enabled:
            loop = asyncio.get_running_loop()
            task = loop.create_task(self._run_job_async(job_id, fasta_text, seed))
            self.tasks[job_id] = task
            return job_id, None

        result = self._run_job_sync(job_id, fasta_text, seed)
        return job_id, result

    def get_job(self, job_id: str) -> Optional[dict[str, object]]:
        with SessionLocal() as session:
            job = get_job(session, job_id)
            return job.as_dict() if job else None

    def list_jobs(self, *, limit: int = 20) -> list[dict[str, object]]:
        with SessionLocal() as session:
            return [job.as_dict() for job in list_jobs_db(session, limit=limit)]

    async def _run_job_async(self, job_id: str, fasta_text: str, seed: Optional[int]) -> None:
        await asyncio.to_thread(self._run_job_sync, job_id, fasta_text, seed)

    def _run_job_sync(self, job_id: str, fasta_text: str, seed: Optional[int]) -> dict[str, object]:
        with SessionLocal() as session:
            mark_job_running(session, job_id)

        try:
            (
                report_df,
                report_path,
                summary_path,
                pdf_path,
                metadata,
            ) = run_pipeline(
                fasta_text,
                seed=seed,
                amr_reference_df=self.amr_reference_df,
                pathogen_reference_df=self.pathogen_reference_df,
                output_dir=self.output_dir,
                job_id=job_id,
            )
            results = report_df.to_dict(orient="records")
            with SessionLocal() as session:
                mark_job_completed(
                    session,
                    job_id,
                    pipeline_version=PIPELINE_VERSION,
                    reference_metadata=metadata,
                    report_path=str(report_path),
                    summary_path=str(summary_path) if summary_path else None,
                    pdf_path=str(pdf_path) if pdf_path else None,
                    results=results,
                )
            return {
                "status": "completed",
                "results": results,
                "report_path": str(report_path),
                "summary_path": str(summary_path) if summary_path else None,
                "pdf_path": str(pdf_path) if pdf_path else None,
                "metadata": metadata,
            }
        except Exception as exc:  # broad catch to persist failure
            message = str(exc)
            with SessionLocal() as session:
                mark_job_failed(session, job_id, message)
            return {
                "status": "failed",
                "error": message,
            }


def create_job_runner(amr_reference_df, pathogen_reference_df, output_dir: Path) -> JobRunner:
    async_enabled = os.getenv("VETPATHOGEN_ASYNC", "false").lower() == "true"
    return JobRunner(
        amr_reference_df=amr_reference_df,
        pathogen_reference_df=pathogen_reference_df,
        output_dir=output_dir,
        async_enabled=async_enabled,
    )
