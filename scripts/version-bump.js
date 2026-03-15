#!/usr/bin/env node

/**
 * Version bump script
 * Usage:
 *   node scripts/version-bump.js patch   → 1.0.1 → 1.0.2
 *   node scripts/version-bump.js minor   → 1.0.1 → 1.1.0
 *   node scripts/version-bump.js major   → 1.0.1 → 2.0.0
 *   node scripts/version-bump.js 1.2.3   → set exact version
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// --- Read current version from package.json ---
const pkgPath = resolve(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);

const bump = process.argv[2] || 'patch';
let newVersion;

if (/^\d+\.\d+\.\d+$/.test(bump)) {
  newVersion = bump;
} else if (bump === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (bump === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else {
  newVersion = `${major}.${minor}.${patch + 1}`;
}

console.log(`Bumping version: ${pkg.version} → ${newVersion}`);

// --- 1. Update package.json ---
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('✓ package.json');

// --- 2. Update Android build.gradle ---
const gradlePath = resolve(root, 'android/app/build.gradle');
let gradle = readFileSync(gradlePath, 'utf8');

// versionCode: increment by 1 each time
const versionCodeMatch = gradle.match(/versionCode\s+(\d+)/);
const currentCode = versionCodeMatch ? parseInt(versionCodeMatch[1]) : 0;
const newCode = currentCode + 1;

gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${newCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${newVersion}"`);

writeFileSync(gradlePath, gradle);
console.log(`✓ android/app/build.gradle  (versionCode: ${currentCode} → ${newCode})`);

// --- 3. Update iOS project.pbxproj ---
const pbxprojPath = resolve(root, 'ios/App/App.xcodeproj/project.pbxproj');
let pbx = readFileSync(pbxprojPath, 'utf8');

// CURRENT_PROJECT_VERSION: increment by 1 each time (same as Android versionCode)
const iosCodeMatch = pbx.match(/CURRENT_PROJECT_VERSION = (\d+)/);
const currentIosCode = iosCodeMatch ? parseInt(iosCodeMatch[1]) : 0;
const newIosCode = newCode; // keep in sync with Android versionCode

pbx = pbx
  .replace(/CURRENT_PROJECT_VERSION = \d+/g, `CURRENT_PROJECT_VERSION = ${newIosCode}`)
  .replace(/MARKETING_VERSION = [^;]+/g, `MARKETING_VERSION = ${newVersion}`);

writeFileSync(pbxprojPath, pbx);
console.log(`✓ ios/App/App.xcodeproj/project.pbxproj  (build: ${currentIosCode} → ${newIosCode})`);

console.log(`\nDone! New version: ${newVersion} (build ${newIosCode})`);
console.log('Run "npm run sync" to rebuild and sync to native projects.');
