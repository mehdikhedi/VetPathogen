export type AnalysisResult = {
  id: string;
  sequence: string;
  length: number;
  ambiguous: number;
  qc_flags: string[];
  gc_content: number;
  predicted_species: string;
  species_identity: number;
  species_coverage: number;
  species_score: number;
  amr_gene: string;
  amr_identity: number;
  amr_coverage: number;
  amr_score: number;
  similarity: number;
  resistance_risk: string;
};

export type AnalysisMetadata = {
  pipeline_version?: string;
  generated_at?: string;
  references?: Record<string, unknown>;
  [key: string]: unknown;
};

export type AnalysisResponse = {
  job_id?: string;
  status?: string;
  error?: string;
  count?: number;
  report_path?: string;
  summary_path?: string;
  pdf_path?: string;
  metadata?: AnalysisMetadata;
  results?: AnalysisResult[];
};
