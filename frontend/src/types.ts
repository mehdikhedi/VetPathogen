export type AnalysisResult = {
  id: string;
  sequence: string;
  gc_content: number;
  predicted_species: string;
  amr_gene: string;
  similarity: number;
  resistance_risk: string;
};

export type AnalysisResponse = {
  count: number;
  report_path?: string;
  results: AnalysisResult[];
};
