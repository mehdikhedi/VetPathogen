from pathlib import Path

from backend.amr_detection import load_reference as load_amr_reference
from backend.classify_pathogen import load_reference as load_pathogen_reference
from backend.pipeline import run_pipeline


def test_run_pipeline_smoke(tmp_path):
    fasta_text = Path("data/sample_sequences.fasta").read_text()
    amr_df = load_amr_reference("data/resistance_genes_reference.csv")
    pathogen_df = load_pathogen_reference("data/pathogen_reference.csv")

    report_df, report_path, summary_path, pdf_path, metadata = run_pipeline(
        fasta_text,
        seed=123,
        amr_reference_df=amr_df,
        pathogen_reference_df=pathogen_df,
        output_dir=tmp_path,
        job_id="test-job",
    )

    assert not report_df.empty
    assert report_path.exists()
    assert metadata.get("pipeline_version")
    if summary_path:
        assert summary_path.exists()
    if pdf_path:
        assert pdf_path.exists()
