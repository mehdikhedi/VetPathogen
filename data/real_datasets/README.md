# Real Dataset Preparation

This folder documents how to obtain larger, realistic datasets for VetPathogen without bloating the repository. All files listed below should be downloaded manually (or via the provided scripts) and stored locally under `data/real_datasets/`. The default demo still uses the small sample files in `data/`, so the app remains runnable out of the box.

## Pathogen Sequences

- **NCBI GenBank / RefSeq**  
  Use the NCBI Datasets CLI or `esearch`/`efetch` to download FASTA genomes by species.
  - Example: *Staphylococcus aureus*, *Escherichia coli*, *Pseudomonas aeruginosa*.
  - Command (Linux/macOS):  
    ```bash
    datasets download genome taxon "Staphylococcus aureus" --reference --filename saureus.zip
    unzip saureus.zip -d data/real_datasets/staph_aureus
    ```

- **ENA (European Nucleotide Archive)**  
  For paired FASTQ reads, use ENA FTP links or `enaBrowserTools`.

## AMR Gene References

- **CARD (Comprehensive Antibiotic Resistance Database)** – curated protein/nucleotide sequences and JSON metadata.  
  - https://card.mcmaster.ca/download
- **ResFinder database** (Center for Genomic Epidemiology) – FASTA of known resistance genes.  
  - https://cge.food.dtu.dk/services/ResFinder/

## Metadata Normalization

Create or download a TSV/CSV that records:

| isolate_id | species | host | specimen | collection_date | location | source_url |
|------------|---------|------|----------|-----------------|----------|------------|

Scripts in `tools/` (to be added) will ingest these metadata files and validate fields before combining with sequence data.

### QC Integration

- Sequences shorter than 50 bp or with >5 ambiguous bases (`N`) are flagged during ingestion.
- Additional scripts (to be added under `tools/`) will trim low-quality tails and screen common contaminants. Results are stored alongside sequences for transparency.

---

# Preparation des jeux de donnees reels

Ce dossier explique comment obtenir des jeux de donnees realistes sans alourdir le depot. Tous les fichiers listes doivent etre telecharges manuellement (ou via les scripts fournis) et stockes localement dans `data/real_datasets/`. La demo par defaut s'appuie toujours sur les petits fichiers d'exemple dans `data/`, donc l'application reste exploitable immediatement.

## Sequences pathogenes

- **NCBI GenBank / RefSeq**  
  Utiliser NCBI Datasets CLI ou `esearch`/`efetch` pour recuperer les genomes par espece.
- **ENA (European Nucleotide Archive)**  
  Pour des lectures FASTQ appariees, utiliser les liens FTP d'ENA ou `enaBrowserTools`.

## References AMR

- **CARD** – sequences proteine/nucleotide et metadonnees JSON.  
- **Base ResFinder** – FASTA de genes de resistance connus.

## Normalisation des metadonnees

Reunir les champs essentiels (isolate_id, species, host, specimen, date, localisation, source) dans un CSV ou TSV.

## Integration QC

- Sequences < 50 pb ou avec >5 bases ambigu es (`N`) sont signalees lors de l'import.
- Des scripts supplementaires (a ajouter dans `tools/`) gereront trimming et controle de contamination.
