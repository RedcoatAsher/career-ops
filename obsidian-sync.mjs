#!/usr/bin/env node
/**
 * obsidian-sync.mjs
 *
 * Writes an application note to the _jobSeeking Obsidian vault
 * via the Obsidian Local REST API plugin (port 27124).
 *
 * Usage:
 *   node obsidian-sync.mjs \
 *     --file "001 - Company Name.md" \
 *     --content reports/001-company-2026-04-12.md \
 *     --folder "UK Applications" \
 *     --company "Company Name" \
 *     --role "Role Title" \
 *     --score "4.2/5" \
 *     --status "Evaluated" \
 *     --archetype "Technical AI PM" \
 *     --url "https://..." \
 *     --pdf false \
 *     --geo UK
 *
 * Requires: OBSIDIAN_API_KEY in .env
 * Safe to run if Obsidian is closed — logs a warning and exits 0.
 */

import https from 'https';
import { readFileSync, existsSync } from 'fs';
import { resolve, join, relative, isAbsolute } from 'path';
import { pathToFileURL } from 'url';
import yaml from 'js-yaml';

// -- Load .env (no dotenv dependency) --
function loadEnv() {
  const envPath = resolve('.env');
  if (!existsSync(envPath)) return {};
  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );
}

const env = loadEnv();
const API_KEY = process.env.OBSIDIAN_API_KEY ?? env.OBSIDIAN_API_KEY;
const PORT = 27124;

// -- Load geo-regions config --
function loadGeoRegions() {
  const p = resolve('config/geo-regions.yml');
  if (!existsSync(p)) return null;
  try {
    return yaml.load(readFileSync(p, 'utf8'));
  } catch { return null; }
}

// -- Read default_geo from profile.yml --
function getDefaultGeo() {
  const p = resolve('config/profile.yml');
  if (!existsSync(p)) return null;
  try {
    const prof = yaml.load(readFileSync(p, 'utf8'));
    return prof?.location?.default_geo ?? null;
  } catch { return null; }
}

// -- Resolve geo from folder name by matching obsidian_folder in config --
function inferGeoFromFolder(folderName, geoConfig) {
  if (!geoConfig?.regions) return null;
  for (const [code, region] of Object.entries(geoConfig.regions)) {
    if (region.obsidian_folder === folderName) return code;
  }
  return null;
}

if (!API_KEY) {
  console.warn('⚠  OBSIDIAN_API_KEY not set — skipping vault sync');
  process.exit(0);
}

// -- Parse args --
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const file    = get('--file');
const content = get('--content');

if (!file || !content) {
  if (args.includes('--auto')) {
    // Called by hook without file/content — nothing to sync, exit silently
    process.exit(0);
  }
  console.error('Usage: node obsidian-sync.mjs --file "001 - Company.md" --content reports/001-slug.md [--folder "..."] [--geo CODE] [options]');
  process.exit(1);
}

// -- Resolve geo and folder from config (data-driven, not hardcoded) --
const geoRegions = loadGeoRegions();
const geoArg    = get('--geo');
const folderArg = get('--folder');

// Resolution chain: --geo arg → infer from --folder → default_geo from profile → config fallback → 'US'
const geo = geoArg
  ?? (folderArg ? inferGeoFromFolder(folderArg, geoRegions) : null)
  ?? getDefaultGeo()
  ?? geoRegions?.default_fallback
  ?? 'US';

// Folder: --folder arg → lookup from geo config → generic fallback
const folder = folderArg
  ?? geoRegions?.regions?.[geo]?.obsidian_folder
  ?? `${geo} Applications`;

if (!existsSync(content)) {
  console.error(`Content file not found: ${content}`);
  process.exit(1);
}

// -- Build frontmatter --
const _now = new Date();
const _localDate = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;
const date      = get('--date')      ?? _localDate;
const company   = get('--company')   ?? '';
const role      = get('--role')      ?? '';
const score     = get('--score')     ?? '';
const status    = get('--status')    ?? 'Evaluated';
const archetype = get('--archetype') ?? '';
const url       = get('--url')       ?? '';
const pdf       = get('--pdf')       ?? 'false';
const pdfBool   = String(pdf).toLowerCase() === 'true';
const pdfFile   = get('--pdf-file')  ?? '';
const location  = get('--location')  ?? '';
const remote    = get('--remote')    ?? '';

