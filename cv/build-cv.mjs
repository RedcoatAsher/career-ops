#!/usr/bin/env node
/**
 * build-cv.mjs — Render geo-specific CV files from a shared base.
 *
 * Usage:
 *   node cv/build-cv.mjs --role head-of-product-design --discipline leadership --geo UK
 *   node cv/build-cv.mjs --role head-of-product-design --discipline leadership --all
 *
 * Inputs:
 *   cv/_shared/base-{role}.md
 *   cv/_shared/geo-overlay.yml
 *   cv/_shared/spelling-rules.yml
 *   config/profiles/_base.yml            (optional — fills {{NAME}}, {{EMAIL}}, etc.)
 *
 * Outputs:
 *   cv/{discipline}/{role}/cv-{role}_{GEO}.md
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import yaml from 'js-yaml';
const parseYaml = (s) => yaml.load(s);

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) {
      const k = cur.slice(2);
      const v = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true';
      acc.push([k, v]);
    }
    return acc;
  }, [])
);

const role = args.role;
const discipline = args.discipline;
const all = args.all === 'true';
const geoArg = args.geo;

if (!role || !discipline) {
  console.error('Usage: node cv/build-cv.mjs --role <role> --discipline <discipline> [--geo US|UK | --all]');
  process.exit(2);
}

const root = resolve(new URL('..', import.meta.url).pathname);
const basePath = join(root, 'cv/_shared', `base-${role}.md`);
const overlayPath = join(root, 'cv/_shared/geo-overlay.yml');
const spellingPath = join(root, 'cv/_shared/spelling-rules.yml');
const profilePath = join(root, 'config/profiles/_base.yml');

if (!existsSync(basePath)) {
  console.error(`base file not found: ${basePath}`);
  process.exit(1);
}

const base = readFileSync(basePath, 'utf8');
const overlay = parseYaml(readFileSync(overlayPath, 'utf8'));
const spelling = parseYaml(readFileSync(spellingPath, 'utf8'));
const profile = existsSync(profilePath) ? parseYaml(readFileSync(profilePath, 'utf8')) : {};

const geos = all ? Object.keys(overlay) : [geoArg];

for (const geo of geos) {
  if (!overlay[geo]) {
    console.error(`unknown geo: ${geo}`);
    continue;
  }
  const rendered = render({ base, overlay: overlay[geo], profile, spelling, geo });
  const outDir = join(root, 'cv', discipline, role);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `cv-${role}_${geo}.md`);
  writeFileSync(outPath, rendered);
  console.log(`wrote ${outPath}`);
}

function render({ base, overlay, profile, spelling, geo }) {
  let out = base;

  // Profile placeholders (geo-agnostic)
  const profileMap = {
    FULL_NAME: profile.full_name ?? profile.name ?? '{{FULL_NAME}}',
    EMAIL: profile.email ?? '{{EMAIL}}',
    LINKEDIN: profile.linkedin ?? '{{LINKEDIN}}',
    PORTFOLIO: profile.portfolio ?? profile.website ?? '{{PORTFOLIO}}',
  };
  for (const [k, v] of Object.entries(profileMap)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }

  // Geo-specific placeholders
  const geoMap = {
    PHONE: overlay.phone,
    ADDRESS_LINE: overlay.address_line ?? '',
    CITIZENSHIP: (overlay.citizenship_order ?? []).join(' · '),
  };
  for (const [k, v] of Object.entries(geoMap)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }

  // Spelling swap only when en-GB
  if (overlay.spelling === 'en-GB') {
    out = applySpelling(out, spelling.swaps ?? {});
  }

  // Strip keep markers from all builds
  out = out.replace(/<!--\s*keep-start\s*-->/g, '').replace(/<!--\s*keep-end\s*-->/g, '');

  return out;
}

// Apply case-preserving swap, but skip text wrapped in <!-- keep-start --> ... <!-- keep-end -->
function applySpelling(text, swaps) {
  const KEEP = /<!--\s*keep-start\s*-->([\s\S]*?)<!--\s*keep-end\s*-->/g;
  const keeps = [];
  const masked = text.replace(KEEP, (_, inner) => {
    keeps.push(inner);
    return `\u0000KEEP${keeps.length - 1}\u0000`;
  });

  let out = masked;
  for (const [from, to] of Object.entries(swaps)) {
    const pattern = new RegExp(`\\b${escapeRe(from)}\\b`, 'g');
    out = out.replace(pattern, (m) => matchCase(m, to));
    const titleFrom = capitalize(from);
    const titlePattern = new RegExp(`\\b${escapeRe(titleFrom)}\\b`, 'g');
    out = out.replace(titlePattern, () => capitalize(to));
    const upperFrom = from.toUpperCase();
    const upperPattern = new RegExp(`\\b${escapeRe(upperFrom)}\\b`, 'g');
    out = out.replace(upperPattern, () => to.toUpperCase());
  }

  out = out.replace(/\u0000KEEP(\d+)\u0000/g, (_, i) => keeps[Number(i)]);
  return out;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function matchCase(src, repl) {
  if (src === src.toUpperCase()) return repl.toUpperCase();
  if (src[0] === src[0].toUpperCase()) return capitalize(repl);
  return repl;
}
