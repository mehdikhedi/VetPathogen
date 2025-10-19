"use client";

import { useState } from "react";

type UploadSectionProps = {
  loading: boolean;
  onSubmit: (payload: { file: File; seed?: number }) => void;
};

export function UploadSection({ loading, onSubmit }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [seed, setSeed] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      alert("Please select a FASTA file to analyze.");
      return;
    }

    const seedValue = seed.trim() ? Number(seed.trim()) : undefined;
    if (seedValue !== undefined && Number.isNaN(seedValue)) {
      alert("Seed must be a valid number.");
      return;
    }

    onSubmit({ file, seed: seedValue });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800">Upload FASTA Sequences</h2>
      <p className="mt-2 text-sm text-slate-600">
        Select a FASTA file with isolate sequences. Optionally provide a numeric seed to keep
        antimicrobial resistance risk assignments reproducible.
      </p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="fasta"
            className="block text-sm font-medium text-slate-700"
          >
            FASTA file
          </label>
          <input
            id="fasta"
            name="fasta"
            type="file"
            accept=".fasta,.fa,.txt"
            onChange={handleFileChange}
            disabled={loading}
            className="mt-1 block w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>
        <div>
          <label
            htmlFor="seed"
            className="block text-sm font-medium text-slate-700"
          >
            Seed (optional)
          </label>
          <input
            id="seed"
            name="seed"
            type="number"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            disabled={loading}
            placeholder="e.g. 42"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Analyze Sequences"}
        </button>
      </form>
    </section>
  );
}
