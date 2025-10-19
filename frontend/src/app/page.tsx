"use client";

import { useMemo, useState } from "react";

import { GCPlot } from "@/components/GCPlot";
import { ResultsTable } from "@/components/ResultsTable";
import { UploadSection } from "@/components/UploadSection";
import type { AnalysisResponse, AnalysisResult } from "@/types";

const DEFAULT_ENDPOINT = "http://127.0.0.1:8000/analyze/";

export default function Home() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [reportPath, setReportPath] = useState<string | undefined>();
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
      setResults(payload.results ?? []);
      setReportPath(payload.report_path);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
      setResults([]);
      setReportPath(undefined);
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

        <ResultsTable results={results} />

        <GCPlot results={results} />

        {reportPath ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            Analysis complete. A CSV report has been generated on the backend at{" "}
            <span className="font-semibold text-slate-900">{reportPath}</span>. Download it
            directly from the backend host or inspect it locally if you are running the
            service on your machine.
          </div>
        ) : null}
      </div>
    </main>
  );
}
