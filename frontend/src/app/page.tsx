"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { GCPlot } from "@/components/GCPlot";
import { JobHistory } from "@/components/JobHistory";
import { ResultsTable } from "@/components/ResultsTable";
import type {
  AnalysisJob,
  AnalysisMetadata,
  AnalysisResponse,
  AnalysisResult,
} from "@/types";

const DEFAULT_ENDPOINT = "http://127.0.0.1:8000";

type TabKey = "analysis" | "history";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("analysis");
  const [file, setFile] = useState<File | null>(null);
  const [sequenceText, setSequenceText] = useState<string>("");
  const [metadataSampleId, setMetadataSampleId] = useState<string>("");
  const [metadataNotes, setMetadataNotes] = useState<string>("");
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
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

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
      if (process.env.NODE_ENV === "development") {
        console.warn("Unable to fetch jobs from backend. Continuing without history.", err);
      }
    }
  }, [apiUrl]);

  const loadJob = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(apiUrl(`/jobs/${id}`));
        if (!res.ok) throw new Error(await res.text());
        const job = (await res.json()) as AnalysisJob & { results?: AnalysisResult[] };
        setJobId(job.id);
        setJobStatus(job.status);
        setJobError(job.error ?? null);
        const jobResults = job.results ?? [];
        setResults(jobResults);
        setReportPath(job.report_path ?? undefined);
        setSummaryPath(job.summary_path ?? undefined);
        setPdfPath(job.pdf_path ?? undefined);
        setMetadata(job.reference_metadata ?? null);
        setActiveTab("analysis");
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

  useEffect(() => {
    if (jobStatus === "completed" && results.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [jobStatus, results]);

  const handleFileChange = useCallback((selected: File | null) => {
    setFile(selected);
    if (!selected) {
      setSequenceText("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const value = event.target?.result;
      if (typeof value === "string") {
        setSequenceText(value);
      } else if (value instanceof ArrayBuffer) {
        const decoder = new TextDecoder();
        setSequenceText(decoder.decode(value));
      }
    };
    reader.readAsText(selected);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
      const droppedFile = event.dataTransfer.files?.[0] ?? null;
      handleFileChange(droppedFile);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  }, [isDragActive]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isDragActive) {
      setIsDragActive(false);
    }
  }, [isDragActive]);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setJobError(null);

    try {
      let fileToSend = file;
      if (!fileToSend && sequenceText.trim()) {
        fileToSend = new File([sequenceText.trim()], "pasted_sequence.fasta", {
          type: "text/plain",
        });
      }

      if (!fileToSend) {
        throw new Error("Provide a FASTA file or sequence text.");
      }

      const formData = new FormData();
      formData.append("fasta", fileToSend);
      if (metadataSampleId.trim()) {
        formData.append("sample_id", metadataSampleId.trim());
      }
      if (metadataNotes.trim()) {
        formData.append("notes", metadataNotes.trim());
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
      setMetadata(payload.metadata ?? null);
      setResults(payload.results ?? []);
      setReportPath(payload.report_path);
      setSummaryPath(payload.summary_path);
      setPdfPath(payload.pdf_path);
      setActiveTab("analysis");

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
  }, [apiUrl, fetchJobs, file, metadataNotes, metadataSampleId, sequenceText]);

  const csvUrl = useMemo(() => {
    if (!reportPath) return undefined;
    return reportPath.startsWith("/") ? apiUrl(reportPath) : apiUrl(`/jobs/${jobId}/report`);
  }, [apiUrl, reportPath, jobId]);

  const summaryUrl = useMemo(() => {
    if (!summaryPath) return undefined;
    return summaryPath.startsWith("/") ? apiUrl(summaryPath) : apiUrl(`/jobs/${jobId}/summary`);
  }, [apiUrl, summaryPath, jobId]);

  const pdfUrl = useMemo(() => {
    if (!pdfPath) return undefined;
    return pdfPath.startsWith("/") ? apiUrl(pdfPath) : apiUrl(`/jobs/${jobId}/pdf`);
  }, [apiUrl, pdfPath, jobId]);

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    handleFileChange(selected);
    if (event.target.value) {
      event.target.value = "";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-blue-50 text-blue-900">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.08)_1px,transparent_0)] bg-[size:24px_24px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center gap-10 px-6 py-10">
        <header className="w-full max-w-5xl border-b border-blue-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-blue-800">VetPathogen</h1>
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "analysis"
                    ? "bg-blue-600 text-white shadow"
                    : "text-blue-700 hover:bg-blue-100"
                }`}
                disabled={activeTab === "analysis"}
              >
                Analysis
              </button>
              <button
                onClick={() => {
                  setActiveTab("history");
                  fetchJobs();
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "history"
                    ? "bg-blue-600 text-white shadow"
                    : "text-blue-700 hover:bg-blue-100"
                }`}
                disabled={activeTab === "history" && loading}
              >
                History
              </button>
            </nav>
          </div>
        </header>

        <section className="text-center">
          <h2 className="text-xl font-medium text-blue-900 md:text-2xl">
            Veterinary Pathogen Analysis &amp; AMR Insights
          </h2>
          <p className="mt-1 text-sm text-blue-600 md:text-base">
            Upload your sequence and explore antimicrobial resistance patterns
          </p>
          <p className="mt-3 text-xs text-blue-500 md:text-sm">
            <a
              href="/sample_sequences.fasta"
              download
              className="font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-800"
            >
              Download our demo FASTA
            </a>{" "}
            and drop it into the uploader to try the pipeline instantly.
          </p>
        </section>

        {activeTab === "history" ? (
          <div className="w-full max-w-5xl">
            <div className="rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-md">
              <JobHistory jobs={jobs} onRefresh={fetchJobs} onSelect={loadJob} activeJobId={jobId} />
            </div>
          </div>
        ) : (
          <>
            <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-white/90 shadow-md">
                <div className="border-b border-blue-100 px-6 py-4">
                  <h3 className="text-lg font-semibold text-blue-800">Upload Sequence</h3>
                </div>
                <div
                  className={`space-y-4 px-6 py-5 transition ${isDragActive ? "border-2 border-dashed border-blue-400 bg-blue-50/60" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".fasta,.fa,.txt"
                    onChange={onFileInput}
                    disabled={loading}
                    className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-50"
                  />
                  <div className="relative">
                    <textarea
                      placeholder="Or paste your sequence here..."
                      value={sequenceText}
                      onChange={(event) => setSequenceText(event.target.value)}
                      disabled={loading}
                      className="min-h-[160px] w-full rounded-lg border border-blue-200 bg-white px-3 py-3 text-sm text-blue-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-blue-50"
                    />
                    <div className="pointer-events-none absolute top-2 right-3 text-xs italic text-blue-300">
                      FASTA / Text format
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white/90 shadow-md">
                <div className="border-b border-blue-100 px-6 py-4">
                  <h3 className="text-lg font-semibold text-blue-800">Sample Metadata</h3>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-800" htmlFor="sampleId">
                      Sample ID (optional)
                    </label>
                    <input
                      id="sampleId"
                      type="text"
                      placeholder="e.g. S-2025-001"
                      value={metadataSampleId}
                      onChange={(event) => setMetadataSampleId(event.target.value)}
                      disabled={loading}
                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-800" htmlFor="sampleNotes">
                      Notes (optional)
                    </label>
                    <textarea
                      id="sampleNotes"
                      placeholder="Describe context, collection site, animal species, or notes..."
                      value={metadataNotes}
                      onChange={(event) => setMetadataNotes(event.target.value)}
                      disabled={loading}
                      className="min-h-[120px] w-full rounded-lg border border-blue-200 bg-white px-3 py-3 text-sm text-blue-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-5xl">
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="rounded-xl bg-blue-700 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Analyzing sequence..." : "Analyze Sequence"}
                </button>
              </div>
            </div>

            {error ? (
              <div className="w-full max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                {error}
              </div>
            ) : null}

            <JobStatusCard jobId={jobId} status={jobStatus} error={jobError} metadata={metadata} />

            <section ref={resultsRef} className="w-full max-w-5xl space-y-6">
              <ResultsSummary results={results} metadata={metadata} />
              <ResultsTable results={results} />
              <GCPlot results={results} />
              <ReportDownloadCard
                csvUrl={csvUrl}
                summaryUrl={summaryUrl}
                pdfUrl={pdfUrl}
                hasResults={results.length > 0}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function JobStatusCard({
  jobId,
  status,
  error,
  metadata,
}: {
  jobId: string | null;
  status: string | null;
  error: string | null;
  metadata: AnalysisMetadata | null;
}) {
  if (!jobId) return null;
  return (
    <section className="w-full max-w-5xl">
      <div className="rounded-2xl border border-blue-100 bg-white/90 p-6 text-sm text-blue-900 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-blue-800">Job ID: {jobId}</p>
            <p className="text-xs text-blue-500">Status: {status ?? "unknown"}</p>
          </div>
          {metadata?.pipeline_version ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              v{metadata.pipeline_version}
            </span>
          ) : null}
        </div>
        {metadata?.sample_id ? (
          <p className="mt-3 text-xs text-blue-600/90">Sample ID: {metadata.sample_id}</p>
        ) : null}
        {metadata?.notes ? (
          <p className="mt-1 text-xs text-blue-600/90">Notes: {metadata.notes}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-xs text-red-600">{error}</p>
        ) : status !== "completed" ? (
          <p className="mt-3 text-xs text-blue-500">
            Results will appear automatically once processing completes.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ResultsSummary({
  results,
  metadata,
}: {
  results: AnalysisResult[];
  metadata: AnalysisMetadata | null;
}) {
  if (!results.length) return null;

  const primary = results[0];
  const speciesName = primary.predicted_species
    ? primary.predicted_species.replace(/_/g, " ")
    : "Unknown species";
  const identity = primary.species_identity ?? primary.similarity ?? null;
  const coverage = primary.species_coverage ?? null;
  const gcContent = primary.gc_content ?? null;

  const highRisk = results.some((result) => {
    const similarity = result.similarity ?? 0;
    const amrIdentity = result.amr_identity ?? similarity;
    return Math.max(similarity, amrIdentity) >= 90;
  });

  return (
    <section className="rounded-2xl border border-blue-100 bg-white/90 p-6 text-blue-900 shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-blue-800">{speciesName}</h3>
            {metadata?.sample_id ? (
              <p className="mt-1 text-xs text-blue-500/80">Sample ID: {metadata.sample_id}</p>
            ) : null}
            {metadata?.notes ? (
              <p className="mt-1 text-xs text-blue-500/80">Notes: {metadata.notes}</p>
            ) : null}
          </div>
          {identity !== null ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Identity {identity.toFixed(2)}%
            </span>
          ) : null}
        </div>

        {highRisk ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            High-confidence resistance markers detected across multiple genes. Immediate follow-up
            recommended.
          </div>
        ) : null}

        <div className="grid gap-3 text-xs text-blue-600 md:grid-cols-3">
          {gcContent !== null ? <span>GC content: {gcContent.toFixed(2)}%</span> : null}
          {coverage !== null ? <span>Coverage: {coverage.toFixed(2)}%</span> : null}
          <span>Sequences analysed: {results.length}</span>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-blue-800">Resistance Genes</h4>
          <ul className="mt-2 grid gap-2 text-xs text-blue-600 md:grid-cols-2">
            {results.map((result) => (
              <li
                key={`${result.id}-${result.amr_gene}`}
                className="rounded-lg border border-blue-100 bg-white/70 px-3 py-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-800">{result.amr_gene}</span>
                  <span>{(result.amr_identity ?? result.similarity ?? 0).toFixed(1)}%</span>
                </div>
                <p className="text-[11px] text-blue-500">
                  Sample: {result.id.replace(/_/g, " ")} • Risk: {result.resistance_risk}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ReportDownloadCard({
  csvUrl,
  summaryUrl,
  pdfUrl,
  hasResults,
}: {
  csvUrl?: string;
  summaryUrl?: string;
  pdfUrl?: string;
  hasResults: boolean;
}) {
  if (!hasResults) return null;

  return (
    <section className="rounded-2xl border border-blue-100 bg-white/90 p-6 text-sm text-blue-900 shadow-md">
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-semibold text-blue-800">Analysis Artefacts</p>
          <p className="text-xs text-blue-500">
            Download detailed CSV tables, summary metrics, and a PDF overview generated for this job.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {csvUrl ? (
            <a
              href={csvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Download CSV
            </a>
          ) : null}
          {summaryUrl ? (
            <a
              href={summaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Summary CSV
            </a>
          ) : null}
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              PDF Report
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
