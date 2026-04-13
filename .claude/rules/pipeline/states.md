# Pipeline — Canonical States

**Source of truth file:** `templates/states.yml`

| State | When to use |
|-------|-------------|
| `Evaluated` | Report completed, pending decision |
| `Applied` | Application sent |
| `Responded` | Company responded |
| `Interview` | In interview process |
| `Offer` | Offer received |
| `Rejected` | Rejected by company |
| `Discarded` | Discarded by candidate or offer closed |
| `SKIP` | Doesn't fit, don't apply |

## Rules

- No markdown bold (`**`) in the status field
- No dates in the status field (use the date column)
- No extra text in the status field (use the notes column)

## Obsidian Tag Mapping

When syncing to the Obsidian vault, canonical states map to frontmatter tags:

| State | Tag |
|-------|-----|
| `Evaluated` | `evaluated` |
| `Applied` | `applied` |
| `SKIP` / `SKIPPED` | `skip` |
| `Rejected` | `rejected` |
| `Discarded` | `discarded` |
| `Interview` | `interview` |
| `Offer` | `offer` |
| `Responded` | `responded` |
