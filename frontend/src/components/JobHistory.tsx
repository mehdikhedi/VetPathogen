"use client";

import { useMemo } from "react";
import type { AnalysisJob } from "@/types";

type JobHistoryProps = {
  jobs: AnalysisJob[];
  onRefresh: () => void;
  onSelect: (jobId: string) => void;
  activeJobId: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  running: "bg-indigo-100 text-indigo-700",
  pending: "bg-slate-100 text-slate-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  en: {
    title: "Recent Analyses",
    refresh: "Refresh",
    empty: "No jobs yet. Upload a FASTA file to get started.",
    sampleId: "Sample ID",
    error: "Error:",
    statusMap: {
      completed: "completed",
      running: "running",
      pending: "pending",
      failed: "failed",
    },
  },
  fr: {
    title: "Analyses récentes",
    refresh: "Rafraîchir",
    empty: "Aucun job pour l’instant. Importez un FASTA pour commencer.",
    sampleId: "ID échantillon",
    error: "Erreur :",
    statusMap: {
      completed: "terminé",
      running: "en cours",
      pending: "en attente",
      failed: "échoué",
    },
  },
} as const;

export function JobHistory({
  jobs,
  onRefresh,
  onSelect,
  activeJobId,
  lang = "en",
}: JobHistoryProps & { lang?: "en" | "fr" }) {
  const labels = STATUS_LABELS[lang];
  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const aTime = a.created_at ? Date.parse(a.created_at) : 0;
      const bTime = b.created_at ? Date.parse(b.created_at) : 0;
      return bTime - aTime;
    });
  }, [jobs]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">{labels.title}</h2>
        <button
          onClick={onRefresh}
          className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {labels.refresh}
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {sortedJobs.length === 0 ? (
          <p className="text-xs text-slate-500">{labels.empty}</p>
        ) : (
          sortedJobs.map((job) => {
            const statusKey = job.status ?? "unknown";
            const statusClass =
              STATUS_COLORS[statusKey] ?? "bg-slate-100 text-slate-700";
            const created = job.created_at
              ? new Date(job.created_at).toLocaleString(lang === "en" ? undefined : "fr-FR")
              : "—";
            const statusLabel = labels.statusMap[statusKey as keyof typeof labels.statusMap] ?? statusKey;

            return (
              <button
                key={job.id}
                onClick={() => onSelect(job.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                  job.id === activeJobId
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{job.id}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                {job.reference_metadata?.sample_id ? (
                  <div className="mt-1 text-[11px] text-slate-500">
                    {labels.sampleId}: {String(job.reference_metadata.sample_id)}
                  </div>
                ) : null}
                <div className="mt-1 flex items-center justify-between text-slate-500">
                  <span>{created}</span>
                  {job.pipeline_version ? <span>{`v${job.pipeline_version}`}</span> : null}
                </div>
                {job.error ? (
                  <p className="mt-1 text-[11px] text-red-600">
                    {labels.error} {job.error}
                  </p>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
