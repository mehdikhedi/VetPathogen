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
              <th className="px-3 py-2">GC%</th>
              <th className="px-3 py-2">Predicted Species</th>
              <th className="px-3 py-2">AMR Gene</th>
              <th className="px-3 py-2">Similarity</th>
              <th className="px-3 py-2">Resistance Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {results.map((result) => (
              <tr key={result.id}>
                <td className="whitespace-nowrap px-3 py-2 font-medium">{result.id}</td>
                <td className="whitespace-nowrap px-3 py-2">{result.gc_content.toFixed(2)}%</td>
                <td className="px-3 py-2">{result.predicted_species.replaceAll("_", " ")}</td>
                <td className="px-3 py-2">{result.amr_gene}</td>
                <td className="whitespace-nowrap px-3 py-2">{result.similarity.toFixed(2)}%</td>
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
