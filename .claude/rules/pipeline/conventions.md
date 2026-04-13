# Pipeline — Stack and Conventions

## Tech Stack

Node.js (mjs modules), Playwright (PDF + scraping), YAML (config), HTML/CSS (template), Markdown (data)

## File Paths

| Path | Purpose |
|------|---------|
| `.mjs` | All scripts |
| `config/` | YAML configuration |
| `output/` | Generated PDFs (gitignored) |
| `reports/` | Evaluation reports |
| `jds/` | Job descriptions (referenced as `local:jds/{file}` in pipeline.md) |
| `batch/` | Batch processing (gitignored except scripts and prompt) |

## Report Numbering

Sequential 3-digit zero-padded. New report = max existing number + 1.

Format: `{###}-{company-slug}-{YYYY-MM-DD}.md`

Example: `002-anthropic-2026-04-13.md`

## Batch Rules

- After each batch of evaluations, run `node merge-tracker.mjs` to merge tracker additions and avoid duplications.
- **NEVER create new entries in `applications.md` if company+role already exists.** Update the existing entry.

## Tools

| Tool | Use |
|------|-----|
| WebSearch | Comp research, company culture, LinkedIn contacts, fallback for JDs |
| WebFetch | Fallback for extracting JDs from static pages |
| Playwright | Verify offer liveness, extract JDs from SPAs. **NEVER run 2+ Playwright agents in parallel — single browser instance.** |
| Read | `cv.md`, `article-digest.md`, `cv-template.html` |
| Write | Temporary HTML for PDF, reports, `applications.md` |
| Edit | Update tracker existing entries |
| Bash | `node generate-pdf.mjs`, `node merge-tracker.mjs` |
