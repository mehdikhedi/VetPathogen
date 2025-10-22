# Real Dataset Preparation

This folder documents how to obtain larger, realistic datasets for VetPathogen without bloating
the repository. All files listed below should be downloaded manually (or via the provided scripts)
and stored locally under `data/real_datasets/`. The default demo still uses the small sample files
in `data/`, so the app remains runnable out of the box.

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
  For paired FASTQ reads, use ENA’s FTP links or `enaBrowserTools`.

## AMR Gene References

- **CARD (Comprehensive Antibiotic Resistance Database)** – provides curated protein/nucleotide
  sequences and JSON metadata.
  - https://card.mcmaster.ca/download
- **ResFinder database** (Center for Genomic Epidemiology) – FASTA of known resistance genes.
  - https://cge.food.dtu.dk/services/ResFinder/

## Metadata Normalization

Create or download a TSV/CSV that records:

| isolate_id | species | host | specimen | collection_date | location | source_url |
|------------|---------|------|----------|-----------------|----------|------------|

Scripts in `tools/` (to be added) will ingest these metadata files and validate fields before
combining with sequence data.

### QC Integration

- Sequences shorter than 50 bp or with >5 ambiguous bases (`N`) are flagged during ingestion.
- Additional scripts (to be added under `tools/`) will trim low-quality tails and screen common
  contaminants. Results are stored alongside sequences for transparency.

---

# Préparation de Jeux de Données Réels

Ce dossier décrit comment obtenir des jeux de données réalistes sans alourdir le dépôt. Tous les
fichiers listés ci-dessous doivent être téléchargés manuellement (ou via les scripts fournis) et
stockés localement dans `data/real_datasets/`. La démo par défaut s’appuie toujours sur les petits
fichiers d’exemple dans `data/`, donc l’application reste exécutable immédiatement.

## Séquences Pathogènes

- **NCBI GenBank / RefSeq**  
  Utiliser NCBI Datasets CLI ou `esearch`/`efetch` pour récupérer les génomes par espèce.
  - Exemple : *Staphylococcus aureus*, *Escherichia coli*, *Pseudomonas aeruginosa*.
  - Commande (Linux/macOS) :  
    ```bash
    datasets download genome taxon "Staphylococcus aureus" --reference --filename saureus.zip
    unzip saureus.zip -d data/real_datasets/staph_aureus
    ```

- **ENA (European Nucleotide Archive)**  
  Pour des lectures FASTQ appariées, utiliser les liens FTP d’ENA ou `enaBrowserTools`.

## Références AMR

- **CARD (Comprehensive Antibiotic Resistance Database)** – séquences protein/nucleotide et
  métadonnées JSON.  
  - https://card.mcmaster.ca/download
- **Base ResFinder** (Center for Genomic Epidemiology) – FASTA de gènes de résistance connus.  
  - https://cge.food.dtu.dk/services/ResFinder/

## Normalisation des Métadonnées

Créer ou télécharger un TSV/CSV contenant :

| isolate_id | species | host | specimen | collection_date | location | source_url |
|------------|---------|------|----------|-----------------|----------|------------|

Les scripts dans `tools/` (à venir) ingéreront ces fichiers de métadonnées, valideront les champs
et les fusionneront avec les séquences.

### Intégration QC

- Les séquences < 50 pb ou comportant >5 bases ambiguës (`N`) sont signalées à l’ingestion.
- Des scripts supplémentaires (à ajouter dans `tools/`) traiteront le trimming et le contrôle de
  contamination. Les résultats sont stockés avec les séquences pour plus de transparence.
