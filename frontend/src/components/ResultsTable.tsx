"use client";

import { AnalysisResult } from "@/types";

type ResultsTableProps = {
  results: AnalysisResult[];
};

export function ResultsTable({ results }: ResultsTableProps) {
  if (!results.length) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800">Analysis Results</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left font-semibold text-slate-600">
            <tr>
              <th className="px-3 py-2">Sample ID</th>
              <th className="px-3 py-2">Length (bp)</th>
              <th className="px-3 py-2">GC%</th>
              <th className="px-3 py-2">Ambiguous</th>
              <th className="px-3 py-2">QC Flags</th>
              <th className="px-3 py-2">Predicted Species</th>
              <th className="px-3 py-2">AMR Gene</th>
              <th className="px-3 py-2">Resistance Risk</th>
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
                  {result.qc_flags.length ? result.qc_flags.join(", ") : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">
                    {result.predicted_species.replaceAll("_", " ")}
                  </div>
                  <div className="text-xs text-slate-500">
                    Identity {result.species_identity.toFixed(2)}% · Coverage {result.species_coverage.toFixed(2)}%
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{result.amr_gene}</div>
                  <div className="text-xs text-slate-500">
                    Identity {result.amr_identity.toFixed(2)}% · Coverage {result.amr_coverage.toFixed(2)}%
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
