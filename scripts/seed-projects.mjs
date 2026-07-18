/**
 * Script de seed — Projets de test Akarina
 * Usage: node scripts/seed-projects.mjs
 *
 * Requiert: npm install firebase (dans ce dossier ou global)
 * Les credentials sont lus depuis mobile/.env
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Charger les variables depuis mobile/.env ────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../mobile/.env');
const envContent = readFileSync(envPath, 'utf-8');

const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
);

// ── Init Firebase ────────────────────────────────────────────────────────────
const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

// ── Données de test ─────────────────────────────────────────────────────────
const now = Timestamp.now();

const projects = [
  {
    title: 'Résidence Al-Amal – Tevragh-Zeina',
    description:
      'Immeuble R+4 de 20 appartements modernes au cœur de Tevragh-Zeina. ' +
      'Projet clé-en-main avec finition haut de gamme, parking souterrain et espace vert commun. ' +
      'Idéal pour la location longue durée à une clientèle d\'expatriés et de cadres.',
    location: 'Tevragh-Zeina, Nouakchott',
    targetAmount: 15_000_000,
    collectedAmount: 9_750_000,
    roiEstimate: 14.5,
    roiDurationMonths: 24,
    status: 'OPEN',
    coverImageUrl:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    imageUrls: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800',
    ],
    maxInvestors: 150,
    currentInvestors: 97,
    minInvestment: 50_000,
    createdAt: now,
    updatedAt: now,
  },
  {
    title: 'Plaza Ksar – Zone Franche',
    description:
      'Centre commercial mixte (commerces + bureaux) en zone franche de Nouadhibou. ' +
      'Emplacement stratégique à 500m du port. Revenus locatifs garantis par des baux commerciaux ' +
      'signés dès l\'ouverture. Fort potentiel de plus-value dans une zone en plein développement.',
    location: 'Nouadhibou, Zone Franche',
    targetAmount: 30_000_000,
    collectedAmount: 30_000_000,
    roiEstimate: 18.0,
    roiDurationMonths: 36,
    status: 'FUNDED',
    coverImageUrl:
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
    imageUrls: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
    ],
    maxInvestors: 200,
    currentInvestors: 200,
    minInvestment: 100_000,
    createdAt: Timestamp.fromDate(new Date('2025-11-01')),
    updatedAt: now,
  },
  {
    title: 'Villas Sahel – Dar Naim',
    description:
      'Lotissement de 10 villas individuelles (F5) avec jardins privatifs à Dar Naim. ' +
      'Construction en cours — livraison prévue T1 2027. Les villas sont déjà réservées à 60% ' +
      'par des clients de la diaspora. Rendement locatif estimé à 16% sur 30 mois.',
    location: 'Dar Naim, Nouakchott',
    targetAmount: 8_500_000,
    collectedAmount: 4_200_000,
    roiEstimate: 16.0,
    roiDurationMonths: 30,
    status: 'CONSTRUCTION',
    coverImageUrl:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    imageUrls: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    ],
    maxInvestors: 80,
    currentInvestors: 42,
    minInvestment: 75_000,
    createdAt: Timestamp.fromDate(new Date('2025-09-15')),
    updatedAt: now,
  },
  {
    title: 'Tour Wadi – Ksar',
    description:
      'Premier projet complété par Akarina ! Tour mixte R+7 (commerces RDC + appartements) ' +
      'dans le quartier historique de Ksar. Projet livré en avril 2025, retour sur investissement ' +
      'distribué intégralement aux partenaires. Référence de transparence et de réussite.',
    location: 'Ksar, Nouakchott',
    targetAmount: 12_000_000,
    collectedAmount: 12_000_000,
    roiEstimate: 15.2,
    roiDurationMonths: 18,
    status: 'COMPLETED',
    coverImageUrl:
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800',
    imageUrls: [
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800',
    ],
    maxInvestors: 120,
    currentInvestors: 118,
    minInvestment: 50_000,
    createdAt: Timestamp.fromDate(new Date('2024-06-01')),
    updatedAt: Timestamp.fromDate(new Date('2025-04-30')),
  },
];

// ── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🌱  Seed → Firebase Project: ${env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}\n`);

  for (const project of projects) {
    const ref = await addDoc(collection(db, 'projects'), project);
    console.log(`  ✓ "${project.title}" → ${ref.id}`);

    // Ajouter une actualité de test pour les projets en cours
    if (project.status === 'CONSTRUCTION') {
      await addDoc(collection(db, 'projects', ref.id, 'updates'), {
        projectId: ref.id,
        title: 'Début des fondations',
        description:
          'Les travaux de terrassement et de fondation ont démarré cette semaine. ' +
          'L\'équipe est sur place 6j/7. Prochain rapport dans 2 semaines.',
        imageUrls: [
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        ],
        videoUrl: null,
        publishedAt: Timestamp.fromDate(new Date('2026-01-10')),
      });
      console.log(`    ↳ Actualité ajoutée`);
    }
  }

  console.log('\n✅  Seed terminé avec succès !\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Erreur seed :', err);
  process.exit(1);
});
