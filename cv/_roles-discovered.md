# Roles discovered across dev-uk and dev-us

Generated: 2026-04-17T11:51:41.070Z

| # | Role title | Count | Geos | Sample sources |
|---|------------|-------|------|----------------|

## Next steps

1. Review the list. Group roles by discipline (design, leadership, ai, ...).
2. For each distinct role you want to target, ask Claude to scaffold:
   `cv/<discipline>/<role>/` + `cv/_shared/base-<role>.md`.
3. Fill the base file with content from your existing CVs.
4. Run `node cv/build-cv.mjs --role <role> --discipline <discipline> --all`.
