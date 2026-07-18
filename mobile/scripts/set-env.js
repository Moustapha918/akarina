#!/usr/bin/env node
/**
 * set-env.js — Charge l'environnement avant de lancer Expo.
 *
 * Copie .env.{APP_ENV} → .env pour que Expo injecte les bonnes
 * variables EXPO_PUBLIC_* dans le bundle.
 *
 * Usage : node scripts/set-env.js [dev|staging|prod]
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const env = process.argv[2] || 'dev';
const validEnvs = ['dev', 'staging', 'prod'];

if (!validEnvs.includes(env)) {
  console.error(`❌  Environnement invalide: "${env}"`);
  console.error(`    Valeurs acceptées : ${validEnvs.join(' | ')}`);
  process.exit(1);
}

const src = path.join(root, `.env.${env}`);
const dest = path.join(root, '.env');

if (!fs.existsSync(src)) {
  console.error(`\n❌  Fichier manquant : .env.${env}`);
  console.error(`    Crée-le depuis .env.example :`);
  console.error(`    cp .env.example .env.${env}\n`);
  process.exit(1);
}

fs.copyFileSync(src, dest);

const label = { dev: '🔧 DEV', staging: '🧪 STAGING', prod: '🚀 PROD' }[env];
console.log(`\n${label} — .env.${env} → .env ✅\n`);
