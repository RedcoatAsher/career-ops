#!/usr/bin/env node
/**
 * aggregate-legacy-roles.mjs
 *
 * One-shot migration helper. Run on your local Mac (not in the sandbox).
 * Reads applications.md + reports/ from your dev-uk and dev-us checkouts,
 * extracts distinct role titles, and writes a review list to
 * cv/_roles-discovered.md so you can approve before scaffolding.
 *
 * Usage (local only):
 *   node scripts/aggregate-legacy-roles.mjs \
 *     --uk /Volumes/marlo/Users/asher/_github/career-ops/dev-uk \
 *     --us /Volumes/marlo/Users/asher/_github/career-ops/dev-us \
 *     [--out cv/_roles-discovered.md]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';

const args = parseArgs(process.argv.slice(2));
const ukRoot = args.uk;
const usRoot = args.us;
const outPath = resolve(args.out ?? 'cv/_roles-discovered.md');

if (!ukRoot || !usRoot) {
  console.error('Usage: node scripts/aggregate-legacy-roles.mjs --uk <path> --us <path> [--out <file>]');
  process.exit(2);
}

const discoveries = new Map(); // key: normalizedRole, value: { role, sources, count, geos:Set }

harvest(ukRoot, 'UK');
harvest(usRoot, 'US');

const sorted = [...discoveries.values()].sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));

let out = `# Roles discovered across dev-uk and dev-us\n\n`;
out += `Generated: ${new Date().toISOString()}\n\n`;
out += `| # | Role title | Count | Geos | Sample sources |\n`;
out += `|---|------------|-------|------|----------------|\n`;
sorted.forEach((d, i) => {
  out += `| ${i + 1} | ${d.role} | ${d.count} | ${[...d.geos].join(', ')} | ${d.sources.slice(0, 2).join(' · ')} |\n`;
});
out += `\n## Next steps\n\n`;
out += `1. Review the list. Group roles by discipline (design, leadership, ai, ...).\n`;
out += `2. For each distinct role you want to target, ask Claude to scaffold:\n`;
out += `   \`cv/<discipline>/<role>/\` + \`cv/_shared/base-<role>.md\`.\n`;
out += `3. Fill the base file with content from your existing CVs.\n`;
out += `4. Run \`node cv/build-cv.mjs --role <role> --discipline <discipline> --all\`.\n`;

writeFileSync(outPath, out);
console.log(`Wrote ${outPath} with ${sorted.length} distinct roles.`);

// ---- helpers ----

function harvest(root, geo) {
  if (!existsSync(root)) {
    console.warn(`[warn] path not found: ${root} — skipping`);
    return;
  }
  // 1. applications.md tracker
  const apps = findFirst(root, ['data/applications.md', 'data/applications-us.md', 'data/applications-uk.md']);
  for (const file of apps) {
    const text = readFileSync(file, 'utf8');
    for (const row of text.split('\n')) {
      if (!row.startsWith('|')) continue;
      const cols = row.split('|').map(s => s.trim());
      // applications.md columns: | # | Date | Company | Role | Location | ... |
      if (cols.length < 5) continue;
      const role = cols[4];
      if (!role || role === 'Role' || role.startsWith('-')) continue;
      add(role, geo, `${shortPath(root)}:applications.md`);
    }
  }

  // 2. reports/*.md — look for "## Role" or header patterns
  const reportsDir = join(root, 'reports');
  if (existsSync(reportsDir)) {
    for (const f of readdirSync(reportsDir)) {
      if (!f.endsWith('.md')) continue;
      const p = join(reportsDir, f);
      const text = readFileSync(p, 'utf8');
      const m = text.match(/\*\*Role:\*\*\s*(.+)/i) || text.match(/^#\s+.+?\s[-—]\s*(.+)$/m);
      if (m) add(m[1].trim(), geo, `${shortPath(root)}:reports/${f}`);
    }
  }

  // 3. jds/*.md frontmatter or first line
  const jdsDir = join(root, 'jds');
  if (existsSync(jdsDir)) {
    for (const f of readdirSync(jdsDir)) {
      if (!f.endsWith('.md')) continue;
      const text = readFileSync(join(jdsDir, f), 'utf8');
      const m = text.match(/^title:\s*(.+)$/m) || text.match(/^#\s+(.+)$/m);
      if (m) add(m[1].trim(), geo, `${shortPath(root)}:jds/${f}`);
    }
  }
}

function add(role, geo, source) {
  const key = normalize(role);
  if (!key) return;
  if (!discoveries.has(key)) discoveries.set(key, { role, sources: [], count: 0, geos: new Set() });
  const d = discoveries.get(key);
  d.count += 1;
  d.geos.add(geo);
  if (d.sources.length < 5) d.sources.push(source);
}

function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w ]/g, '').trim();
}

function findFirst(root, candidates) {
  return candidates.map(c => join(root, c)).filter(p => existsSync(p) && statSync(p).isFile());
}

function shortPath(p) {
  const parts = p.split('/');
  return parts.slice(-1)[0] || p;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      out[k] = v;
    }
  }
  return out;
}
