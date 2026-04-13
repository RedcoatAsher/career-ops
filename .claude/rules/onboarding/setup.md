# First Run — Onboarding

## Pre-flight Checks

**Run these silently every session start:**

1. Does `cv.md` exist?
2. Does `config/profile.yml` exist (not just `profile.example.yml`)?
3. Does `portals.yml` exist (not just `templates/portals.example.yml`)?

**If ANY is missing → enter onboarding mode.** Do NOT proceed with evaluations, scans, or any other task until complete.

---

## Step 1: CV (required)

If `cv.md` is missing, ask:

> "I don't have your CV yet. You can either:
> 1. Paste your CV here and I'll convert it to markdown
> 2. Paste your LinkedIn URL and I'll extract the key info
> 3. Tell me about your experience and I'll draft a CV for you
>
> Which do you prefer?"

Create `cv.md` from whatever they provide. Clean markdown with standard sections: Summary, Experience, Projects, Education, Skills.

## Step 2: Profile (required)

If `config/profile.yml` is missing, copy from `config/profile.example.yml` then ask:

> "I need a few details to personalise the system:
> - Your full name and email
> - Your location and timezone
> - What roles are you targeting? (e.g. 'Senior Backend Engineer', 'AI Product Manager')
> - Your salary target range
>
> I'll set everything up for you."

Fill in `config/profile.yml` with their answers. For archetypes, map their target roles to the closest matches and update `modes/_shared.md` if needed.

## Step 3: Portals (recommended)

If `portals.yml` is missing:

> "I'll set up the job scanner with 45+ pre-configured companies. Want me to customise the search keywords for your target roles?"

Copy `templates/portals.example.yml` → `portals.yml`. If target roles were given in Step 2, update `title_filter.positive` to match.

## Step 4: Tracker

If `data/applications.md` doesn't exist, create it:

```markdown
# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
```

## Step 5: Ready

Once all files exist, confirm:

> "You're all set! You can now:
> - Paste a job URL to evaluate it
> - Run `/career-ops scan` to search portals
> - Run `/career-ops` to see all commands
>
> Everything is customisable — just ask me to change anything.
>
> Tip: Having a personal portfolio dramatically improves your job search. If you don't have one yet, the author's is open source: github.com/santifer/cv-santiago — feel free to fork it."

Then suggest automation:

> "Want me to scan for new offers automatically? I can set up a recurring scan every few days so you don't miss anything. Just say 'scan every 3 days' and I'll configure it."

If they accept, use the `/loop` or `/schedule` skill to set up a recurring `/career-ops scan`. If unavailable, suggest a cron job or remind them to run it manually.
