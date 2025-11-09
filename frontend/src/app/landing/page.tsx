"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const VIDEO_SRC_EN = process.env.NEXT_PUBLIC_LANDING_VIDEO_URL ?? "/landing-demo.mp4";
const VIDEO_SRC_FR = process.env.NEXT_PUBLIC_LANDING_VIDEO_URL_FR ?? "/landing-demo-fr.mp4";
const CONTACT_ENDPOINT =
  process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? "mailto:mehdi.khedi@example.com";

const translations = {
  en: {
    heroTitle: "Veterinary Pathogen Analysis & AMR Insights",
    heroSubtitle: "Transforming routine sequence uploads into actionable lab intelligence.",
    heroPrimaryCta: "Experience the Demo",
    heroSecondaryCta: "View on GitHub",
    heroModalButton: "Open in modal",
    challengeTitle: "The Challenge",
    challengeBody:
      "Antimicrobial resistance in animals threatens food security and One Health resilience. Veterinary labs face siloed, research-heavy tools that are slow to adapt to frontline cases. VetPathogen is designed to close that gap with an integrated, lab-friendly workflow.",
    originsTitle: "How VetPathogen Began",
    originsIntro:
      "VetPathogen grew out of three foundational projects that explored core ideas in computational microbiology:",
    originsSummary:
      "These experiments formed the building blocks of today's platform. What began as individual Jupyter notebooks became an integrated system combining Python-based analysis, FastAPI orchestration, and a Next.js interface—proof that complex bioinformatics workflows can be intuitive, transparent, and lab-friendly.",
    originsItems: [
      "Sequence Analysis Demo — reading FASTA files, computing GC%, and translating DNA to protein.",
      "AMR Gene Detection — comparing bacterial sequences to resistance gene catalogues.",
      "VetPathogen Pipeline — orchestrating analysis and reporting workflows.",
    ],
    platformTitle: "The Platform Today",
    platformHighlights: [
      "Streamlined pipeline classifies pathogens and detects AMR genes directly from FASTA uploads.",
      "Delivers QC metrics, alignment summaries, and exportable CSV/PDF artefacts in one interface.",
      "Functional demo proves the full stack — sequence parsing, alignment heuristics, AMR catalogue lookup, and reporting.",
    ],
    roadmapTitle: "Where It's Headed",
    roadmapHighlights: [
      "Curated reference catalogues (NCBI / CARD) with provenance tracking and automated refreshes.",
      "Integrated quality controls: fastp pre-processing, contamination screening, and metadata validation.",
      "Evidence-based AMR risk stratification tuned to veterinary clinical breakpoints.",
      "Reproducible job orchestration with provenance, audit logs, and governance-friendly controls.",
      "Privacy-conscious deployments for veterinary labs, academic partners, and One Health networks.",
    ],
    aboutTitle: "About the Developer",
    aboutBody:
      "Mehdi Khedi is a Doctor of Veterinary Medicine (DVM) passionate about computational biology and the intersection of life sciences and technology. He created VetPathogen to make antimicrobial resistance (AMR) analysis more accessible, automated, and transparent for veterinary researchers and clinicians.",
    contactTitle: "Contact",
    contactSubtitle: "Have questions or want to collaborate? Send a note and I’ll get back to you shortly.",
    contactName: "Name",
    contactEmail: "Email",
    contactSubject: "Subject",
    contactSubjectPlaceholder: "Subject (e.g. Partnership request)",
    contactMessage: "Message",
    contactMessagePlaceholder: "How can I help?",
    contactSubmit: "Send Message",
  },
  fr: {
    heroTitle: "Analyse des pathogènes vétérinaires & informations AMR",
    heroSubtitle: "Transformez vos séquences en informations exploitables pour le laboratoire.",
    heroPrimaryCta: "Découvrir la démo",
    heroSecondaryCta: "Voir sur GitHub",
    heroModalButton: "Ouvrir dans une fenêtre",
    challengeTitle: "Le défi",
    challengeBody:
      "La résistance antimicrobienne chez les animaux menace la sécurité alimentaire et la résilience One Health. Les laboratoires vétérinaires utilisent des outils cloisonnés, orientés recherche, qui s’adaptent lentement aux cas de terrain. VetPathogen vise à combler ce fossé grâce à un flux de travail intégré et facile à adopter.",
    originsTitle: "Comment VetPathogen a commencé",
    originsIntro:
      "VetPathogen est né de trois projets fondateurs explorant les idées clés de la microbiologie computationnelle :",
    originsSummary:
      "Ces expérimentations ont servi de base à la plateforme actuelle. D’anciens notebooks Jupyter se sont transformés en un système intégrant analyse Python, orchestration FastAPI et interface Next.js—la preuve qu’un workflow bio-informatique complexe peut devenir intuitif, transparent et adapté aux laboratoires.",
    originsItems: [
      "Sequence Analysis Demo — lecture de FASTA, calcul du GC% et traduction ADN/protéine.",
      "AMR Gene Detection — comparaison des séquences bactériennes aux catalogues de gènes de résistance.",
      "VetPathogen Pipeline — orchestration des analyses et génération de rapports.",
    ],
    platformTitle: "Plateforme actuelle",
    platformHighlights: [
      "Pipeline simplifié classant les pathogènes et détectant les gènes AMR directement depuis les FASTA.",
      "Remonte les métriques QC, les alignements et des artefacts CSV/PDF prêts à l’emploi dans une seule interface.",
      "La démo actuelle prouve l’intégration complète : parsing, alignements heuristiques, catalogues AMR et reporting.",
    ],
    roadmapTitle: "Feuille de route",
    roadmapHighlights: [
      "Catalogues de référence (NCBI / CARD) avec provenance et mises à jour automatisées.",
      "Chaînes de qualité intégrées : fastp, contrôles de contamination, validation des métadonnées.",
      "Stratification des risques AMR basée sur les référentiels cliniques vétérinaires.",
      "Orchestration reproductible avec traçabilité, journaux d’audit et gouvernance.",
      "Déploiements respectueux de la confidentialité pour laboratoires, partenariats académiques et réseaux One Health.",
    ],
    aboutTitle: "À propos du développeur",
    aboutBody:
      "Mehdi Khedi est docteur vétérinaire (DVM) passionné par la biologie computationnelle et l’intersection entre sciences du vivant et technologie. Il a créé VetPathogen pour rendre l’analyse de la résistance antimicrobienne plus accessible, automatisée et transparente pour les chercheurs et cliniciens vétérinaires.",
    contactTitle: "Contact",
    contactSubtitle:
      "Une question ou un projet de collaboration ? Envoyez un message et je vous répondrai rapidement.",
    contactName: "Nom",
    contactEmail: "Email",
    contactSubject: "Objet",
    contactSubjectPlaceholder: "Objet (ex. demande de partenariat)",
    contactMessage: "Message",
    contactMessagePlaceholder: "Comment puis-je vous aider ?",
    contactSubmit: "Envoyer",
  },
};

