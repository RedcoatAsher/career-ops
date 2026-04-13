# Career-Ops — AI Job Search Pipeline

AI-powered job search automation for Asher Peruscini: pipeline tracking, offer evaluation, CV generation, portal scanning, batch processing. **Designed to be made yours** — edit any file directly when the user asks.

## Main Files

| File | Function |
|------|----------|
| `data/applications.md` | Application tracker — UK only |
| `data/applications-us.md` | Application tracker — US only |
| `data/pipeline.md` | Inbox of pending URLs |
| `data/scan-history.tsv` | Scanner dedup history |
| `portals.yml` | Query and company config |
| `templates/cv-template.html` | HTML template for CVs |
| `generate-pdf.mjs` | Puppeteer: HTML to PDF |
| `obsidian-sync.mjs` | Sync evaluations to Obsidian vault |
| `article-digest.md` | Compact proof points from portfolio (optional) |
| `interview-prep/story-bank.md` | STAR+R stories across evaluations |
| `reports/` | Evaluation reports (`{###}-{company-slug}-{YYYY-MM-DD}.md`) |

## CV Source of Truth

- `cv.md` in project root is the canonical CV; `article-digest.md` has detailed proof points
- **NEVER hardcode metrics** — read them from these files at evaluation time

## Ethical Use — CRITICAL

- **NEVER submit an application without the user reviewing it first.** Fill forms, draft, generate PDFs — always STOP before Submit/Send/Apply.
- **Discourage low-fit applications.** Score below 3.0/5 → tell the user explicitly and recommend skipping.
- **Quality over speed.** Fewer, better applications beat a mass blast.
- **Respect recruiters' time.** Only send what's worth reading.

## Offer Verification — MANDATORY

**NEVER trust WebSearch/WebFetch to verify if an offer is still active.** ALWAYS use Playwright:
1. `browser_navigate` to the URL
2. `browser_snapshot` to read content
3. Only footer/navbar without JD = closed. Title + description + Apply = active.

**Exception (batch / `claude -p`):** Use WebFetch as fallback; mark the report header `**Verification:** unconfirmed (batch mode)`.

## Skill Modes

| If the user… | Mode |
|--------------|------|
| Pastes JD or URL | auto-pipeline (evaluate + report + PDF + tracker) |
| Asks to evaluate offer | `oferta` |
| Asks to compare offers | `ofertas` |
| Wants LinkedIn outreach | `contacto` |
| Asks for company research | `deep` |
| Wants to generate CV/PDF | `pdf` |
| Evaluates a course/cert | `training` |
| Evaluates portfolio project | `project` |
| Asks about application status | `tracker` |
| Fills out application form | `apply` |
| Searches for new offers | `scan` |
| Processes pending URLs | `pipeline` |
| Batch processes offers | `batch` |

## Rules — Read Before Acting

When a task matches a row below, **read the linked file completely before taking any action.**

| Task | Read |
|------|------|
| Setup files missing (`cv.md`, `config/profile.yml`, `portals.yml`) | `.claude/rules/onboarding/setup.md` |
| Any evaluation / tracker write / batch / pipeline task | `.claude/rules/pipeline/tracker.md` |
| Looking up or assigning a status value | `.claude/rules/pipeline/states.md` |
| Working with scripts, file paths, or conventions | `.claude/rules/pipeline/conventions.md` |
| Writing to the Obsidian vault | `.claude/rules/obsidian/sync.md` |
| Customising archetypes, modes, portals, or scoring | `.claude/rules/personalization/customize.md` |

---

*Session start: silently check that `cv.md`, `config/profile.yml`, and `portals.yml` exist. If any is missing, read `.claude/rules/onboarding/setup.md` immediately before anything else.*
