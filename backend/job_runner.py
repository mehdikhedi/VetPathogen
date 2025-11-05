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

    @staticmethod
    def _clean_metadata(metadata: Optional[dict[str, object]]) -> dict[str, object]:
        if not metadata:
            return {}
        cleaned: dict[str, object] = {}
        for key, value in metadata.items():
            if value is None:
                continue
            if isinstance(value, str):
                trimmed = value.strip()
                if not trimmed:
                    continue
                cleaned[key] = trimmed
            else:
                cleaned[key] = value
        return cleaned

    def enqueue(
        self,
        fasta_text: str,
        seed: Optional[int],
        *,
        metadata: Optional[dict[str, object]] = None,
    ) -> tuple[str, Optional[dict[str, object]]]:
        """Create a job record and either enqueue or run immediately."""

        cleaned_metadata = self._clean_metadata(metadata)
        with SessionLocal() as session:
            job = create_job(session, seed, metadata=cleaned_metadata)
            job_id = job.id

        if self.async_enabled:
            loop = asyncio.get_running_loop()
            task = loop.create_task(self._run_job_async(job_id, fasta_text, seed, cleaned_metadata))
            self.tasks[job_id] = task
            return job_id, None

        result = self._run_job_sync(job_id, fasta_text, seed, cleaned_metadata)
        return job_id, result

    def get_job(self, job_id: str) -> Optional[dict[str, object]]:
        with SessionLocal() as session:
            job = get_job(session, job_id)
            return job.as_dict() if job else None

    def list_jobs(self, *, limit: int = 20) -> list[dict[str, object]]:
        with SessionLocal() as session:
            return [job.as_dict() for job in list_jobs_db(session, limit=limit)]

    async def _run_job_async(
        self,
        job_id: str,
        fasta_text: str,
        seed: Optional[int],
        metadata: Optional[dict[str, object]] = None,
    ) -> None:
        await asyncio.to_thread(self._run_job_sync, job_id, fasta_text, seed, metadata)

    def _run_job_sync(
        self,
        job_id: str,
        fasta_text: str,
        seed: Optional[int],
        metadata: Optional[dict[str, object]] = None,
    ) -> dict[str, object]:
        extra_metadata = metadata or {}
        with SessionLocal() as session:
            mark_job_running(session, job_id)

        try:
            (
                report_df,
                report_path,
                summary_path,
                pdf_path,
                pipeline_metadata,
            ) = run_pipeline(
                fasta_text,
                seed=seed,
                amr_reference_df=self.amr_reference_df,
                pathogen_reference_df=self.pathogen_reference_df,
                output_dir=self.output_dir,
                job_id=job_id,
            )
            combined_metadata = dict(pipeline_metadata or {})
            combined_metadata.update(extra_metadata)
            results = report_df.to_dict(orient="records")
            with SessionLocal() as session:
                mark_job_completed(
                    session,
                    job_id,
                    pipeline_version=PIPELINE_VERSION,
                    reference_metadata=combined_metadata,
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
                "metadata": combined_metadata,
            }
        except Exception as exc:  # broad catch to persist failure
            message = str(exc)
            with SessionLocal() as session:
                mark_job_failed(session, job_id, message)
            failure_payload = {
                "status": "failed",
                "error": message,
            }
            if extra_metadata:
                failure_payload["metadata"] = extra_metadata
            return failure_payload


def create_job_runner(amr_reference_df, pathogen_reference_df, output_dir: Path) -> JobRunner:
    async_enabled = os.getenv("VETPATHOGEN_ASYNC", "false").lower() == "true"
    return JobRunner(
        amr_reference_df=amr_reference_df,
        pathogen_reference_df=pathogen_reference_df,
        output_dir=output_dir,
        async_enabled=async_enabled,
    )