export default function LandingPage(): JSX.Element {
  const [lang, setLang] = useState<"en" | "fr">("en");

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white text-gray-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-20 pt-8">
        <header className="mb-8 flex w-full flex-wrap items-center justify-between gap-4 border-b border-blue-100 pb-4">
          <Link href="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-blue-800">
            <Image src="/vetpathogen-logo.svg" alt="VetPathogen logo" width={48} height={48} priority />
            VetPathogen
          </Link>
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === "en" ? "fr" : "en"))}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          >
            {lang === "en" ? (
              <>
                <span role="img" aria-label="French flag">
                  🇫🇷
                </span>
                Français
              </>
            ) : (
              <>
                <span role="img" aria-label="English flag">
                  🇬🇧
                </span>
                English
              </>
            )}
          </button>
        </header>

        {/* Hero */}
        <section className="w-full rounded-3xl border border-blue-100 bg-white/90 p-10 shadow-xl shadow-blue-100">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:flex-1 md:min-w-[320px] md:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-blue-900 md:text-5xl">
                {translations[lang].heroTitle}
              </h1>
              <p className="mt-4 text-lg text-gray-800 md:text-xl">
                {translations[lang].heroSubtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
                <Link
                  href="/"
                  className="rounded-xl bg-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {translations[lang].heroPrimaryCta}
                </Link>
                <Link
                  href="https://github.com/mehdikhedi/VetPathogen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-blue-600 px-6 py-3 text-lg font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
                >
                  {translations[lang].heroSecondaryCta}
                </Link>
              </div>
            </div>
            <div className="w-full md:flex-1 md:min-w-[320px] overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60">
              <video
                src={lang === "fr" ? VIDEO_SRC_FR : VIDEO_SRC_EN}
                controls
                controlsList="nodownload"
                className="h-full w-full rounded-2xl"
                autoPlay={false}
                playsInline
              >
                Your browser does not support the video tag. Please download the demo video to view it.
              </video>
            </div>
          </div>
        </section>

        {/* Challenge */}
        <section className="mt-16 w-full rounded-3xl border border-blue-100 bg-white/90 p-10 shadow-lg shadow-blue-100">
          <h2 className="text-3xl font-semibold text-blue-900">{translations[lang].challengeTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-800">{translations[lang].challengeBody}</p>
        </section>

        {/* Origins */}
        <section className="mt-12 w-full rounded-3xl border border-blue-100 bg-white/90 p-10 shadow-lg shadow-blue-100">
          <h2 className="text-3xl font-semibold text-blue-900">{translations[lang].originsTitle}</h2>
          <p className="mt-3 text-base leading-relaxed text-gray-800">{translations[lang].originsIntro}</p>
          <ul className="mt-4 space-y-3 text-base text-gray-800">
            {translations[lang].originsItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-base leading-relaxed text-gray-800">{translations[lang].originsSummary}</p>
        </section>

        {/* Dual Column Cards */}
        <section className="mt-16 w-full">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-md">
              <h3 className="text-2xl font-semibold text-blue-900">{translations[lang].platformTitle}</h3>
              <ul className="mt-4 space-y-3 text-base text-gray-800">
                {translations[lang].platformHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div id="roadmap" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-md">
              <h3 className="text-2xl font-semibold text-blue-900">{translations[lang].roadmapTitle}</h3>
              <ul className="mt-4 space-y-3 text-base text-gray-800">
                {translations[lang].roadmapHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="mt-20 w-full rounded-3xl border border-blue-100 bg-white/95 p-10 shadow-lg shadow-blue-100">
          <h2 className="text-3xl font-semibold text-blue-900">{translations[lang].aboutTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-800">{translations[lang].aboutBody}</p>
        </section>

        {/* Contact */}
        <section className="mt-16 w-full rounded-3xl border border-blue-100 bg-white/95 p-10 shadow-lg shadow-blue-100">
          <h2 className="text-3xl font-semibold text-blue-900">{translations[lang].contactTitle}</h2>
          <p className="mt-2 text-base text-gray-800">{translations[lang].contactSubtitle}</p>
          <form
            className="mt-6 grid gap-4 text-left"
            action={CONTACT_ENDPOINT}
            method="POST"
            target="_blank"
          >
            <div>
              <label className="text-sm font-semibold text-blue-800" htmlFor="landing-name">
                {translations[lang].contactName}
              </label>
              <input
                id="landing-name"
                name="name"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-base text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder={lang === "en" ? "Your name" : "Votre nom"}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-blue-800" htmlFor="landing-email">
                {translations[lang].contactEmail}
              </label>
              <input
                id="landing-email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-base text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder={lang === "en" ? "you@example.com" : "vous@example.com"}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-blue-800" htmlFor="landing-subject">
                {translations[lang].contactSubject}
              </label>
              <input
                id="landing-subject"
                name="subject"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-base text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder={translations[lang].contactSubjectPlaceholder}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-blue-800" htmlFor="landing-message">
                {translations[lang].contactMessage}
              </label>
              <textarea
                id="landing-message"
                name="message"
                required
                rows={4}
                className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-base text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder={translations[lang].contactMessagePlaceholder}
              />
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              {translations[lang].contactSubmit}
            </button>
          </form>
        </section>
      </div>
      <footer className="w-full border-t border-blue-100 bg-white/80 px-6 py-4 text-center text-sm text-blue-700">
        <p>
          Built by Mehdi Khedi ·{" "}
          <a
            href="https://mehdikhedi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-800 underline underline-offset-4"
          >
            mehdikhedi.com
          </a>{" "}
          ·{" "}
          <a
            href="mailto:hello@mehdikhedi.com"
            className="font-semibold text-blue-800 underline underline-offset-4"
          >
            hello@mehdikhedi.com
          </a>
        </p>
      </footer>
    </main>
  );
}
