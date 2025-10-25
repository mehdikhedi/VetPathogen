"use client";

import { useMemo, useState } from "react";

import { GCPlot } from "@/components/GCPlot";
import { ResultsTable } from "@/components/ResultsTable";
import { UploadSection } from "@/components/UploadSection";
import type { AnalysisResponse, AnalysisResult, AnalysisMetadata } from "@/types";

const DEFAULT_ENDPOINT = "http://127.0.0.1:8000/analyze/";

export default function Home() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [reportPath, setReportPath] = useState<string | undefined>();
  const [summaryPath, setSummaryPath] = useState<string | undefined>();
  const [pdfPath, setPdfPath] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<AnalysisMetadata | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_ENDPOINT;
    try {
      return new URL(base);
    } catch (err) {
      console.warn("Invalid NEXT_PUBLIC_BACKEND_URL, falling back to default.", err);
      return new URL(DEFAULT_ENDPOINT);
    }
  }, []);

  const handleAnalyze = async ({ file, seed }: { file: File; seed?: number }) => {
    setLoading(true);
    setError(null);
    setJobError(null);

    try {
      const formData = new FormData();
      formData.append("fasta", file);

      const target = new URL(endpoint.toString());
      if (seed !== undefined) {
        target.searchParams.set("seed", String(seed));
      }

      const response = await fetch(target.toString(), {
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
      setResults(payload.results ?? []);
      setReportPath(payload.report_path);
      setSummaryPath(payload.summary_path);
      setPdfPath(payload.pdf_path);
      setMetadata(payload.metadata ?? null);
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

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
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
          endpoint={endpoint}
          reportPath={reportPath}
          summaryPath={summaryPath}
          pdfPath={pdfPath}
          hasResults={results.length > 0}
          jobId={jobId}
        />
      </div>
    </main>
  );
}

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
  endpoint: URL;
  jobId: string | null;
  reportPath?: string;
  summaryPath?: string;
  pdfPath?: string;
  hasResults: boolean;
};

function ReportDownloadCard({
  endpoint,
  jobId,
  reportPath,
  summaryPath,
  pdfPath,
  hasResults,
}: ReportDownloadCardProps) {
  if (!hasResults) {
    return null;
  }

  const baseOrigin = endpoint.origin;
  const buildUrl = (path?: string) => {
    if (!path) return undefined;
    try {
      return new URL(path, baseOrigin).toString();
    } catch {
      return path;
    }
  };

  const csvUrl = buildUrl(reportPath ?? (jobId ? `/jobs/${jobId}/report` : "/report"));
  const summaryUrl = buildUrl(summaryPath ?? (jobId ? `/jobs/${jobId}/summary` : undefined));
  const pdfUrl = buildUrl(pdfPath ?? (jobId ? `/jobs/${jobId}/pdf` : undefined));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
      <div className="flex flex-col gap-3">
        <div>
          <p>
            Analysis complete. The backend stored the latest CSV report at {" "}
            <span className="font-semibold text-slate-900">
              {reportPath ?? (jobId ? `data/report_${jobId}.csv` : "data/report.csv")}
            </span>
            .
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Download the artefacts to review results offline or share with colleagues.
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
