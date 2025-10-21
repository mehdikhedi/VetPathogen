# VetPathogen

<details open>
  <summary>🇬🇧 English</summary>
An integrated prototype that stitches together sequence parsing, pathogen classification, AMR
detection, and reporting into a single experience. The current release combines the previous
sub-projects (Sequence Analysis Demo, AMR Gene Detection, VetPathogen Pipeline) with a FastAPI
backend and a Next.js + Tailwind frontend.

---

## Current Capabilities

- **Backend (FastAPI + Pandas + Biopython)**
  - `POST /analyze/` accepts FASTA uploads, computes GC%, predicts species, finds closest AMR
    genes, assigns random resistance risk, persists `data/report.csv`, and returns JSON.
  - `GET /report` serves the latest CSV report for download.
  - Uses the demo reference catalog (`data/resistance_genes_reference.csv`) and sample FASTA
    (`data/sample_sequences.fasta`).

- **Frontend (Next.js + Tailwind + Chart.js)**
  - Upload form with optional seed for deterministic resistance scores.
  - Results table showing GC%, predicted species, AMR gene, similarity, and risk per isolate.
  - GC% bar chart and a download button that fetches the backend report.
  - Backend URL configurable via `NEXT_PUBLIC_BACKEND_URL`.

- **Dev workflow**
  - `uvicorn backend.main:app --reload` to run the API.
  - `npm run dev` inside `frontend/` to launch the UI.
  - `.venv` virtual environment for Python dependencies; `backend/requirements.txt` lists all
    packages.

---

## Usage Snapshot

```bash
# Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# Frontend (in another shell)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`, upload `data/sample_sequences.fasta`, optionally set seed `42`, and
review the generated results + download link.

---

## Roadmap (3-Phase Enhancement Sprint)

### Phase 1: Bioinformatics Depth
- Integrate real pathogen/AMR datasets and aligners (BLAST/MMseqs2).
- Add QC steps (trimming, contamination checks) and metadata validation.
- Persist analyses in a relational database; modularise pipeline tasks.

### Phase 2: Orchestrated Pipeline & Reporting
- Introduce a job queue (Celery/RQ) with background processing and status endpoints.
- Produce richer artefacts (polished CSV/PDF, expanded JSON with provenance).

### Phase 3: UX, Deployment, and Polish
- Real-time UI updates, batch uploads, dashboards, and a download centre.
- Comprehensive docs/tests, CI/CD, monitoring, and cloud deployment.
- Buffer time for bug fixes, demo packaging, and sharing a public URL.

---

## Vision

VetPathogen is evolving into a mini-laboratory platform: upload real-world sequences, run
bioinformatics workflows, monitor progress interactively, and export professional-grade reports.
The current build proves the integration concept; the roadmap transforms it into a production-ready tool.***
</details> 


<details> 
  <summary>🇫🇷 Français</summary>
Prototype intégré regroupant la lecture de FASTA, la classification d’agents pathogènes, la
détection de gènes AMR et la génération de rapports dans une seule expérience. L’état actuel
assemble les trois sous-projets (Sequence Analysis Demo, AMR Gene Detection, VetPathogen
Pipeline) avec un backend FastAPI et une interface Next.js + Tailwind.

---

## Fonctionnalités actuelles

- **Backend (FastAPI + Pandas + Biopython)**
  - `POST /analyze/` accepte un fichier FASTA, calcule le GC%, prédit l’espèce, trouve le gène AMR
    le plus proche, assigne un risque de résistance aléatoire, enregistre `data/report.csv` et
    renvoie un JSON.
  - `GET /report` sert le dernier rapport CSV généré.
  - S’appuie sur le catalogue de référence de démonstration (`data/resistance_genes_reference.csv`)
    et le FASTA d’exemple (`data/sample_sequences.fasta`).

- **Frontend (Next.js + Tailwind + Chart.js)**
  - Formulaire d’upload avec graine optionnelle pour rendre les risques reproductibles.
  - Tableau des résultats : GC%, espèce prédite, gène AMR, similarité et risque pour chaque isolat.
  - Diagramme en barres du GC% et bouton de téléchargement du rapport.
  - URL du backend configurable via `NEXT_PUBLIC_BACKEND_URL`.

- **Workflow de développement**
  - `uvicorn backend.main:app --reload` pour lancer l’API.
  - `npm run dev` dans `frontend/` pour démarrer l’UI.
  - Environnement virtuel `.venv` pour les dépendances Python; `backend/requirements.txt` liste les
    packages requis.

---

## Guide rapide

```bash
# Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

Visitez `http://localhost:3000`, chargez `data/sample_sequences.fasta`, fixez la graine à `42` si
souhaité, et consultez les résultats + le lien de téléchargement.

---

## Feuille de route (sprint d’amélioration sur 3 phases)

### Phase 1 : Approfondir la bio-informatique
- Intégrer des données réelles de pathogènes/AMR et des outils d’alignement (BLAST/MMseqs2).
- Ajouter des étapes de QC (trimming, contrôle de contamination) et valider les métadonnées.
- Stocker les analyses dans une base relationnelle et modulariser les tâches du pipeline.

### Phase 2 : Orchestration & Reporting
- Introduire une file de tâches (Celery/RQ) avec traitement asynchrone et endpoints de statut.
- Générer des artefacts riches : CSV/PDF soignés, JSON détaillé avec provenance.

### Phase 3 : UX, déploiement et finition
- UI temps réel, uploads en lot, tableaux de bord, centre de téléchargement.
- Documentation/tests exhaustifs, CI/CD, monitoring et déploiement cloud.
- Temps tampon pour corrections, packaging de démonstration et diffusion d’une URL publique.

---

## Vision

VetPathogen vise à devenir une mini-plateforme de laboratoire : importer des séquences réelles,
lancer des workflows bio-informatiques, suivre l’avancement en direct et exporter des rapports
professionnels. Cette version prouve l’intégration; la feuille de route la transforme en outil prêt
pour la production.***
</details> 
