"use client";

import { AnalysisResult } from "@/types";

type ResultsTableProps = {
  results: AnalysisResult[];
  lang?: "en" | "fr";
};

const LABELS = {
  en: {
    heading: "Analysis Results",
    columns: {
      sampleId: "Sample ID",
      length: "Length (bp)",
      gc: "GC%",
      ambiguous: "Ambiguous",
      qcFlags: "QC Flags",
      species: "Predicted Species",
      amrGene: "AMR Gene",
      risk: "Resistance Risk",
    },
    identity: "Identity",
    coverage: "Coverage",
    noFlags: "-",
  },
  fr: {
    heading: "Résultats d’analyse",
    columns: {
      sampleId: "ID échantillon",
      length: "Longueur (pb)",
      gc: "GC%",
      ambiguous: "Bases ambiguës",
      qcFlags: "Indicateurs QC",
      species: "Espèce prédite",
      amrGene: "Gène AMR",
      risk: "Risque de résistance",
    },
    identity: "Identité",
    coverage: "Couverture",
    noFlags: "–",
  },
} as const;

export function ResultsTable({ results, lang = "en" }: ResultsTableProps) {
  if (!results.length) {
    return null;
  }
  const labels = LABELS[lang];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800">{labels.heading}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left font-semibold text-slate-600">
            <tr>
              <th className="px-3 py-2">{labels.columns.sampleId}</th>
              <th className="px-3 py-2">{labels.columns.length}</th>
              <th className="px-3 py-2">{labels.columns.gc}</th>
              <th className="px-3 py-2">{labels.columns.ambiguous}</th>
              <th className="px-3 py-2">{labels.columns.qcFlags}</th>
              <th className="px-3 py-2">{labels.columns.species}</th>
              <th className="px-3 py-2">{labels.columns.amrGene}</th>
              <th className="px-3 py-2">{labels.columns.risk}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {results.map((result) => (
              <tr key={result.id}>
                <td className="whitespace-nowrap px-3 py-2 font-medium">{result.id}</td>
                <td className="whitespace-nowrap px-3 py-2">{result.length}</td>
                <td className="whitespace-nowrap px-3 py-2">{result.gc_content.toFixed(2)}%</td>
                <td className="whitespace-nowrap px-3 py-2">{result.ambiguous}</td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {result.qc_flags.length ? result.qc_flags.join(", ") : labels.noFlags}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{result.predicted_species.replaceAll("_", " ")}</div>
                  <div className="text-xs text-slate-500">
                    {labels.identity} {result.species_identity.toFixed(2)}% • {labels.coverage}{" "}
                    {result.species_coverage.toFixed(2)}%
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{result.amr_gene}</div>
                  <div className="text-xs text-slate-500">
                    {labels.identity} {result.amr_identity.toFixed(2)}% • {labels.coverage}{" "}
                    {result.amr_coverage.toFixed(2)}%
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    {result.resistance_risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
