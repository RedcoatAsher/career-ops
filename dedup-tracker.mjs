#!/usr/bin/env node
/**
 * dedup-tracker.mjs — Remove duplicate entries from applications.md
 *
 * Groups by normalized company + fuzzy role match.
 * Keeps entry with highest score. If discarded entry had more advanced status,
 * preserves that status. Merges notes.
 *
 * Run: node career-ops/dedup-tracker.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const CAREER_OPS = new URL('.', import.meta.url).pathname;
// Support both layouts: data/applications.md (boilerplate) and applications.md (original)
const APPS_FILE = existsSync(join(CAREER_OPS, 'data/applications.md'))
  ? join(CAREER_OPS, 'data/applications.md')
  : join(CAREER_OPS, 'applications.md');
const DRY_RUN = process.argv.includes('--dry-run');

// Status advancement order (higher = more advanced in pipeline)
// Includes legacy Spanish values for existing tracker rows
const STATUS_RANK = {
  // English canonical
  'skip': 0,
  'discarded': 0,
  'rejected': 1,
  'evaluated': 2,
  'applied': 3,
  'responded': 4,
  'interview': 5,
  'offer': 6,
  // Legacy Spanish
  'no aplicar': 0,
  'descartado': 0,
  'rechazado': 1,
  'evaluada': 2,
  'aplicado': 3,
  'respondido': 4,
  'entrevista': 5,
  'oferta': 6,
};

function normalizeCompany(name) {
  return name.toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

// Generic words that carry no discriminating signal for role matching
const ROLE_STOP_WORDS = new Set([
  'senior', 'staff', 'principal', 'lead', 'head', 'junior', 'associate',
  'director', 'manager', 'engineer', 'developer', 'architect', 'specialist',
  'analyst', 'consultant', 'advisor', 'executive', 'officer', 'president',
  'and', 'the', 'for', 'with', 'of', 'in', 'at', 'to', 'a', 'an',
]);

function normalizeRole(role) {
  return role.toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 /]/g, '')
    .trim();
}

function significantWords(role) {
  return normalizeRole(role)
    .split(/\s+/)
    .filter(w => w.length > 3 && !ROLE_STOP_WORDS.has(w));
}

function roleMatch(a, b) {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  // Both roles must have significant words, and need 3+ overlapping
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const overlap = wordsA.filter(w => wordsB.some(wb => wb === w || (w.length > 5 && (wb.includes(w) || w.includes(wb)))));
  return overlap.length >= 3;
}

function normalizeLocation(loc) {
  if (!loc) return '';
  return loc.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseScore(s) {
  const m = s.replace(/\*\*/g, '').match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

function parseAppLine(line) {
  const parts = line.split('|').map(s => s.trim());
  // New format (11 data cols): # | Date | Company | Role | Location | Remote | Score | Status | PDF | Report | Notes
  // Old format (9 data cols):  # | Date | Company | Role | Score | Status | PDF | Report | Notes
  const isNewFormat = parts.length >= 13;
  if (parts.length < 11) return null;
  const num = parseInt(parts[1]);
  if (isNaN(num)) return null;
  if (isNewFormat) {
    return {
      num,
      date: parts[2],
      company: parts[3],
      role: parts[4],
      location: parts[5],
      remote: parts[6],
      score: parts[7],
      status: parts[8],
      pdf: parts[9],
      report: parts[10],
      notes: parts[11] || '',
      raw: line,
    };
  } else {
    // Legacy format without location/remote columns
    return {
      num,
      date: parts[2],
      company: parts[3],
      role: parts[4],
      location: '',
      remote: '',
      score: parts[5],
      status: parts[6],
      pdf: parts[7],
      report: parts[8],
      notes: parts[9] || '',
      raw: line,
    };
  }
}

// Read
if (!existsSync(APPS_FILE)) {
  console.log('No applications.md found. Nothing to dedup.');
  process.exit(0);
}
const content = readFileSync(APPS_FILE, 'utf-8');
const lines = content.split('\n');

// Parse all entries
const entries = [];
const entryLineMap = new Map(); // num → line index

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith('|')) continue;
  const app = parseAppLine(lines[i]);
  if (app && app.num > 0) {
    entries.push(app);
    entryLineMap.set(app.num, i);
  }
}

console.log(`📊 ${entries.length} entries loaded`);

// Group by company + location — entries in different geos are never duplicates
const groups = new Map();
for (const entry of entries) {
  const key = `${normalizeCompany(entry.company)}::${normalizeLocation(entry.location)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(entry);
}

// Find duplicates
let removed = 0;
const linesToRemove = new Set();

for (const [company, companyEntries] of groups) {
  if (companyEntries.length < 2) continue;

  // Within same company, find role matches
  const processed = new Set();
  for (let i = 0; i < companyEntries.length; i++) {
    if (processed.has(i)) continue;
    const cluster = [companyEntries[i]];
    processed.add(i);

    for (let j = i + 1; j < companyEntries.length; j++) {
      if (processed.has(j)) continue;
      if (roleMatch(companyEntries[i].role, companyEntries[j].role)) {
        cluster.push(companyEntries[j]);
        processed.add(j);
      }
    }

    if (cluster.length < 2) continue;

    // Keep the one with highest score
    cluster.sort((a, b) => parseScore(b.score) - parseScore(a.score));
    const keeper = cluster[0];

    // Check if any removed entry has more advanced status
    let bestStatusRank = STATUS_RANK[keeper.status.toLowerCase()] || 0;
    let bestStatus = keeper.status;
    for (let k = 1; k < cluster.length; k++) {
      const rank = STATUS_RANK[cluster[k].status.toLowerCase()] || 0;
      if (rank > bestStatusRank) {
        bestStatusRank = rank;
        bestStatus = cluster[k].status;
      }
    }

    // Update keeper's status if a removed entry had a more advanced one
    if (bestStatus !== keeper.status) {
      const lineIdx = entryLineMap.get(keeper.num);
      if (lineIdx !== undefined) {
        const parts = lines[lineIdx].split('|').map(s => s.trim());
        const statusIdx = parts.length >= 13 ? 8 : 6; // new format vs legacy
        parts[statusIdx] = bestStatus;
        lines[lineIdx] = '| ' + parts.slice(1, -1).join(' | ') + ' |';
        console.log(`  📝 #${keeper.num}: status promoted to "${bestStatus}" (from #${cluster.find(e => e.status === bestStatus)?.num})`);
      }
    }

    // Remove duplicates
    for (let k = 1; k < cluster.length; k++) {
      const dup = cluster[k];
      const lineIdx = entryLineMap.get(dup.num);
      if (lineIdx !== undefined) {
        linesToRemove.add(lineIdx);
        removed++;
        console.log(`🗑️  Remove #${dup.num} (${dup.company} — ${dup.role}, ${dup.score}) → kept #${keeper.num} (${keeper.score})`);
      }
    }
  }
}

// Remove lines (in reverse order to preserve indices)
const sortedRemoveIndices = [...linesToRemove].sort((a, b) => b - a);
for (const idx of sortedRemoveIndices) {
  lines.splice(idx, 1);
}

console.log(`\n📊 ${removed} duplicates removed`);

if (!DRY_RUN && removed > 0) {
  copyFileSync(APPS_FILE, APPS_FILE + '.bak');
  writeFileSync(APPS_FILE, lines.join('\n'));
  console.log('✅ Written to applications.md (backup: applications.md.bak)');
} else if (DRY_RUN) {
  console.log('(dry-run — no changes written)');
} else {
  console.log('✅ No duplicates found');
}
