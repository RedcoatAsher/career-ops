<!-- @include: modes/_shared.md -->
<!-- @include: modes/_profile.md -->

# Mode: tracker — Applications Tracker

Read and display `data/applications.md`.

**Geo filtering:** Read `default_geo` from `config/profile.yml`. If set, only show entries matching that geo (or entries with no geo specified). If no `default_geo` is configured, show all entries. The user can override by asking for a specific geo (e.g. "show UK tracker").

**Format:**
```markdown
| # | Date | Company | Role | Location | Remote | Score | Status | PDF | Report | Notes |
```

- **Location**: city/country from JD (e.g. `San Francisco, CA`, `Remote US`, `Seattle, WA`)
- **Remote**: `remote`, `on-site`, or `unknown`

Canonical statuses: `Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` / `Rejected` / `Discarded` / `SKIP`

- `Applied` = application submitted by candidate
- `Responded` = recruiter/company reached out and candidate replied (inbound)
- `Interview` = active interview process

If the user asks to update a status, edit the row directly in `data/applications.md`.

Also show stats:
- Total evaluations
- By status
- Average score
- % with PDF generated
- % with report generated
