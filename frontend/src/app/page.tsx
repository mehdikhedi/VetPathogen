"use client";

import { useMemo, useState, useEffect, useCallback } from "react";

import { GCPlot } from "@/components/GCPlot";
import { ResultsTable } from "@/components/ResultsTable";
import { UploadSection } from "@/components/UploadSection";
import { JobHistory } from "@/components/JobHistory";
import type {
  AnalysisMetadata,
  AnalysisResponse,
  AnalysisResult,
  AnalysisJob,
} from "@/types";

const DEFAULT_ENDPOINT = "http://127.0.0.1:8000";

export default function Home() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [reportPath, setReportPath] = useState<string | undefined>();
  const [summaryPath, setSummaryPath] = useState<string | undefined>();
  const [pdfPath, setPdfPath] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<AnalysisMetadata | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_ENDPOINT;
    try {
      return new URL(raw).origin;
    } catch (err) {
      console.warn("Invalid NEXT_PUBLIC_BACKEND_URL, falling back to default.", err);
      return new URL(DEFAULT_ENDPOINT).origin;
    }
  }, []);

  const apiUrl = useCallback((path: string) => `${baseUrl}${path}`, [baseUrl]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/jobs"));
      if (!res.ok) return;
      const data = await res.json();
      setJobs((data.items as AnalysisJob[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  }, [apiUrl]);

  const loadJob = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(apiUrl(`/jobs/${id}`));
        if (!res.ok) throw new Error(await res.text());
        const job = (await res.json()) as AnalysisJob;
        setJobId(job.id);
        setJobStatus(job.status);
        setJobError(job.error ?? null);
        const results = (job.results as AnalysisResult[] | undefined) ?? [];
        setResults(results);
        setReportPath(job.report_path ?? undefined);
        setSummaryPath(job.summary_path ?? undefined);
        setPdfPath(job.pdf_path ?? undefined);
        setMetadata(job.reference_metadata ?? null);
      } catch (err) {
        console.error("Failed to load job", err);
        setError("Unable to load selected job");
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAnalyze = async ({
    file,
    seed,
    sampleId,
    notes,
  }: {
    file: File;
    seed?: number;
    sampleId?: string;
    notes?: string;
  }) => {
    setLoading(true);
    setError(null);
    setJobError(null);

    try {
      const formData = new FormData();
      formData.append("fasta", file);
      if (seed !== undefined) {
        formData.append("seed", String(seed));
      }
      if (sampleId) {
        formData.append("sample_id", sampleId);
      }
      if (notes) {
        formData.append("notes", notes);
      }

      const response = await fetch(apiUrl("/analyze/"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const detail = await response
          .json()
          .then((json) => json.detail ?? response.statusText)
          .catch(() => response.statusText);
        throw new Error(detail || "Analysis failed.");
      }

      const payload = (await response.json()) as AnalysisResponse;
      setJobId(payload.job_id ?? null);
      setJobStatus(payload.status ?? null);
      setJobError(payload.error ?? null);
      const meta: AnalysisMetadata = {
        ...(payload.metadata ?? {}),
        notes,
        sample_id: sampleId,
      };
      setMetadata(meta);
      setResults(payload.results ?? []);
      setReportPath(payload.report_path);
      setSummaryPath(payload.summary_path);
      setPdfPath(payload.pdf_path);

      fetchJobs();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
      setResults([]);
      setReportPath(undefined);
      setSummaryPath(undefined);
      setPdfPath(undefined);
      setMetadata(null);
      setJobId(null);
      setJobStatus(null);
      setJobError(null);
    } finally {
      setLoading(false);
    }
  };

  const csvUrl = reportPath
    ? apiUrl(reportPath.startsWith("/") ? reportPath : `/jobs/${jobId}/report`)
    : undefined;
  const summaryUrl = summaryPath
    ? apiUrl(summaryPath.startsWith("/") ? summaryPath : `/jobs/${jobId}/summary`)
    : undefined;
  const pdfUrl = pdfPath
    ? apiUrl(pdfPath.startsWith("/") ? pdfPath : `/jobs/${jobId}/pdf`)
    : undefined;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            VetPathogen
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Veterinary Pathogen Analysis &amp; AMR Insights
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Upload FASTA sequences to run the integrated VetPathogen pipeline. The backend
            parses sequences, classifies likely pathogens, detects similar AMR genes, and
            estimates antimicrobial resistance risk levels.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <UploadSection loading={loading} onSubmit={handleAnalyze} />

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {jobId ? (
              <JobStatusCard
                jobId={jobId}
                status={jobStatus}
                error={jobError}
                metadata={metadata}
              />
            ) : null}

            <ResultsTable results={results} />

            <GCPlot results={results} />

            <ReportDownloadCard
              csvUrl={csvUrl}
              summaryUrl={summaryUrl}
              pdfUrl={pdfUrl}
              hasResults={results.length > 0}
            />
          </div>

          <div className="space-y-6">
            <JobHistory
              jobs={jobs}
              onRefresh={fetchJobs}
              onSelect={loadJob}
              activeJobId={jobId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// JobStatusCard and ReportDownloadCard remain unchanged from previous version

type JobStatusCardProps = {
  jobId: string;
  status: string | null;
  error: string | null;
  metadata: AnalysisMetadata | null;
};

function JobStatusCard({ jobId, status, error, metadata }: JobStatusCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
      <p className="font-medium text-slate-800">Job ID: {jobId}</p>
      <p className="mt-1 text-xs text-slate-500">Current status: {status ?? "unknown"}</p>
      {metadata?.pipeline_version ? (
        <p className="mt-1 text-xs text-slate-500">
          Pipeline version: {metadata.pipeline_version}
        </p>
      ) : null}
      {metadata?.sample_id ? (
        <p className="mt-1 text-xs text-slate-500">Sample: {metadata.sample_id}</p>
      ) : null}
      {metadata?.notes ? (
        <p className="mt-1 text-xs text-slate-500">Notes: {metadata.notes}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : status !== "completed" ? (
        <p className="mt-2 text-xs text-slate-500">
          Results will appear automatically once processing completes. Refresh this page or
          check the job status endpoint for updates.
        </p>
      ) : null}
    </section>
  );
}

type ReportDownloadCardProps = {
  csvUrl?: string;
  summaryUrl?: string;
  pdfUrl?: string;
  hasResults: boolean;
};

function ReportDownloadCard({ csvUrl, summaryUrl, pdfUrl, hasResults }: ReportDownloadCardProps) {
  if (!hasResults) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-medium text-slate-800">Analysis Artefacts</p>
          <p className="mt-1 text-xs text-slate-500">
            Download detailed CSV, summary counts, and a PDF overview generated for this job.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {csvUrl ? (
            <a
              href={csvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              Download CSV
            </a>
          ) : null}
          {summaryUrl ? (
            <a
              href={summaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Summary CSV
            </a>
          ) : null}
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              PDF Report
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
