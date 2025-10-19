"use client";

import { AnalysisResult } from "@/types";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type GCPlotProps = {
  results: AnalysisResult[];
};

export function GCPlot({ results }: GCPlotProps) {
  if (!results.length) {
    return null;
  }

  const data = {
    labels: results.map((result) => result.id),
    datasets: [
      {
        label: "GC Content (%)",
        data: results.map((result) => result.gc_content),
        backgroundColor: "rgba(79, 70, 229, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: "GC Content by Sample",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 100,
        title: {
          display: true,
          text: "GC %",
        },
      },
    },
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800">GC Content Overview</h2>
      <div className="mt-4">
        <Bar data={data} options={options} />
      </div>
    </section>
  );
}
