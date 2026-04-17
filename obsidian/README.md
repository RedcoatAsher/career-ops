# Obsidian vault — in-repo

Your job-seeking vault moves here in `dev-worldEdition`.

## Structure (matches today's layout)

```
obsidian/
  UK Applications/
    001 - Company Name.md
    ...
  US Applications/
    001 - Company Name.md
    ...
```

## Migration (done in a follow-up commit)

1. `obsidian-sync.mjs` will be rewritten to write directly to `./obsidian/{geo} Applications/` instead of calling the Obsidian Local REST API on port 27124. Same frontmatter (`geo: UK`, `geo-uk` tag) as today.
2. Point Obsidian at this folder as a vault (File → Open folder as vault → `./obsidian`).
3. Decide per-file whether you want the notes themselves committed: add `obsidian/` to `.gitignore` to keep them local, or commit for full history. Not decided yet — talk to Claude when you're ready.
