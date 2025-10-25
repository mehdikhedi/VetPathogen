# Real Dataset Preparation

This folder documents how to obtain larger, realistic datasets for VetPathogen without bloating the repository. All files listed below should be downloaded manually (or via the provided scripts) and stored locally under `data/real_datasets/`. The default demo still uses the small sample files in `data/`, so the app remains runnable out of the box.

## Pathogen Sequences

- **NCBI GenBank / RefSeq**  
  Use the NCBI Datasets CLI or `esearch`/`efetch` to download FASTA genomes by species.
- **ENA (European Nucleotide Archive)**  
  For paired FASTQ reads, use ENA FTP links or `enaBrowserTools`.

## AMR Gene References

- **CARD** – curated protein/nucleotide sequences and JSON metadata.  
- **ResFinder** – FASTA files of known resistance determinants.

## Metadata Normalization

Record key attributes (isolate_id, species, host, specimen, collection_date, location, source_url) in a CSV/TSV. Scripts in `tools/` (to be added) will validate and combine them with sequence data.

## QC & Reporting Artefacts

- Sequences shorter than 50 bp or with >5 ambiguous bases (`N`) are flagged (`qc_flags`).
- Alignment metrics (`species_identity`, `amr_identity`, etc.) appear in API responses and reports.
- Each analysis job produces:
  - Detailed CSV (`report_<job>.csv`)
  - Summary CSV (`summary_<job>.csv`) with species/AMR counts
  - PDF overview (`report_<job>.pdf`) containing metadata (pipeline version, reference catalog sizes)

---

# Preparation des jeux de donnees reels

Ce dossier explique comment obtenir des jeux de donnees realistes sans alourdir le depot. Telecharger les fichiers et les placer dans `data/real_datasets/` tout en conservant les petits fichiers de demonstration dans `data/`.

## Sequences pathogenes

- **NCBI GenBank / RefSeq** (CLI Datasets, `esearch`/`efetch`)
- **ENA** pour les lectures FASTQ appariees.

## References AMR

- **CARD** et **ResFinder** fournissent des sequences et metadonnees fiables.

## Normalisation des metadonnees

Rassembler les champs essentiels (isolate_id, species, host, specimen, date, localisation, source) dans un CSV/TSV. Les scripts de `tools/` assureront la validation.

## Artefacts de controle et de rapport

- Les sequences < 50 pb ou tres ambigues sont signalees (`qc_flags`).
- Les metriques d'alignement (`species_identity`, `amr_identity`, etc.) sont exposees dans les rapports.
- Chaque analyse genere : un CSV detaille, un CSV de synthese et un rapport PDF avec metadonnees (version du pipeline, taille des catalogues).
