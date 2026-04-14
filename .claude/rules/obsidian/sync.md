# Obsidian Vault Sync

## When This Applies

Any time you write or update a note in the `_jobSeeking` Obsidian vault — whether via `obsidian-sync.mjs` after an evaluation, or editing a vault note manually.

## Vault Layout

| Property | Value |
|----------|-------|
| Vault name | `_jobSeeking` |
| Vault ID | `776ba4285e5de579` |
| Vault path | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/_jobSeeking/` |
| UK jobs folder | `UK Applications/` |
| US jobs folder | `US Applications/` |
| Dashboard | `!Dashboard.md` |

**File naming:** `{###} - {Company Name}.md` (e.g. `002 - Anthropic.md`)

## Geo Rules

Every note MUST have a `geo` frontmatter field:
- Job in UK / Europe / EMEA → `geo: UK`, folder: `UK Applications/`
- Job in US / Americas / explicitly Remote-US → `geo: US`, folder: `US Applications/`
- Unknown / fully remote → default to `UK` (Asher is London-based)

## How to Sync (via script)

After an evaluation, run from the career-ops repo root:

```bash
node obsidian-sync.mjs \
  --file "{###} - {Company Name}.md" \
  --content "reports/{###}-{slug}-{YYYY-MM-DD}.md" \
  --folder "UK Applications" \
  --geo UK \
  --company "{Company}" \
  --role "{Role Title}" \
  --score "{X.X/5}" \
  --status "{Canonical Status}" \
  --archetype "{matched archetype}" \
  --url "{JD URL}" \
  --pdf {true|false} \
  --location "{City or region}" \
  --remote "{remote|on-site}"
```

Requires `OBSIDIAN_API_KEY` in `.env`. Safe when Obsidian is closed — exits 0 with a warning.

## Frontmatter Spec

`obsidian-sync.mjs` auto-injects this frontmatter before the report content:

```yaml
---
tags:
  - application
  - {statusTag}        # derived from status — see pipeline/states.md
  - geo-uk             # or geo-us
date: YYYY-MM-DD
geo: UK                # or US
company: Company Name
role: Role Title
score: X.X/5
status: Evaluated
pdf: false
archetype: Technical AI PM
url: https://...
location: London       # city or region; omitted if unknown
remote: remote         # "remote" or "on-site"; omitted if unknown
---
```

Status tags derive from canonical states — see `.claude/rules/pipeline/states.md`.

## Icon Rule (Iconize plugin)

When a note's `status` is set to `SKIP`, add or update its entry in `.obsidian/plugins/obsidian-icon-folder/data.json`:

```json
"UK Applications/001 - Some Company.md": "❌"
```

Key = path relative to vault root. Do this in the same operation as the status change.

## Dashboard

`!Dashboard.md` uses Dataview. Views: All Active (with Geo column), UK Pipeline, US Pipeline, Skipped/Rejected, All Applications. Filtering is by both folder (`FROM "UK Applications"`) and `WHERE geo = "UK"` to prevent mis-filed notes bleeding into the wrong view.
