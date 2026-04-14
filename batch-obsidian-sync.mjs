#!/usr/bin/env node
/**
 * batch-obsidian-sync.mjs
 * Syncs all batch-evaluated reports (#009–#091) to the Obsidian vault.
 * Run from repo root: node batch-obsidian-sync.mjs
 */

import { execFileSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const CWD = '/Volumes/marlo/Users/asher/_github/career-ops/co-uk';

// All 83 batch evaluations with their geo + status routing
const evaluations = [
  // --- Parloa ---
  { num: '009', slug: '009-parloa-head-fde',                    status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '010', slug: '010-parloa-lead-ai-agent-architect',     status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '011', slug: '011-parloa-senior-ai-agent-architect',   status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '012', slug: '012-parloa-ai-agent-architect',          status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  { num: '013', slug: '013-parloa-senior-agent-architect',      status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '014', slug: '014-parloa-staff-pm',                    status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '015', slug: '015-parloa-fde-devops',                  status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  { num: '016', slug: '016-parloa-fde-voip',                    status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  { num: '017', slug: '017-parloa-senior-fde',                  status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '018', slug: '018-parloa-partner-se-dach',             status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  { num: '019', slug: '019-parloa-partner-se',                  status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  // --- PolyAI ---
  { num: '020', slug: '020-polyai-senior-partner-se',           status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '021', slug: '021-polyai-agent-design-manager',        status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '022', slug: '022-polyai-agent-designer',              status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  // --- Anthropic ---
  { num: '023', slug: '023-anthropic-fde-applied-ai',           status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '024', slug: '024-anthropic-sa-applied-ai',            status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '025', slug: '025-anthropic-applied-ai-eng',           status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '026', slug: '026-anthropic-applied-ai-beneficial',    status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '027', slug: '027-anthropic-applied-ai-digital',       status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '028', slug: '028-anthropic-applied-ai-life-sci',      status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  { num: '029', slug: '029-anthropic-applied-ai-startups',      status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  // --- Intercom ---
  { num: '030', slug: '030-intercom-senior-fde',                status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '031', slug: '031-intercom-senior-ai-deploy-arch',     status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '032', slug: '032-intercom-senior-ai-deploy-cons',     status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '033', slug: '033-intercom-senior-ai-pm',              status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '034', slug: '034-intercom-senior-sa',                 status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '035', slug: '035-intercom-sa',                        status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '036', slug: '036-intercom-senior-se',                 status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '037', slug: '037-intercom-se',                        status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  // --- Glean ---
  { num: '038', slug: '038-glean-fde-pm',                       status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '039', slug: '039-glean-founding-fde',                 status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '040', slug: '040-glean-sa-emea',                      status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '041', slug: '041-glean-partner-sa',                   status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '042', slug: '042-glean-pm-agent-security',            status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  // --- Arize AI ---
  { num: '043', slug: '043-arize-ai-sales-eng-emea',            status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '044', slug: '044-arize-ai-solutions-eng-emea',        status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '045', slug: '045-arize-ai-pm',                        status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '046', slug: '046-arize-ai-solutions-eng',             status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  // --- Vercel ---
  { num: '047', slug: '047-vercel-fde',                         status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '048', slug: '048-vercel-fde-v0',                      status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '049', slug: '049-vercel-gtm-engineer',                status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '050', slug: '050-vercel-sa',                          status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '051', slug: '051-vercel-sw-eng-agent',                status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  // --- Airtable ---
  { num: '052', slug: '052-airtable-ai-agent-arch-cx',          status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '053', slug: '053-airtable-pm-ai',                     status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '054', slug: '054-airtable-senior-partner-sa',         status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  { num: '055', slug: '055-airtable-senior-sa',                 status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  // --- Mistral / n8n / EverAI / V7 ---
  { num: '056', slug: '056-mistral-ai-technical-lead-fde',      status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '057', slug: '057-n8n-senior-se',                      status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '058', slug: '058-n8n-senior-ai-eng',                  status: 'Discarded', geo: 'UK', folder: 'UK Applications' },
  { num: '059', slug: '059-everai-senior-ai-pm',                status: 'Discarded', geo: 'UK', folder: 'UK Applications' },
  { num: '060', slug: '060-v7labs-fde',                         status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  // --- Voice AI ---
  { num: '061', slug: '061-synthflow-ai-fde',                   status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '062', slug: '062-decagon-customer-eng-agent',         status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '063', slug: '063-deepgram-se-enterprise',             status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '064', slug: '064-livekit-fde',                        status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '065', slug: '065-salient-fde-sw',                     status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '066', slug: '066-assemblyai-applied-ai-eng',          status: 'Discarded', geo: 'US', folder: 'US Applications' },
  // --- FDE Other Companies ---
  { num: '067', slug: '067-elevenlabs-fde',                     status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '068', slug: '068-baseten-fde',                        status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '069', slug: '069-fireworks-ai-fde',                   status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '070', slug: '070-lorikeet-fde',                       status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  { num: '071', slug: '071-tavily-fde-partnerships',            status: 'SKIPPED',      geo: 'UK', folder: 'UK Applications' },
  { num: '072', slug: '072-adaptive-ml-fde',                    status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '073', slug: '073-reflection-ai-fde',                  status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '074', slug: '074-workato-senior-fde',                 status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '075', slug: '075-cresta-senior-fde-agent',            status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '076', slug: '076-smartsheet-senior-fde-ai',           status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '077', slug: '077-devrev-fde-architect',               status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '078', slug: '078-labelbox-fde',                       status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '079', slug: '079-agiloft-fde-ai-solutions',           status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  // --- AI Solutions + US Roles ---
  { num: '080', slug: '080-together-ai-ai-sa',                  status: 'Discarded', geo: 'UK', folder: 'UK Applications' },
  { num: '081', slug: '081-uipath-enterprise-ai-sa',            status: 'Discarded', geo: 'UK', folder: 'UK Applications' },
  { num: '082', slug: '082-writer-ai-pm',                       status: 'Discarded', geo: 'UK', folder: 'UK Applications' },
  { num: '083', slug: '083-cohere-applied-ai-agentic',          status: 'Evaluated', geo: 'UK', folder: 'UK Applications' },
  { num: '084', slug: '084-anthropic-fde-federal',              status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '085', slug: '085-polyai-fde-pst',                     status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '086', slug: '086-parloa-senior-lead-fde-us',          status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '087', slug: '087-hume-ai-sr-ai-research-eng',         status: 'SKIPPED',      geo: 'US', folder: 'US Applications' },
  { num: '088', slug: '088-hume-ai-pm-growth',                  status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '089', slug: '089-glean-fde-pm-us',                    status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '090', slug: '090-glean-founding-fde-us',              status: 'Evaluated', geo: 'US', folder: 'US Applications' },
  { num: '091', slug: '091-arize-ai-sales-eng-us',              status: 'Evaluated', geo: 'US', folder: 'US Applications' },
];

let synced = 0, missing = 0, errored = 0;

for (const ev of evaluations) {
  const reportPath = `reports/${ev.slug}-2026-04-13.md`;
  const fullReportPath = resolve(CWD, reportPath);

  if (!existsSync(fullReportPath)) {
    console.warn(`⚠  Missing: ${reportPath}`);
    missing++;
    continue;
  }

  // Extract metadata from report header (first 15 lines)
  const lines = readFileSync(fullReportPath, 'utf8').split('\n').slice(0, 15);

  const titleLine    = lines.find(l => l.startsWith('# Evaluation:')) ?? '';
  const archLine     = lines.find(l => l.startsWith('**Archetype:**')) ?? '';
  const scoreLine    = lines.find(l => l.startsWith('**Score:**')) ?? '';
  const urlLine      = lines.find(l => l.startsWith('**URL:**')) ?? '';
  const locationLine = lines.find(l => l.startsWith('**Location:**')) ?? '';
  const remoteLine   = lines.find(l => l.startsWith('**Remote:**')) ?? '';

  // "# Evaluation: Company — Role Title"
  const titleMatch  = titleLine.match(/^# Evaluation: (.+?) — (.+)$/);
  const company     = titleMatch?.[1]?.trim() ?? ev.slug;
  const role        = titleMatch?.[2]?.trim() ?? '';
  const archetype   = archLine.replace('**Archetype:**', '').trim();
  const score       = scoreLine.replace('**Score:**', '').trim();
  const url         = urlLine.replace('**URL:**', '').trim();
  const location    = locationLine.replace('**Location:**', '').trim();
  const remote      = remoteLine.replace('**Remote:**', '').trim();

  const num         = String(parseInt(ev.num)).padStart(3, '0');
  const obsFile     = `${num} - ${company}.md`;

  const args = [
    'obsidian-sync.mjs',
    '--file',      obsFile,
    '--content',   reportPath,
    '--folder',    ev.folder,
    '--geo',       ev.geo,
    '--company',   company,
    '--role',      role,
    '--score',     score,
    '--status',    ev.status,
    '--archetype', archetype,
    '--url',       url,
    '--pdf',       'false',
    ...(location ? ['--location', location] : []),
    ...(remote   ? ['--remote',   remote]   : []),
  ];

  try {
    execFileSync('node', args, { cwd: CWD, stdio: 'pipe' });
    console.log(`✓ ${ev.num} ${company} — ${role.slice(0, 40)} → ${ev.folder}`);
    synced++;
  } catch (e) {
    const msg = e.stderr?.toString().trim() ?? e.message;
    console.warn(`✗ ${ev.num} ${company}: ${msg}`);
    errored++;
  }
}

console.log(`\n✅ Sync complete: ${synced} synced, ${missing} missing, ${errored} errored`);
