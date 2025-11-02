# VetPathogen

<details open>
  <summary>🇬🇧 English</summary>

A platform that automates veterinary pathogen classification and antimicrobial resistance (AMR) detection from FASTA inputs. This release showcases a complete demo stack of FastAPI backend, modular analysis pipeline, and a Next.js dashboard with a clear roadmap toward a research-grade system.

---

## Highlights

- **End-to-end demo**: upload a FASTA file, obtain pathogen/AMR insights, download CSV/PDF artefacts.
- **Modern architecture**: FastAPI + Pandas + Biopython pipeline, Next.js/Tailwind UI, persisted job history.
- **Reproducible workflow**: Docker Compose stack, GitHub Actions CI, integration tests, load-testing script.
- **Clear roadmap**: planned integration of real datasets, BLAST/MMseqs2 alignment, QC tooling, and ML-based risk models.

---

## Architecture at a Glance

| Layer              | Role                                                                                      |
|--------------------|-------------------------------------------------------------------------------------------|
| **Next.js frontend** | Handles uploads (file/paste), metadata capture, status polling, results visualisation.  |
| **FastAPI backend**  | Validates inputs, runs the analysis pipeline, persists jobs/reports, serves artefacts.  |
| **Pipeline modules** | Sequence parsing/QC, species classification via pairwise alignment, AMR matching, risk. |
| **Persistence**      | SQLite database (PostgreSQL-ready) plus CSV/PDF artefacts under `data/`.                |
| **Tooling**          | Docker/Docker Compose, GitHub Actions, Locust load script, deployment checklist.        |

---

## Current Capabilities (Demo v1)

- **Pathogen classification** using reference CSVs (`data/pathogen_reference.csv`).
- **AMR gene detection** against demo catalogues (`data/resistance_genes_reference.csv`).
- **Sequence QC** (length, GC content, ambiguous bases) with seeded random risk scoring for reproducibility.
- **Reporting**: CSV summary, optional PDF overview, job history for replays.
- **API endpoints**: `/analyze/`, `/jobs`, `/jobs/{id}`, and artefact download routes.
- **Frontend features**: upload form, results table, GC chart, artefact buttons, job history panel.

---

## Demo Usage

### Docker (recommended)

```bash
docker-compose up --build
```

- Backend → `http://localhost:8000`
- Frontend → `http://localhost:3000`
- Reports persist in the `backend-data` volume.

### Local development

```bash
# Backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate      # macOS/Linux
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`, upload `data/sample_sequences.fasta`, optionally add notes, and explore the outputs.

### Sample Run

1. Start the stack.
2. Upload `data/sample_sequences.fasta`.
3. Inspect results, GC chart, and download artefacts.
4. Reopen the job from “History” to confirm persistence.

<img width="1920" height="1008" alt="Screenshot 2025-11-02 092001" src="https://github.com/user-attachments/assets/a89055f5-701e-44e9-ba96-578e9af0fac6" />


### Load testing (optional)

```bash
pip install locust
locust -f tools/loadtest/locustfile.py --host http://127.0.0.1:8000
```

Navigate to `http://localhost:8089` to simulate concurrent uploads.

---

## Environment Variables

| Variable                   | Default                     | Purpose                                               |
|----------------------------|-----------------------------|-------------------------------------------------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://127.0.0.1:8000`     | Frontend API base URL.                                |
| `VETPATHOGEN_DATABASE_URL`| `sqlite:///data/vetpathogen.db` | SQLAlchemy connection string.                         |
| `VETPATHOGEN_ASYNC`       | `false`                     | Enables async job runner (future queue integration).  |

See `.env.example` for a starter template.

---

## Testing & CI

- Backend tests (pytest) cover API/pipeline smoke flows.
- Frontend linting (ESLint) ensures TypeScript/React hygiene.
- Docker image builds validate backend/frontend Dockerfiles.
- GitHub Actions workflow lives in `.github/workflows/ci.yml`.

---

## Deployment

See [`deployment.md`](deployment.md) for local vs Compose workflows, image publishing, cloud config, HTTPS/logging/monitoring notes, and a launch checklist.

---

## Project Status & Roadmap

VetPathogen v1.0 is a **functional demo** validating architecture and UX. Next milestone (planned during my MSc) focuses on:

1. **Reference upgrades** — integrate curated pathogen/AMR datasets (SILVA/GTDB, CARD/ResFinder) with provenance tracking.
2. **Pipeline enhancements** — BLAST+/MMseqs2 alignment, fastp QC, async workers, enriched job metadata.
3. **Risk inference** — replace random labels with rule/ML-driven scoring tied to clinical breakpoints.
4. **Provenance** — log tool versions, reference IDs, and QC metrics per analysis.

---

## Vision

VetPathogen aims to evolve into a research-grade platform aligned with One Health initiatives:

- Accessible AMR analytics for veterinary labs.
- Reproducible, containerised workflows deployable in the field.
- Educational resource bridging veterinary medicine and computational biology.