// -- YAML scalar escaping --
function yamlEscape(val) {
  if (!val) return '""';
  const escaped = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  return `"${escaped}"`;
}

const statusTagMap = {
  'Evaluated': 'evaluated',
  'Applied': 'applied',
  'Responded': 'responded',
  'SKIP': 'skip',
  'Rejected': 'rejected',
  'Discarded': 'discarded',
  'Interview': 'interview',
  'Offer': 'offer',
};
const statusTag = statusTagMap[status] ?? 'evaluated';

const frontmatter = [
  '---',
  'tags:',
  '  - application',
  `  - ${statusTag}`,
  `  - geo-${geo.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  ...(remote ? [`  - ${remote.toLowerCase().replace(/[^a-z]/g, '-')}`] : []),
  `date: ${date}`,
  `geo: ${yamlEscape(geo)}`,
  `company: ${yamlEscape(company)}`,
  `role: ${yamlEscape(role)}`,
  `score: ${yamlEscape(score)}`,
  `status: ${yamlEscape(status)}`,
  `pdf: ${pdfBool}`,
  `archetype: ${yamlEscape(archetype)}`,
  `url: ${yamlEscape(url)}`,
  ...(location ? [`location: ${yamlEscape(location)}`] : []),
  ...(remote   ? [`remote: ${yamlEscape(remote)}`]     : []),
  '---',
  '',
].join('\n');

function getRepoRoot() {
  const p = resolve('config/profile.yml');
  if (!existsSync(p)) return '';
  const m = readFileSync(p, 'utf8').match(/repo_root:\s*"?([^"\n]+)"?/);
  return m ? m[1].trim() : '';
}
const repoRoot = getRepoRoot();

let reportContent = readFileSync(content, 'utf8');
if (pdfFile && !repoRoot) {
  console.warn('⚠  --pdf-file provided but paths.repo_root is not set in config/profile.yml — skipping PDF link');
}
if (pdfFile && repoRoot) {
  // Validate: plain filename only (no path separators)
  if (/[/\\]/.test(pdfFile)) {
    console.warn(`⚠  Invalid --pdf-file value (path traversal attempt): ${pdfFile}`);
  } else {
    const outputDir = join(repoRoot, 'output');
    const absPath = resolve(join(outputDir, pdfFile));
    const rel = relative(outputDir, absPath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      console.warn(`⚠  Resolved PDF path escapes output dir — skipping link`);
    } else if (!existsSync(absPath)) {
      reportContent = reportContent.replace(
        /\*\*PDF:\*\*.*/,
        `**PDF:** ❌ file not found`
      );
    } else {
      const fileUrl = pathToFileURL(absPath).href;
      const safePdfName = pdfFile.replace(/([[\]()])/g, '\\$1');
      reportContent = reportContent.replace(
        /\*\*PDF:\*\*.*/,
        `**PDF:** ✅ [${safePdfName}](${fileUrl})`
      );
    }
  }
}
const noteContent = frontmatter + reportContent;

// -- PUT to vault --
function hasInvalidVaultSegments(value, { allowSlash = false } = {}) {
  if (/\\/.test(value)) return true;
  if (!allowSlash && value.includes('/')) return true;
  return value.split('/').some(seg => !seg || seg === '.' || seg === '..');
}
if (hasInvalidVaultSegments(file) || hasInvalidVaultSegments(folder, { allowSlash: true })) {
  console.error(`Invalid --file or --folder value (path traversal attempt): ${folder}/${file}`);
  process.exit(1);
}
const encodedPath = `${folder}/${file}`.split('/').map(encodeURIComponent).join('/');
const body = Buffer.from(noteContent, 'utf8');

const options = {
  hostname: 'localhost',
  port: PORT,
  path: `/vault/${encodedPath}`,
  method: 'PUT',
  rejectUnauthorized: false, // self-signed cert
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'text/markdown',
    'Content-Length': body.length,
  },
};

const req = https.request(options, (res) => {
  if (res.statusCode >= 200 && res.statusCode < 300) {
    console.log(`✓ Obsidian: ${folder}/${file}`);
  } else {
    console.warn(`⚠  Obsidian sync returned ${res.statusCode} — skipping`);
  }
});

req.setTimeout(10000, () => {
  req.destroy(new Error('Request timed out'));
});

req.on('error', (e) => {
  console.warn(`⚠  Obsidian vault unreachable (is Obsidian open?): ${e.message}`);
});

req.write(body);
req.end();
