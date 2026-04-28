#!/usr/bin/env node
/**
 * Generate a secure access key for Shadowbroker Turbo
 * Usage: node scripts/generate-key.js
 */

const crypto = require('crypto');

function generateKey(length = 48) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, length);
}

function generateEncryptionKey(length = 32) {
  return crypto.randomBytes(length)
    .toString('base64')
    .slice(0, length);
}

const secretKey = generateKey();
const encryptionKey = generateEncryptionKey();

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║     SHADOWBROKER TURBO — ACCESS KEY GENERATOR             ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('SECRET_KEY (used to log in):');
console.log(secretKey);
console.log('');
console.log('ENCRYPTION_KEY (used for session encryption):');
console.log(encryptionKey);
console.log('');

console.log('───────────────────────────────────────────────────────────');
console.log('SETUP INSTRUCTIONS:');
console.log('───────────────────────────────────────────────────────────');
console.log('');
console.log('1. Set these as Vercel environment variables:');
console.log('');
console.log('   npx vercel env add SECRET_KEY production');
console.log('   (paste: ' + secretKey + ')');
console.log('');
console.log('   npx vercel env add ENCRYPTION_KEY production');
console.log('   (paste: ' + encryptionKey + ')');
console.log('');
console.log('2. Redeploy:');
console.log('   npx vercel --prod');
console.log('');
console.log('3. Log in at the deployed URL using the SECRET_KEY above.');
console.log('');
console.log('───────────────────────────────────────────────────────────\n');