</details>

---

<details>
  <summary>🇫🇷 Français</summary>

Plateforme pour la classification des agents pathogènes vétérinaires et la détection de gènes de résistance à partir de FASTA. Cette version démontre une stack complète (backend FastAPI, pipeline modulaire, tableau de bord Next.js) et prépare la transition vers un outil de recherche.

---

## Points clés

- **Démo bout en bout** : dépôt FASTA, identification pathogène/AMR, artefacts CSV/PDF.
- **Architecture moderne** : pipeline Python (FastAPI + Pandas + Biopython), UI Next.js/Tailwind, historique des analyses.
- **Workflow reproductible** : Docker Compose, CI GitHub Actions, tests d’intégration, script de charge Locust.
- **Feuille de route claire** : intégration de datasets réels, BLAST/MMseqs2, QC (fastp), modèles de risque.

---

## Architecture en un coup d’œil

| Couche              | Rôle                                                                                   |
|---------------------|----------------------------------------------------------------------------------------|
| **Frontend Next.js** | Upload (fichier/texte), métadonnées, suivi de statut, visualisations.                  |
| **Backend FastAPI**  | Valide les entrées, exécute le pipeline, stocke jobs/rapports, expose les artefacts.  |
| **Modules pipeline** | Parsing/QC, classification par alignement pairwise, détection AMR, scoring.            |
| **Persistance**      | Base SQLite (PostgreSQL-ready) + artefacts CSV/PDF.                                   |
| **Outils**           | Docker/Docker Compose, GitHub Actions, Locust, guide de déploiement.                   |

---

## Capacités actuelles (Démo v1)

- Classification via `data/pathogen_reference.csv`.
- Détection AMR via `data/resistance_genes_reference.csv`.
- QC (longueur, GC, ambiguïtés) avec scoring aléatoire reproductible (graine).
- Rapports CSV/PDF et historique des analyses.
- API : `/analyze/`, `/jobs`, `/jobs/{id}`, endpoints de téléchargement.
- Frontend : formulaire, tableau, graphique GC, boutons de téléchargement, onglet Historique.

---

## Mise en route

### Docker (recommandé)

```bash
docker-compose up --build
```

- Backend → `http://localhost:8000`
- Frontend → `http://localhost:3000`

### Développement local

```bash
# Backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate      # macOS/Linux
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

Visitez `http://localhost:3000`, chargez `data/sample_sequences.fasta`, ajoutez des notes, puis analysez les résultats et artefacts.

### Démonstration guidée

1. Lancez la stack.
2. Déposez `data/sample_sequences.fasta`.
3. Examinez tableau, graphique GC et téléchargements.
4. Vérifiez l’historique pour confirmer la persistance du job.

<img width="1920" height="1008" alt="Screenshot 2025-11-02 092001" src="https://github.com/user-attachments/assets/863aea6d-6b52-4ff1-8881-6887ba09a188" />


### Test de charge (optionnel)

```bash
pip install locust
locust -f tools/loadtest/locustfile.py --host http://127.0.0.1:8000
```

Interface Locust : `http://localhost:8089`.

---

## Variables d’environnement

| Variable                  | Défaut                       | Description                                           |
|---------------------------|------------------------------|-------------------------------------------------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://127.0.0.1:8000`      | Base API utilisée par le frontend.                    |
| `VETPATHOGEN_DATABASE_URL`| `sqlite:///data/vetpathogen.db` | URI SQLAlchemy (configurable PostgreSQL).            |
| `VETPATHOGEN_ASYNC`       | `false`                      | Active l’exécution asynchrone (futur worker).         |

`.env.example` fournit un modèle.

---

## Tests & CI

- Pytest côté backend (pipeline + API).
- ESLint côté frontend (TypeScript/React).
- Builds Docker backend/frontend.
- Workflow GitHub Actions : `.github/workflows/ci.yml`.

---

## Déploiement

Voir [`deployment.md`](deployment.md) pour dev local vs Compose, publication d’images, configuration cloud (PostgreSQL/Redis), HTTPS, logging, monitoring, checklist de lancement.

---

## Statut & Feuille de route

VetPathogen v1.0 est une **démo fonctionnelle**. La suite (prévue durant le Master) porte sur :

1. **Référentiels** — intégration de catalogues pathogènes/AMR (SILVA, CARD) avec provenance.
2. **Pipeline** — BLAST/MMseqs2, QC fastp, worker asynchrone, métadonnées enrichies.
3. **Scoring** — risques basés sur règles/seuils et modèles.
4. **Traçabilité** — journalisation des versions outils/références et métriques QA.

---

## Vision

VetPathogen ambitionne de devenir une plateforme alignée One Health :

- Analytique AMR accessible aux labos vétérinaires.
- Workflows reproductibles conteneurisés.
- Ressource pédagogique liant médecine vétérinaire et bio-informatique.

</details>
