# Stack

Frontend for Qlinqs (see `qlinqs.md`). Scaffolding only so far — no editor UI,
no real public-page rendering, just the base stack wired end-to-end against
`core-api`.

## Technologies (versions actually installed)

| Layer           | Technology                            | Version                |
| --------------- | ------------------------------------- | ---------------------- |
| Runtime         | Node.js                               | v25.9.0 (host)         |
| Package manager | npm                                   | 11.12.1                |
| Framework       | Next.js (App Router, Turbopack)       | 16.3.5                 |
| UI library      | React                                 | 19.2.8                 |
| Language        | TypeScript                            | 5.9.3                  |
| Styling         | Tailwind CSS (v4, CSS-first config)   | 4.3.3                  |
| Linting         | ESLint (`eslint-config-next`)         | 9.39.5 (config 16.3.5) |
| Formatting      | Prettier (+ `eslint-config-prettier`) | 3.9.6 (config 10.1.8)  |
| Data fetching   | native `fetch`                        | —                      |

Full pinned versions live in `package-lock.json`. Prettier uses its defaults
(empty `.prettierrc`); `eslint-config-prettier` is added last in
`eslint.config.mjs` to turn off any ESLint formatting rules that would
conflict with it.

## Tailwind v4 semantic palette

Tailwind v4 uses CSS-first config (no `tailwind.config.ts`). The palette
roles from `qlinqs-estrutura-de-dados.md` §7.4 (`background`, `text`,
`surface`, `onSurface`, `accent`, `onAccent`) are wired as CSS custom
properties in `src/app/globals.css`:

```css
:root {
  --palette-background: #f5f5f4;
  --palette-text: #1c1917;
  --palette-surface: #ffffff;
  --palette-on-surface: #1c1917;
  --palette-accent: #6d28d9;
  --palette-on-accent: #ffffff;
}

@theme inline {
  --color-background: var(--palette-background);
  --color-text: var(--palette-text);
  --color-surface: var(--palette-surface);
  --color-on-surface: var(--palette-on-surface);
  --color-accent: var(--palette-accent);
  --color-on-accent: var(--palette-on-accent);
}
```

This registers `bg-background`, `text-text`, `bg-surface`, `text-on-surface`,
`bg-accent`, `text-on-accent`, etc. as real Tailwind utilities. Because
`--color-*` is a live reference to `--palette-*` (not a baked-in value), any
element can override `--palette-*` inline (e.g. `style={{ "--palette-accent":
theme.palette.accent }}`) and every utility class under it recolors — a theme
swap changes CSS variable values, never classNames. `src/app/page.tsx` does
exactly this with the theme fetched from `core-api`.

## Environment

- `NEXT_PUBLIC_API_URL` — base URL for `core-api`, prefixed with `/api`
  (e.g. `http://localhost:8000/api`). Set in `.env.local` (gitignored); see
  `.env.example` for the template.

## API client

`src/lib/api.ts` has typed `fetch` wrappers for every `core-api` endpoint
that exists so far (`GET /page`, `PUT /page/content`, `PUT /page/theme`,
`GET /templates`, `GET /p/{slug}`, plus the optional
`POST /page/apply-template/{template}`). Types for `Content`/`Theme`/etc.
live in `src/lib/types.ts`, modeled loosely after
`core-api/qlinqs-estrutura-de-dados.md` §3–§7. No client-side validation —
`core-api` validates and returns Laravel's standard 422 JSON on bad input,
which `ApiError` in `api.ts` surfaces as-is.

## Commands

```sh
npm install       # install dependencies
npm run dev       # start the dev server (Turbopack) on http://localhost:3000
npm run build     # production build
npm run start     # run the production build
npm run lint      # ESLint
npm run format       # Prettier --write
npm run format:check # Prettier --check (CI-safe, no writes)
npx tsc --noEmit  # type-check only
```

## Running against core-api

`core-api` must be up via Docker Compose (see `core-api/STACK.md`):

```sh
colima start                 # if the Docker daemon is unreachable
cd ../core-api && docker compose up -d
```

It publishes on host port **8000**, with all routes under `/api` — matching
`NEXT_PUBLIC_API_URL` above.
