# Qlinqs — Stack

The technologies and commands for both halves of the project: `core-api`
(the Laravel API) and `core-app` (the Next.js frontend). Product intent is
in `qlinqs.md`, the data model in `DATA-MODEL.md`, and the implemented API
in `API-MAPPING.md`. For the database itself, read the `qlinqs-database`
skill in `core-api/.claude/skills/`.

Versions below are what is actually installed; the lock files
(`core-api/composer.lock`, `core-app/package-lock.json`) are authoritative.

---

## core-api — the API

API-only Laravel: no Blade views, no web routes, no frontend build tooling.

| Layer | Technology | Version |
|---|---|---|
| Language | PHP | 8.5.10 (in Docker) / 8.5.5 (host) |
| Framework | Laravel | 13.31.0 |
| Auth scaffolding | Laravel Sanctum | 4.3.3 (no login flow wired yet) |
| Database | PostgreSQL | 17.11 (`postgres:17-alpine`) |
| Tests | PestPHP (+ pest-plugin-laravel) | 5.2.0 |
| API docs | Scramble (dedoc/scramble) | 0.13.43 |
| Agent tooling | Laravel Boost | 2.9.0 |
| Containers | Docker Compose via Colima | — |
| Package manager | Composer | 2.9.7 (host) |

### Containers

Compose project `qlinqs-core-api`, defined in `core-api/docker-compose.yml`:

- **`qlinqs-core-api-app`** — PHP 8.5 CLI (Alpine), runs
  `php artisan serve --host=0.0.0.0 --port=8000 --no-reload`, project mounted
  at `/var/www/html`, published on host port **8000**.
  `--no-reload` is required: without it Laravel's dev server strips
  non-whitelisted env vars on every request, which breaks the `DB_HOST=db`
  override below.
- **`qlinqs-core-api-db`** — `postgres:17-alpine`, database
  `qlinqs_core_api`, user/password `qlinqs`/`qlinqs`, published on host port
  **5433**.

Inside the network the app reaches Postgres at `db:5432`, injected by the
compose `environment:` block. The host's own Homebrew Postgres owns 5432, so
the container is deliberately offset to 5433 — never point this project at
5432.

### Commands

```sh
colima start                 # if the Docker daemon is unreachable
docker compose build         # rebuild the app image after Dockerfile changes
docker compose up -d         # start app + db
docker compose ps            # status and ports
docker compose logs -f app   # tail app logs
docker compose down          # stop (keeps the db volume)

# Artisan — run inside the container so it uses the containerized Postgres
docker compose exec app php artisan migrate
docker compose exec app php artisan migrate:status
docker compose exec app php artisan route:list
docker compose exec app php artisan tinker

# psql
docker compose exec db psql -U qlinqs -d qlinqs_core_api

# Host-side `php artisan ...` also works for anything that doesn't need the
# containerized Postgres; the host .env points at 127.0.0.1:5433.

# Tests — run on the HOST against the qlinqs_core_api_test database in the
# same container (phpunit.xml). SQLite is not usable: the schema needs
# citext and jsonb. The db container must be running.
./vendor/bin/pest
# php artisan test --compact  # same suite through artisan

# API docs (Scramble), with the app container up
#   UI:   http://localhost:8000/docs/api
#   JSON: http://localhost:8000/docs/api.json

# Laravel Boost MCP server (Claude Code launches it via .mcp.json)
php artisan boost:mcp
```

---

## core-app — the frontend

Next.js App Router. Today it serves the API test page at `/` and the page
editor at `/editor`; the editor works on an in-memory mock page and is not
wired to the API yet.

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | v25.9.0 (host) |
| Package manager | npm | 11.12.1 |
| Framework | Next.js (App Router, Turbopack) | 16.3.5 |
| UI library | React | 19.2.8 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS (v4, CSS-first config) | 4.3.3 |
| Drag and drop | @dnd-kit core / sortable / utilities | 6.3.1 / 10.0.0 / 3.2.2 |
| Linting | ESLint (`eslint-config-next`) | 9.39.5 |
| Formatting | Prettier (+ `eslint-config-prettier`) | 3.9.6 |
| Data fetching | native `fetch` | — |

Prettier runs on its defaults (empty `.prettierrc`), and
`eslint-config-prettier` comes last in `eslint.config.mjs` so ESLint never
fights it. `.prettierignore` excludes the project docs copied into the repo
(`qlinqs.md`, `DATA-MODEL.md`, `API-MAPPING.md`, `STACK.md`), which are
prose, not app code.

### The semantic palette in Tailwind v4

Tailwind v4 has no `tailwind.config.ts`. The palette roles from
`DATA-MODEL.md` §7.4 are wired as CSS custom properties in
`src/app/globals.css`:

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

That registers `bg-background`, `text-on-surface`, `bg-accent` and friends as
real utilities. Because `--color-*` points at `--palette-*` instead of a
baked-in value, any element can set `--palette-*` inline (e.g.
`style={{ "--palette-accent": theme.palette.accent }}`) and everything under
it recolors. A theme swap changes variable values, never classNames — the
product's differentiator expressed in CSS.

### Environment and API client

- `NEXT_PUBLIC_API_URL` — the `core-api` base URL including `/api`
  (e.g. `http://localhost:8000/api`). It lives in `.env.local` (gitignored);
  `.env.example` is the template.
- `src/lib/api.ts` — typed `fetch` wrappers for every implemented endpoint
  (`GET /page`, `PUT /page/content`, `PUT /page/theme`, `GET /templates`,
  `GET /p/{slug}`, `POST /page/apply-template/{template}`). Types live in
  `src/lib/types.ts`, following `API-MAPPING.md` §5.
- No client-side validation: `core-api` validates and returns Laravel's 422
  JSON, which `ApiError` surfaces as-is.

### Commands

```sh
npm install          # install dependencies
npm run dev          # dev server (Turbopack) on http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
npm run format       # Prettier --write
npm run format:check # Prettier --check
npx tsc --noEmit     # type-check only
```

Run `lint`, `build`, `format:check` and `tsc --noEmit` before handing work
over; they are the frontend's definition of "green".

### Running against core-api

```sh
colima start
cd core-api && docker compose up -d
```

The API publishes on host port **8000** with every route under `/api`, which
is what `NEXT_PUBLIC_API_URL` points at. CORS already allows the dev server's
origin.
