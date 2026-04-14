# Pipeline — Tracker Format and Integrity

## TSV Format for Tracker Additions

Write **one TSV file per evaluation** to `batch/tracker-additions/{num}-{company-slug}.tsv`.
Single line, 11 tab-separated columns:

```
{num}\t{date}\t{company}\t{role}\t{location}\t{remote}\t{status}\t{score}/5\t{pdf_emoji}\t[{num}](reports/{num}-{slug}-{date}.md)\t{note}
```

**Column order:**

| # | Field | Format |
|---|-------|--------|
| 1 | num | integer |
| 2 | date | YYYY-MM-DD |
| 3 | company | short name |
| 4 | role | job title |
| 5 | location | city/region (e.g. `London`, `New York`, `Remote`) |
| 6 | remote | `remote` or `on-site` |
| 7 | status | canonical (see `states.md`) |
| 8 | score | `X.X/5` e.g. `4.2/5` |
| 9 | pdf | `✅` or `❌` |
| 10 | report | `[num](reports/num-slug-date.md)` |
| 11 | notes | one-line summary |

**Note:** In `applications.md`, score comes BEFORE status. `merge-tracker.mjs` handles legacy 9-col TSVs without location/remote (those fields default to empty).

## Tracker Files

| File | Geo | Notes |
|------|-----|-------|
| `data/applications.md` | UK only | Used by all maintenance scripts |
| `data/applications-us.md` | US only | Edit directly — scripts do not touch this file |

**Always write to the correct tracker based on job geo.** Unknown / fully remote → default to UK.

## Pipeline Integrity Rules

1. **NEVER edit `data/applications.md` to ADD new entries** — write TSV to `batch/tracker-additions/` and run `merge-tracker.mjs`
2. **YES** — edit either tracker to UPDATE status/notes of existing entries
3. For US entries, edit `data/applications-us.md` directly (no TSV/merge needed)
4. All reports MUST include `**URL:**` in the header (between Score and PDF)
5. All statuses MUST be canonical — see `.claude/rules/pipeline/states.md`

## Maintenance Scripts

| Script | When to run |
|--------|-------------|
| `node merge-tracker.mjs` | After any batch of evaluations |
| `node verify-pipeline.mjs` | Health check |
| `node normalize-statuses.mjs` | Fix non-canonical status values |
| `node dedup-tracker.mjs` | Remove duplicate entries |
