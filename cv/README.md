# CV system — dev-worldEdition

One source of content per role. Geo is a build flag, not a branch.

## Layout

```
cv/
  {discipline}/
    {role}/
      cv-{role}_US.md     # generated
      cv-{role}_UK.md     # generated
  _shared/
    base-{role}.md        # hand-edited source of truth (en-US baseline)
    geo-overlay.yml       # phone, citizenship order, address per geo
    spelling-rules.yml    # en-US → en-GB word swaps
  build-cv.mjs            # renderer
  README.md
```

Example disciplines: `design`, `leadership`, `ai`. Extend as needed — no code change required.

## Build

```bash
# Build one geo
node cv/build-cv.mjs --discipline leadership --role head-of-product-design --geo UK

# Build all geos for a role
node cv/build-cv.mjs --discipline leadership --role head-of-product-design --all
```

Outputs land under `cv/{discipline}/{role}/`.

## Authoring rules

- Write the base file in `en-US`. The UK build swaps spelling automatically.
- Leave `{{FULL_NAME}}`, `{{EMAIL}}`, `{{LINKEDIN}}`, `{{PORTFOLIO}}` as placeholders — filled from `config/profiles/_base.yml`.
- Leave `{{PHONE}}`, `{{ADDRESS_LINE}}`, `{{CITIZENSHIP}}` as placeholders — filled from `geo-overlay.yml`.
- To opt a specific phrase OUT of spelling swaps (e.g. a product name like "Analyzer Pro"):
  ```md
  <!-- keep-start -->Analyzer Pro<!-- keep-end -->
  ```

## Adding a new role

1. `mkdir cv/{discipline}/{role}`
2. `cp cv/_shared/base-head-of-product-design.md cv/_shared/base-{role}.md`
3. Fill the base file.
4. `node cv/build-cv.mjs --discipline {discipline} --role {role} --all`

## Migrating from dev-uk / dev-us

One-shot, run locally:

```bash
node scripts/aggregate-legacy-roles.mjs \
  --uk /Volumes/marlo/Users/asher/_github/career-ops/dev-uk \
  --us /Volumes/marlo/Users/asher/_github/career-ops/dev-us
```

Produces `cv/_roles-discovered.md` — a review list of every role title seen across your two legacy branches. Use it to decide which `base-{role}.md` files to create.
