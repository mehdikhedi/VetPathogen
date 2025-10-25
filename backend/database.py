"""Database utilities for VetPathogen."""

from __future__ import annotations

import json
import os
from contextlib import contextmanager
from datetime import datetime
from typing import Generator, Iterable
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Text, create_engine, select
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DATABASE_URL = os.getenv("VETPATHOGEN_DATABASE_URL", "sqlite:///data/vetpathogen.db")
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=CONNECT_ARGS, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid4()))
    status = Column(String(32), nullable=False, default="pending")
    seed = Column(String(32), nullable=True)
    pipeline_version = Column(String(50), nullable=True)
    reference_metadata = Column(Text, nullable=True)
    report_path = Column(String(255), nullable=True)
    summary_path = Column(String(255), nullable=True)
    pdf_path = Column(String(255), nullable=True)
    results_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def as_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "status": self.status,
            "seed": self.seed,
            "pipeline_version": self.pipeline_version,
            "reference_metadata": json.loads(self.reference_metadata) if self.reference_metadata else None,
            "report_path": self.report_path,
            "summary_path": self.summary_path,
            "pdf_path": self.pdf_path,
            "results": json.loads(self.results_json) if self.results_json else None,
            "error": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def init_db() -> None:
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def create_job(session: Session, seed: int | None) -> AnalysisJob:
    job = AnalysisJob(id=str(uuid4()), status="pending", seed=str(seed) if seed is not None else None)
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


def mark_job_running(session: Session, job_id: str) -> AnalysisJob | None:
    job = session.get(AnalysisJob, job_id)
    if job is None:
        return None
    job.status = "running"
    job.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(job)
    return job


def mark_job_completed(
    session: Session,
    job_id: str,
    *,
    pipeline_version: str,
    reference_metadata: dict[str, object],
    report_path: str,
    summary_path: str | None,
    pdf_path: str | None,
    results: Iterable[dict[str, object]],
) -> AnalysisJob | None:
    job = session.get(AnalysisJob, job_id)
    if job is None:
        return None
    job.status = "completed"
    job.pipeline_version = pipeline_version
    job.reference_metadata = json.dumps(reference_metadata)
    job.report_path = report_path
    job.summary_path = summary_path
    job.pdf_path = pdf_path
    job.results_json = json.dumps(list(results))
    job.error_message = None
    job.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(job)
    return job


def mark_job_failed(session: Session, job_id: str, error_message: str) -> AnalysisJob | None:
    job = session.get(AnalysisJob, job_id)
    if job is None:
        return None
    job.status = "failed"
    job.error_message = error_message
    job.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(job)
    return job


def get_job(session: Session, job_id: str) -> AnalysisJob | None:
    return session.get(AnalysisJob, job_id)


def list_jobs(session: Session, *, limit: int = 20) -> list[AnalysisJob]:
    stmt = select(AnalysisJob).order_by(AnalysisJob.created_at.desc()).limit(limit)
    return list(session.execute(stmt).scalars())
