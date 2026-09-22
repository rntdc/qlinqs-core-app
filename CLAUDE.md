@AGENTS.md

# Qlinqs — core-app

This is the frontend half of Qlinqs, a "link in bio" SaaS whose core bet is
visual personalization. The other half is `core-api` (Laravel), a sibling
directory.

## Read before you work

- **`qlinqs.md`** — what the product is and why, the shared vocabulary
  (profile, page, block, card, layout, overrides, theme, palette, template),
  the product rules that constrain every change, and the decisions this
  project made that no other document records. Read it before proposing a
  feature, scoping work, naming a concept, or writing UI copy.
- **`DATA-MODEL.md`** — the business rules behind the content and theme JSON:
  the card, the layout × fields matrix, containers, style inheritance by
  absence, what is v1 and what is post-v1.
- **`API-MAPPING.md`** — what `core-api` actually implements today: routes,
  request and response shapes, validation rules verbatim. This is the source
  of truth for field names and shapes when it disagrees with the data model.
- **`STACK.md`** — versions and commands for both halves, the semantic
  palette wired through Tailwind v4, and how to run against `core-api`.

## Working here

- The UI is written in PT-BR ("Editar página", "Adicionar bloco", "Herda do
  tema"); code, comments and docs are in English.
- The page editor at `/editor` works on an in-memory mock page. It is not
  wired to the API yet.
- Style resolution is always
  `override ?? theme.blockDefaults ?? hard default`. A style field exists on
  a block only once the user touches it.
- `npm run lint`, `npm run build`, `npm run format:check` and
  `npx tsc --noEmit` all pass before work is handed over.
- Work stays on the `staging` branch, and commits happen only when asked.
