#!/usr/bin/env node
/**
 * Generate access credentials for Shadowbroker Turbo
 *
 * Usage:
 *   node scripts/generate-key.js                          # Generate master admin key
 *   node scripts/generate-key.js --user "john@example.com" # Generate per-user code
 *   node scripts/generate-key.js --user "john@example.com" --hours 48
 */

const crypto = require('crypto');

function generateMasterKey(length = 48) {
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

/**
 * Generate a self-validating, time-limited user access code.
 * Requires SECRET_KEY to be set in the environment.
 */
function generateUserCode(userId, hours = 24, secretKey) {
  if (!secretKey) {
    throw new Error('SECRET_KEY environment variable is required to generate user codes');
  }

  const expiry = Math.floor(Date.now() / 1000) + (hours * 3600);
  const payload = `${userId.toLowerCase().trim()}:${expiry}`;

  // Create HMAC signature using Node.js crypto
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(payload);
  const signature = hmac.digest('hex').slice(0, 10);

  // Base64url encode
  const code = Buffer.from(payload + ':' + signature)
    .toString('base64url');

  return code;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const userIndex = args.indexOf('--user');
  const hoursIndex = args.indexOf('--hours');

  return {
    userId: userIndex !== -1 ? args[userIndex + 1] : null,
    hours: hoursIndex !== -1 ? parseInt(args[hoursIndex + 1], 10) : 24,
  };
}

const { userId, hours } = parseArgs();

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║     SHADOWBROKER TURBO — ACCESS KEY GENERATOR             ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

if (userId) {
  // Per-user code generation
  const secretKey = process.env.SECRET_KEY;

  if (!secretKey) {
    console.log('❌ ERROR: SECRET_KEY environment variable is not set.');
    console.log('');
    console.log('To generate per-user codes, you must set SECRET_KEY first:');
    console.log('');
    console.log('  export SECRET_KEY="your-secret-key-here"');
    console.log('  node scripts/generate-key.js --user "john@example.com"');
    console.log('');
    console.log('Or generate a new master key first:');
    console.log('  node scripts/generate-key.js');
    console.log('');
    process.exit(1);
  }

  try {
    const code = generateUserCode(userId, hours, secretKey);
    const expiryDate = new Date(Date.now() + hours * 3600 * 1000).toLocaleString();

    console.log(`User:      ${userId}`);
    console.log(`Expires:   ${expiryDate} (${hours} hours from now)`);
    console.log('');
    console.log('ACCESS CODE (give this to the user):');
    console.log(code);
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('HOW THE USER LOGS IN:');
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    console.log('1. Go to the deployed app');
    console.log('2. Click "Privacy Policy" in the footer');
    console.log('3. Paste the access code above into the modal');
    console.log('4. Click "Access System"');
    console.log('');
    console.log('The code is self-validating — no database or redeploy needed.');
    console.log('───────────────────────────────────────────────────────────\n');
  } catch (err) {
    console.error('❌ Error generating code:', err.message);
    process.exit(1);
  }
} else {
  // Master key generation
  const secretKey = generateMasterKey();
  const encryptionKey = generateEncryptionKey();

  console.log('NEW MASTER CREDENTIALS (set these as Vercel env vars):');
  console.log('');
  console.log('SECRET_KEY (admin login + user code signing):');
  console.log(secretKey);
  console.log('');
  console.log('ENCRYPTION_KEY (session encryption):');
  console.log(encryptionKey);
  console.log('');
  console.log('───────────────────────────────────────────────────────────');
  console.log('SETUP INSTRUCTIONS:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('');
  console.log('1. Set environment variables on Vercel:');
  console.log('');
  console.log('   npx vercel env add SECRET_KEY production');
  console.log('   (paste the SECRET_KEY above)');
  console.log('');
  console.log('   npx vercel env add ENCRYPTION_KEY production');
  console.log('   (paste the ENCRYPTION_KEY above)');
  console.log('');
  console.log('2. Redeploy:');
  console.log('   npx vercel --prod');
  console.log('');
  console.log('3. Generate per-user access codes:');
  console.log('   export SECRET_KEY="' + secretKey + '"');
  console.log('   node scripts/generate-key.js --user "john@example.com" --hours 24');
  console.log('');
  console.log('───────────────────────────────────────────────────────────\n');
}
