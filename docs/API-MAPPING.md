# Qlinqs Core API — Mapping (as implemented)

This document describes what is **actually implemented** in `core-api` right
now — the real database schema, the real validation rules, and the real API
routes — as of the container-blocks validator update on the `staging` branch
(2026-09-15), built on top of git commit `60608ef`.
Everything below was cross-checked against the live migrated Postgres
database, the source code, and the running app's Scramble output
(`http://localhost:8000/docs/api.json`). Where the running app disagrees with
`qlinqs-estrutura-de-dados.md` (the conceptual/product doc, copied unchanged
next to this file), section 4 says so explicitly.

Build the editor against **this** document, not the conceptual one, for field
names and shapes. Use the conceptual doc for the _why_.

---

## 1. Database schema (as implemented)

All tables live in the `qlinqs_core_api` Postgres database. Every UUID PK
uses Laravel's `HasUuids` (UUIDv7-shaped, generated app-side on create — no
DB-side default). `citext` and the `page_views`/`block_clicks` identity
columns require Postgres; nothing here works on SQLite (that's why the test
suite runs against a real Postgres test database, not SQLite).

### `users`

| Column              | Type                     | Nullable | Default           |
| ------------------- | ------------------------ | -------- | ----------------- |
| `id`                | uuid (PK)                | no       | — (app-generated) |
| `name`              | varchar(255)             | no       |                   |
| `email`             | varchar(255)             | no       |                   |
| `email_verified_at` | timestamp **without** tz | yes      |                   |
| `password`          | varchar(255)             | no       |                   |
| `remember_token`    | varchar(100)             | yes      |                   |
| `created_at`        | timestamp **without** tz | yes      |                   |
| `updated_at`        | timestamp **without** tz | yes      |                   |

- PK: `users_pkey (id)`. Unique: `users_email_unique (email)`.
- Referenced by: `profiles.user_id`.
- Note: `users` timestamps are plain `timestamp` (no timezone) — the
  Laravel-default `$table->timestamps()` macro — unlike every other table
  below, which explicitly uses `timestamptz`. This is a deliberate
  inconsistency inherited from the framework skeleton, not a bug, but worth
  knowing if you ever compare timestamps across tables.
- Model (`App\Models\User`): `HasUuids`; `#[Fillable(['name','email','password'])]`;
  `#[Hidden(['password','remember_token'])]`; casts `email_verified_at` →
  `datetime`, `password` → `hashed` (auto-hashes on assignment). Relationship:
  `hasOne(Profile::class)`.
- **`auth_users` from the conceptual doc is this table.** There is no
  separate external auth provider wired up — `users` is a normal local
  Sanctum-style table, currently with no login/registration flow (see §4).

### `profiles`

| Column       | Type                  | Nullable | Default             |
| ------------ | --------------------- | -------- | ------------------- |
| `id`         | uuid (PK)             | no       | — (app-generated)   |
| `user_id`    | uuid, FK → `users.id` | no       |                     |
| `created_at` | timestamptz           | no       | `CURRENT_TIMESTAMP` |
| `updated_at` | timestamptz           | yes      |                     |
| `slug`       | **citext**            | no       |                     |

- PK: `profiles_pkey (id)`. Unique: `profiles_slug_unique (slug)`,
  `profiles_user_id_unique (user_id)` — one profile per user in v1.
- FK: `profiles_user_id_foreign (user_id) → users(id)` — **no `ON DELETE`
  clause** (deleting a user with a profile is currently blocked by Postgres,
  not cascaded).
- Referenced by: `assets.profile_id` (cascade), `pages.profile_id` (cascade).
- `slug` is `citext`, so equality/uniqueness is **case-insensitive** at the
  DB level (`teste` and `TESTE` collide, and `GET /api/p/TESTE` resolves the
  `teste` row) — no app-side lowercasing exists or is needed.
- Model (`App\Models\Profile`): `HasUuids`; no `$fillable` declared (nothing
  mass-assigns a Profile via the API today). Relationships: `belongsTo(User::class)`,
  `hasOne(Page::class)`, `hasMany(Asset::class)`.

### `pages`

| Column       | Type                     | Nullable | Default             |
| ------------ | ------------------------ | -------- | ------------------- |
| `id`         | uuid (PK)                | no       | — (app-generated)   |
| `profile_id` | uuid, FK → `profiles.id` | no       |                     |
| `content`    | jsonb                    | no       | `'{}'::jsonb`       |
| `theme`      | jsonb                    | no       | — (none)            |
| `created_at` | timestamptz              | no       | `CURRENT_TIMESTAMP` |
| `updated_at` | timestamptz              | yes      |                     |

- PK: `pages_pkey (id)`. Unique: `pages_profile_id_unique (profile_id)` — one
  page per profile in v1.
- FK: `pages_profile_id_foreign (profile_id) → profiles(id) ON DELETE CASCADE`.
- Referenced by: `block_clicks.page_id` (cascade), `page_views.page_id` (cascade).
- Model (`App\Models\Page`): `HasUuids`; `#[Fillable(['content','theme'])]`;
  casts `content` → `array`, `theme` → `array`. Relationships:
  `belongsTo(Profile::class)`, `hasMany(PageView::class)`, `hasMany(BlockClick::class)`.
  `updated_at` bumps automatically on every `->update()`.
- **Note:** the DB default for `content` is a bare `{}` (no `header`,
  `socialIcons`, or `blocks` keys at all). That default alone does **not**
  satisfy `PageContentRules` (§2 below) — every page in the running system
  today was created via `PageFactory`/the seeder, which always produces a
  fully valid shape, so this is latent, not currently hit. Don't rely on the
  DB default alone if you ever create a page row outside the factory/seeder.

### `templates`

| Column       | Type        | Nullable | Default             |
| ------------ | ----------- | -------- | ------------------- |
| `id`         | uuid (PK)   | no       | — (app-generated)   |
| `name`       | text        | no       |                     |
| `preview`    | text        | no       |                     |
| `theme`      | jsonb       | no       | — (none)            |
| `created_at` | timestamptz | no       | `CURRENT_TIMESTAMP` |

- PK: `templates_pkey (id)`. Unique: `templates_name_unique (name)`.
- **No `updated_at` column at all** (not just unused — it doesn't exist).
  **No FK to/from `pages`**, and no Eloquent relationship either, on purpose:
  applying a template _copies_ its `theme` into `pages.theme`; editing or
  deleting a template afterwards must never affect pages that already
  applied it.
- Model (`App\Models\Template`): `HasUuids`; `#[Fillable(['name','preview','theme'])]`;
  `const UPDATED_AT = null`; casts `theme` → `array`.
- Populated only by `database/seeders/TemplateSeeder.php` (4 starter
  templates: Clínica Aurora, Bold Creator, Midnight, Soft Pastel — see §4,
  there is no create/update/delete endpoint).

### `assets`

| Column         | Type                     | Nullable | Default             |
| -------------- | ------------------------ | -------- | ------------------- |
| `id`           | uuid (PK)                | no       | — (app-generated)   |
| `profile_id`   | uuid, FK → `profiles.id` | no       |                     |
| `storage_path` | text                     | no       |                     |
| `mime_type`    | text                     | no       |                     |
| `size_bytes`   | bigint                   | no       |                     |
| `width`        | integer                  | no       |                     |
| `height`       | integer                  | no       |                     |
| `created_at`   | timestamptz              | no       | `CURRENT_TIMESTAMP` |

- PK: `assets_pkey (id)`. Unique: `assets_storage_path_unique (storage_path)`.
  Index: `assets_profile_id_index (profile_id)`.
- FK: `assets_profile_id_foreign (profile_id) → profiles(id) ON DELETE CASCADE`.
  Owned by the **profile**, not the page (so one upload can be reused across
  pages later).
- Model (`App\Models\Asset`): `HasUuids`; no `$fillable` declared; `const
UPDATED_AT = null`. Relationship: `belongsTo(Profile::class)`.
- **No upload endpoint exists.** This table and model are fully built but
  nothing in the API writes to them yet (see §4). `card.image.value`
  referencing an asset id is not enforced against this table today — it's an
  arbitrary string as far as the validator is concerned.

### `page_views`

| Column      | Type                      | Nullable | Default                            |
| ----------- | ------------------------- | -------- | ---------------------------------- |
| `id`        | bigint (PK, **identity**) | no       | `GENERATED BY DEFAULT AS IDENTITY` |
| `page_id`   | uuid, FK → `pages.id`     | no       |                                    |
| `viewed_at` | timestamptz               | no       | `CURRENT_TIMESTAMP`                |

- PK: `page_views_pkey (id)`. Index: `page_views_page_id_viewed_at_index (page_id, viewed_at)`.
- FK: `page_views_page_id_foreign (page_id) → pages(id) ON DELETE CASCADE`.
- Model (`App\Models\PageView`): bigint PK, **no `HasUuids`**; `public
$timestamps = false` (no `created_at`/`updated_at` at all — `viewed_at` is
  the only timestamp, set by the DB default). Relationship: `belongsTo(Page::class)`.
- **No tracking endpoint exists.** Nothing in the API writes a row here yet.

### `block_clicks`

| Column       | Type                      | Nullable | Default                            |
| ------------ | ------------------------- | -------- | ---------------------------------- |
| `id`         | bigint (PK, **identity**) | no       | `GENERATED BY DEFAULT AS IDENTITY` |
| `page_id`    | uuid, FK → `pages.id`     | no       |                                    |
| `block_id`   | text                      | no       | — (no FK)                          |
| `clicked_at` | timestamptz               | no       | `CURRENT_TIMESTAMP`                |

- PK: `block_clicks_pkey (id)`. Index: `block_clicks_page_id_block_id_clicked_at_index (page_id, block_id, clicked_at)`.
- FK: `block_clicks_page_id_foreign (page_id) → pages(id) ON DELETE CASCADE`.
  `block_id` is a **logical** reference into `pages.content`'s JSONB — no FK,
  by design (the doc's own §2: the DB can't enforce it, the app tolerates
  orphaned clicks on deleted blocks).
- Model (`App\Models\BlockClick`): bigint PK, no `HasUuids`, `public
$timestamps = false`. Relationship: `belongsTo(Page::class)`.
- **No tracking endpoint exists.** Nothing in the API writes a row here yet.

---

## 2. `pages.content` / `pages.theme` validation, as enforced

A validator **does** exist — `App\Validation\PageContentRules`,
`App\Validation\PageThemeRules`, and a shared `App\Validation\StyleOverrideRules`
— wrapped by two thin Laravel Form Requests, `ValidatePageContentRequest`
and `ValidatePageThemeRequest`, used by the `PUT` endpoints in §3.
`templates.theme` is validated by the **same** `PageThemeRules` — there is no
separate template validator.

### `PageContentRules` (verbatim field rules)

Several rules below depend on `blocks.*.kind` (`"atomic"` vs `"container"`)
and, for containers, on `blocks.*.type` (`"carousel"` vs `"grid"`) — these are
computed per block index from the actual payload, not one static rule.

| Field path                   | Rule                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `header`                     | `required\|array`                                                                                                                                                                          |
| `header.name`                | `required\|string`                                                                                                                                                                         |
| `header.bio`                 | `nullable\|string`                                                                                                                                                                         |
| `socialIcons`                | `present\|array` (key must exist, **can be empty**)                                                                                                                                        |
| `socialIcons.*.platform`     | `required\|string` (no enum)                                                                                                                                                               |
| `socialIcons.*.value`        | `required\|string`                                                                                                                                                                         |
| `blocks`                     | `present\|array` (key must exist, **can be empty**)                                                                                                                                        |
| `blocks.*.id`                | `required\|string`                                                                                                                                                                         |
| `blocks.*.kind`              | `required`, enum `["atomic","container"]` — anything else is rejected                                                                                                                      |
| `blocks.*.type`              | `required`. Enum `["link","whatsapp","maps","text","heading"]` when `kind === "atomic"`; enum `["carousel","grid"]` when `kind === "container"`.                                          |
| `blocks.*.layout`            | **Atomic only.** `required`. Enum `["button","thumbnail","background","featured"]` only when `type === "link"`; any non-empty string for every other atomic type. **Not validated for containers** — they have no `layout` concept. `"background"` is a link layout where the image fills the whole button as a background with the title overlaid — our naming, not in the conceptual doc. |
| `blocks.*.hidden`            | **Atomic:** `required\|boolean`. **Container:** `nullable\|boolean` (optional).                                                                                                            |
| `blocks.*.card`              | **Atomic only.** `present\|array` (key must exist, **can be an empty object**). Containers use `config`/`items` instead.                                                                  |
| `blocks.*.card.title`        | `nullable\|string`                                                                                                                                                                         |
| `blocks.*.card.description`  | `nullable\|string`                                                                                                                                                                         |
| `blocks.*.card.buttonText`   | `nullable\|string`                                                                                                                                                                         |
| `blocks.*.card.label`        | `nullable\|string`                                                                                                                                                                         |
| `blocks.*.card.link`         | `nullable\|array`                                                                                                                                                                          |
| `blocks.*.card.link.kind`    | required **only if `card.link` is present**, enum `["url","email"]`                                                                                                                        |
| `blocks.*.card.link.href`    | required **only if `card.link` is present**, string                                                                                                                                        |
| `blocks.*.card.image`        | `nullable\|array`                                                                                                                                                                          |
| `blocks.*.card.image.source` | required **only if `card.image` is present**, enum `["upload","icon","emoji"]`                                                                                                             |
| `blocks.*.card.image.value`  | required **only if `card.image` is present**, string                                                                                                                                       |
| `blocks.*.card.overrides`    | `nullable\|array` — shape is `StyleOverrideRules` below, `align`/`size`/`imagePosition` **allowed** here                                                                                   |
| `blocks.*.config`            | **Container only.** `required\|array`.                                                                                                                                                     |
| `blocks.*.config.size`       | **Container, `type === "carousel"` only.** `required`, enum `["large","small"]`. `prohibited` on a grid.                                                                                   |
| `blocks.*.config.columns`    | **Container, `type === "grid"` only.** `required`, enum `[2,3]`. `prohibited` on a carousel.                                                                                               |
| `blocks.*.items`             | **Container only.** `present\|array` (key must exist, **can be an empty array** — a container the editor hasn't filled in yet is still savable).                                          |
| `blocks.*.items.*.title`     | `nullable\|string` (an item is a card — same field set as `card`, minus `layout`)                                                                                                          |
| `blocks.*.items.*.description` | `nullable\|string`                                                                                                                                                                       |
| `blocks.*.items.*.buttonText`  | `nullable\|string`                                                                                                                                                                       |
| `blocks.*.items.*.label`     | `nullable\|string`                                                                                                                                                                         |
| `blocks.*.items.*.link`      | `nullable\|array`, same `link.kind`/`link.href` sub-rules as `card.link`                                                                                                                   |
| `blocks.*.items.*.image`     | **`required\|array`** — unlike an atomic card, image is mandatory on every container item (§5.2: "imagem obrigatória em todo card de container")                                          |
| `blocks.*.items.*.image.source` | **`required`** (not conditional), enum `["upload","icon","emoji"]`                                                                                                                      |
| `blocks.*.items.*.image.value`  | **`required`** (not conditional), string                                                                                                                                                |
| `blocks.*.items.*.overrides` | `nullable\|array` — same `StyleOverrideRules` shape as `card.overrides`, `align`/`size`/`imagePosition` allowed                                                                             |
| `blocks.*.items.*.kind`      | **`prohibited`** — an item is a card, not a block; sending `kind` is a 422                                                                                                                 |
| `blocks.*.items.*.type`      | **`prohibited`** — same reasoning; containers never contain containers                                                                                                                     |
| `blocks.*.items.*.items`     | **`prohibited`** — same reasoning                                                                                                                                                          |

### `PageThemeRules` (verbatim field rules)

| Field path                                                                           | Rule                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`                                                                               | `required\|array`                                                                                                                              |
| `page.header`                                                                        | `required\|array`                                                                                                                              |
| `page.header.layout`                                                                 | `required`, enum `["classic","business"]`                                                                                                      |
| `page.background`                                                                    | `required\|array`                                                                                                                              |
| `page.background.type`                                                               | `required`, enum `["none","solid","gradient"]` — **this key name (`type`) is our own choice; the conceptual doc doesn't name a discriminator** |
| `page.profilePicture`                                                                | `present\|array` (key must exist, **can be an empty object** — no sub-fields are validated at all)                                             |
| `blockDefaults`                                                                      | `present\|array` (key must exist, **can be an empty object**) — shape is `StyleOverrideRules` below, `align`/`size`/`imagePosition` **prohibited** here |
| `fonts`                                                                              | `present\|array` (key must exist, **can be an empty object**)                                                                                  |
| `fonts.titleFont`                                                                    | `nullable\|string`                                                                                                                             |
| `fonts.textFont`                                                                     | `nullable\|string`                                                                                                                             |
| `palette`                                                                            | `required\|array`                                                                                                                              |
| `palette.background` / `.text` / `.surface` / `.onSurface` / `.accent` / `.onAccent` | all **`required\|string`** — no exceptions, no hex-format check                                                                                |

### `StyleOverrideRules` (shared: `card.overrides` and `blockDefaults`)

| Field         | Rule                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `tactile`     | `nullable`, enum `["flat","concave","convex","inset","glass","none"]`                                                              |
| `color`       | `nullable\|string`                                                                                                                 |
| `textColor`   | `nullable\|string`                                                                                                                 |
| `corner`      | `nullable\|integer`, `0`–`100`                                                                                                     |
| `border`      | `nullable\|integer`, `0`–`100`                                                                                                     |
| `borderColor` | `nullable\|string`                                                                                                                 |
| `shadow`      | `nullable\|integer`, `0`–`100`                                                                                                     |
| `shadowStyle` | `nullable`, enum `["soft","solid"]`                                                                                                |
| `spacing`     | `nullable\|integer`, `0`–`100`                                                                                                     |
| `align`       | on `card.overrides`: `nullable`, enum `["left","center","right"]`. On `blockDefaults`: **`prohibited`** (a 422 if present at all). |
| `size`        | on `card.overrides`: `nullable`, enum `["large","small"]`. On `blockDefaults`: **`prohibited`**.                                   |
| `imagePosition` | on `card.overrides`: `nullable`, enum `["left","right"]` (used by the link block's `thumbnail` layout to put the image on the left — default — or right). On `blockDefaults`: **`prohibited`**. |

### Plain-language summary

- `content` is always `{ header, socialIcons, blocks }`. `header.name` is the
  only truly required leaf. `socialIcons` and `blocks` must be present but
  can be empty arrays.
- Every block needs `id` and `kind` (`"atomic"` or `"container"` — nothing
  else is accepted).
- An **atomic** block needs `type` (one of the 5 v1 types), `layout` (free
  string, except `link` blocks which must use `button`/`thumbnail`/
  `featured`), `hidden` (boolean), and `card` (an object, can be empty).
- A **container** block needs `type` (`carousel` or `grid`), `config` (an
  object — `{size}` for carousel, `{columns}` for grid; sending the other
  type's key is a 422), and `items` (an array of cards, can be empty).
  `layout` doesn't apply and `hidden` is optional. A container's items are
  **cards**, exactly like an atomic block's `card`, except `image` is always
  required on them, and none of them may themselves carry `kind`/`type`/
  `items` (a container never contains a container).
- `card.link` and `card.image` are optional wholesale objects; if you send
  either, its own sub-fields become required. (On a container **item**,
  `image` is unconditionally required, not just "if present".)
- `theme` is always `{ page, blockDefaults, fonts, palette }`.
  `page.header.layout` and `page.background.type` are the only two enum
  leaves that must be set; `page.profilePicture`, `blockDefaults`, and
  `fonts` just need to exist as objects (can be `{}`). `palette` is the one
  part of `theme` that's fully required — all 6 roles, every time.
- `align`/`size`/`imagePosition` are block-only: allowed inside a block's
  `card.overrides`, **rejected with a 422** inside `theme.blockDefaults`.
  `imagePosition` (`left`/`right`) is used by the link block's `thumbnail`
  layout — our own addition, not in the conceptual doc.
- Colors (`color`, `textColor`, `borderColor`, every `palette.*` value) are
  validated as plain strings only — no hex format enforced, matching the
  "open item" status in the conceptual doc (§9.6).
- The tactile-vs-border/shadow mutual exclusivity described in the
  conceptual doc (§5.3) is **not enforced by the validator** — it's treated
  as a render-time/UI concern (see §4).

### Minimal valid examples (validated live via `php artisan tinker` + `Validator::make()` — both `passes() === true`)

```json
// content
{
  "header": { "name": "Ana" },
  "socialIcons": [],
  "blocks": []
}
```

```json
// theme
{
  "page": {
    "header": { "layout": "classic" },
    "background": { "type": "solid" },
    "profilePicture": {}
  },
  "blockDefaults": {},
  "fonts": {},
  "palette": {
    "background": "#FFFFFF",
    "text": "#111111",
    "surface": "#F5F5F5",
    "onSurface": "#111111",
    "accent": "#6D28D9",
    "onAccent": "#FFFFFF"
  }
}
```

A valid **container** block (`carousel`), validated the same way, and confirmed
live with a `PUT /api/page/content` → `200`:

```json
{
  "id": "blk_carousel",
  "kind": "container",
  "type": "carousel",
  "config": { "size": "large" },
  "items": [
    { "title": "Slide 1", "image": { "source": "upload", "value": "asset-1" } }
  ]
}
```

A `grid` container looks the same but with `"type": "grid"`,
`"config": { "columns": 2 }` (or `3`), and each item typically carrying only
`label` + `image` (per §5.2 of the conceptual doc — grid cells are small).

### Persistence behaviour (important — this is not just "whatever validates gets saved")

`PageController::updateContent`/`updateTheme` do **not** save
`$request->validated()`. They save `Arr::only($request->all(), $topLevelKeys)`
— `['header','socialIcons','blocks']` for content, `['page','blockDefaults','fonts','palette']`
for theme. Practical effect:

- Any **nested** field under those top-level keys is saved **exactly as
  sent**, even if the validator doesn't have an explicit rule for it (e.g.
  `page.header.sheetColor`, `page.background.from`/`to` for a gradient,
  arbitrary keys inside `page.profilePicture`, `card.label` — anything).
  Only actually-invalid values (wrong type, bad enum, out-of-range) get
  rejected with a 422; unrecognized-but-harmless nested keys are **kept**,
  not silently dropped.
- Any **top-level** key that isn't in that fixed list — e.g. a stray
  `"hack": 1` at the root of the payload — **is silently dropped** and never
  reaches the database, regardless of validation.
- This was a deliberate fix after an earlier QA round caught the opposite
  bug (`$request->validated()` was silently stripping allowed-but-unruled
  nested fields). Don't "clean up" this to `$request->validated()` — that
  regresses the fix.

---

## 3. API routes (as implemented)

Base URL: `http://localhost:8000/api`. **No authentication on any of these**
— see §4 for what that means in practice. All routes below were confirmed
against `php artisan route:list --path=api` and cross-checked against
`http://localhost:8000/docs/api.json` (Scramble); discrepancies are called
out per-route and summarized at the end of this section.

| Method | Path                                  | Auth                          | Status codes  |
| ------ | ------------------------------------- | ----------------------------- | ------------- |
| GET    | `/api/page`                           | none                          | 200, 404      |
| PUT    | `/api/page/content`                   | none                          | 200, 404, 422 |
| PUT    | `/api/page/theme`                     | none                          | 200, 404, 422 |
| POST   | `/api/page/apply-template/{template}` | none                          | 200, 404      |
| GET    | `/api/templates`                      | none                          | 200           |
| GET    | `/api/p/{slug}`                       | none (public)                 | 200, 404      |
| GET    | `/api/user`                           | `auth:sanctum` (Bearer token) | 200, 401      |

Also present, not app API: `GET /docs/api` (Scramble UI), `GET /docs/api.json`
(this spec), `GET|PUT /storage/{path}` (Laravel default storage routes,
unused), `GET /up` (health check).

### `GET /api/page`

Returns the current fixed dev page (`config('qlinqs.dev_profile_slug')`,
currently `"teste"`). No request body.

Response `200`:

```json
{
  "id": "01a0a5a2-2361-7295-95c1-9865b8291cf4",
  "content": { "header": { "name": "..." }, "socialIcons": [], "blocks": [] },
  "theme": { "page": { ... }, "blockDefaults": {}, "fonts": {}, "palette": { ... } }
}
```

Response `404` (no profile with that slug, or profile has no page):

```json
{
  "message": "No page found for profile slug \"teste\". Run `php artisan db:seed` first."
}
```

### `PUT /api/page/content`

Request body: the content object — `{ header, socialIcons, blocks }` per §2.
Saves `content` **only** (`theme` untouched). Validated by `ValidatePageContentRequest`.

Response `200`: same shape as `GET /api/page`, reflecting the new `content`.
Response `422`: standard Laravel validation error —

```json
{
  "message": "The header.name field is required.",
  "errors": { "header.name": ["The header.name field is required."] }
}
```

Response `404`: same shape/condition as `GET /api/page`.

### `PUT /api/page/theme`

Request body: the theme object — `{ page, blockDefaults, fonts, palette }`
per §2. Saves `theme` **only** (`content` untouched). Validated by
`ValidatePageThemeRequest`.

Response `200`/`404`/`422`: same shapes as `PUT /api/page/content`, for `theme`.

### `POST /api/page/apply-template/{template}`

`{template}` is a template **uuid**, resolved via implicit Eloquent route
model binding. Copies `template.theme` into `pages.theme` **verbatim**
(`content` untouched). No request body.

Response `200`: same shape as `GET /api/page`, with `theme` now equal to the
applied template's `theme` exactly.

Response `404`: two distinct causes, same status code —

1. Unknown/malformed `{template}` (route-model-binding failure — Laravel's
   own `ModelNotFoundException`, generic message).
2. No dev page to apply to (this controller's own `demoPage()` check, same
   custom message as `GET /api/page`'s 404).

Editing the template's `theme` **after** applying it does **not** change the
already-saved page — verified by QA and by a Pest regression test (copy
semantics, per §7.5 of the conceptual doc).

### `GET /api/templates`

No request body. Lists all templates, `id`/`name`/`preview`/`theme` only,
ordered by `name`.

Response `200`:

```json
[
  { "id": "...", "name": "Bold Creator", "preview": "https://placehold.co/480x854?text=Bold+Creator", "theme": { ... } },
  { "id": "...", "name": "Clínica Aurora", "preview": "...", "theme": { ... } },
  { "id": "...", "name": "Midnight", "preview": "...", "theme": { ... } },
  { "id": "...", "name": "Soft Pastel", "preview": "...", "theme": { ... } }
]
```

No pagination. No `created_at` in the response (confirmed live — see the
Scramble discrepancy below).

### `GET /api/p/{slug}`

Public, unauthenticated. `{slug}` is matched **case-insensitively** (citext).
Not tied to the dev-profile config — works for any profile with a page.

Response `200`:

```json
{ "slug": "teste", "content": { ... }, "theme": { ... } }
```

Deliberately **no** `id`, `profile_id`, `user_id`, or timestamps in the
response.

Response `404` (unknown slug, or a profile with no page):

```json
{ "message": "No page found for slug \"does-not-exist\"." }
```

### `GET /api/user`

Default Laravel/Sanctum scaffolding, untouched by this project's work.
Requires a Bearer token via `auth:sanctum`. **There is currently no
login/registration/token-issuing endpoint anywhere in the app** — this route
exists but is not reachable through any flow the frontend can drive today.

### Scramble (`/docs/api.json`) discrepancies found

Scramble is auto-generated from the code and is **mostly accurate** (routes,
methods, request shapes for the two `PUT` endpoints, and most enums all
match reality), but has these real gaps/staleness as of this inspection —
none of these were changed, per the task boundary:

1. **Missing 404s.** `GET /api/page`, `PUT /api/page/content`, and `PUT
/api/page/theme` can all return 404 (`demoPage()` missing), but Scramble
   only documents `200` (and `422` for the two `PUT`s). The 404 case is
   entirely undocumented for these three routes.
2. **`GET /api/templates` response schema is wrong.** Scramble's `Template`
   component includes a required `created_at` field. The real, live response
   (confirmed via `Template::orderBy('name')->get(['id','name','preview','theme'])`
   and a live `curl`) **never includes `created_at`** — Scramble appears to
   have introspected the Eloquent model's full DB columns instead of the
   controller's restricted column selection.
3. **`blockDefaults.align`/`.size`/`.imagePosition` are documented as plain
   unconstrained strings.** Scramble doesn't understand the `prohibited` rule,
   so its spec makes it look like sending `align`/`size`/`imagePosition`
   inside `blockDefaults` is valid — in reality it's a guaranteed 422
   (confirmed live for all three). A consumer reading only the Scramble
   docs would get this wrong.
4. **`page.profilePicture` is documented as `string[]`** (`{"type":"array","items":{"type":"string"}}`).
   In reality it's `present|array` with **no** sub-field rules at all — an
   arbitrary object (e.g. `{"size":"large","shadow":20}`), not a list of
   strings. Scramble guessed this from an empty-array example.
5. **`content`/`theme` response fields are generic `{"type":"array","items":{}}`**
   everywhere they appear (`GET /page`, both `PUT` responses, apply-template
   response, `GET /p/{slug}` response). This is a known Scramble limitation
   with PHP `array`-cast Eloquent attributes — it cannot introspect the
   actual nested JSON shape, so none of §2 above is reflected in the OpenAPI
   spec for these fields. Use this document, not Scramble, for that shape.
6. **`GET /api/p/{slug}`'s 404 is labeled as a generic `ModelNotFoundException`**
   ("Not found") even though the controller never throws that exception — it
   uses `abort_unless(...)` with its own message text. The response _shape_
   (`{message: string}`) is right; the specific message text Scramble shows
   in its example is not what you'll actually see.
7. `GET /api/user` is documented as if reachable, with no indication
   anywhere in the spec that no token-issuing flow exists yet.

---

## 4. Differences vs `qlinqs-estrutura-de-dados.md`

Concrete, so the frontend builds against what's real:

- **No auth at all is implemented.** The conceptual doc explicitly puts auth
  "outside" the data model (§2: "Auth vive fora"), so this isn't a
  contradiction — but concretely, today there is no login, registration, or
  Sanctum token-issuing endpoint. Every write (`PUT`/`POST /page/*`) acts on
  one fixed dev profile via `config('qlinqs.dev_profile_slug')` (`"teste"`),
  not on a real per-user/per-session relationship. There is no ownership
  check anywhere.
- **No asset upload endpoint.** `assets` table + model are fully built
  (§1), but nothing in the API creates rows there. `card.image.value` when
  `source: "upload"` is just an arbitrary string today — not validated
  against any real asset.
- **No analytics/tracking endpoints.** `page_views` and `block_clicks`
  tables + models are fully built (§1), but nothing writes to them via the
  API. No `POST` for a page view or a block click exists yet.
- **No template CRUD.** Only `GET /api/templates` (list) and
  `POST /api/page/apply-template/{template}` (apply) exist. Templates are
  created solely by `database/seeders/TemplateSeeder.php` (4 starter
  templates, see §1) — there's no way to create/edit/delete a template
  through the API.
- **Naming choice: `page.background.type`.** The conceptual doc (§7.1)
  describes the background kind (`none`/`solid`/`gradient`) but doesn't name
  a JSON key for it. The implementation chose `type` as that discriminator
  key. Build against `type`.
- **Naming choice: `link` block layout `"background"`, and the
  `imagePosition` override field.** Neither exists in the conceptual doc.
  Renato reorganized the `link` block from 3 layouts to 4
  (`button`/`thumbnail`/`background`/`featured` — §5.1 of the conceptual doc
  only documents the first 3); `"background"` means the image fills the
  whole button as a background with the title overlaid on top. Separately,
  a new block-only style field `imagePosition` (`"left"`/`"right"`, default
  `"left"`) was added to `overrides`/`blockDefaults` — same conditionality as
  `align`/`size` (§5.3: allowed on a card's `overrides`, `prohibited` on
  `theme.blockDefaults`) — used by the `thumbnail` layout to pick which side
  the image sits on. The API does **not** require `image` on `background` or
  `thumbnail` layouts — that's editor UX, not an API-level rule.
- **Container blocks are now accepted — no longer post-v1.** Renato approved
  containers, so `blocks.*.kind` accepts `"atomic"` and `"container"`, and
  `type` accepts `carousel`/`grid` for containers, exactly per §5.2 of the
  conceptual doc: `items` are cards (not nested blocks), `image` is
  unconditionally required on every container item, `config` is validated
  per type (`carousel` → `size: large|small`, `grid` → `columns: 2|3`,
  cross-sending the other type's key is a 422), and an item carrying
  `kind`/`type`/`items` is rejected (containers never contain containers,
  principle 1.2). Anything still not in `["atomic","container"]` for `kind`,
  or not in the two type enums for its kind, is rejected — confirmed live.
- **`card.image` is only unconditionally required inside a container item.**
  On an atomic block's `card`, `image` stays optional (a text-only button is
  still valid). This matches §4 of the conceptual doc's "container image
  mandatory, atomic image optional" distinction exactly, now that both code
  paths exist.
- **`layout` is a required string on every atomic block, but its enum is
  link-only; containers have no `layout` at all.** The conceptual doc's
  layout×field matrix (§5.1) only defines layouts for `type: "link"`. The
  implementation requires _some_ non-empty `layout` string on every atomic
  block regardless of type (matching the example JSON shape in §5.1, which
  shows `layout` on every atomic block), but doesn't define or enforce what
  layout values make sense for `whatsapp`/`maps`/`text`/`heading`. The
  frontend will need its own convention for those (e.g. reuse `"button"` as
  a sentinel, or something type-specific) — this is a real open point, not
  resolved anywhere in code. Container blocks (§5.2) never have `layout` —
  don't send it, and don't expect the validator to require it.
- **Tactile-vs-border/shadow mutual exclusivity (§5.3) is not enforced by
  the API.** You can send `tactile: "glass"` together with `border`/`shadow`/
  `shadowStyle` values and it will save successfully — confirmed live. This
  was a deliberate choice: it's treated purely as a render/UI concern (the
  editor should hide those controls when `tactile !== "flat"`), not a
  validation rule.
- **Color format is unconstrained.** Every color field (`color`, `textColor`,
  `borderColor`, all 6 `palette.*` values) is validated as a plain string —
  no hex regex, no enum of palette-role references. Matches the conceptual
  doc's own open item (§9.6).
- **No platform enum for `socialIcons.*.platform`.** Confirmed nothing in
  the codebase defines one — matches the conceptual doc's explicit "free
  list, not a fixed set" (§3.2).
- **`text`/`heading` blocks have no type-specific fields.** The conceptual
  doc marks their rich-text format and divider styling as open items (§6,
  §9.1–2). The validator treats them exactly like every other atomic block
  — generic `card` fields only (`title`/`description`/`buttonText`/`label`/
  `link`/`image`/`overrides`), no dedicated `body`/`richText` key exists
  anywhere. If the editor needs a rich-text field for these two types today,
  that's a decision Renato needs to make — there's no backend field for it
  yet, and adding one is outside this task's scope.
- **Multi-profile / multi-page restrictions match the doc exactly.**
  `profiles.user_id` and `pages.profile_id` are both `UNIQUE`, exactly as
  §4/§7 of the conceptual doc describe for v1 (removable later without a
  data migration, per that doc).
- **Asset ownership matches the doc exactly.** `assets.profile_id` (not
  `page_id`) — explicitly for future multi-page reuse, as the conceptual doc
  says, even though no upload endpoint exists yet to exercise it.

---

## 5. For the frontend editor

Mock the `page` object using this shape. It's what the real API sends and
accepts today — build the editor's in-memory model to match it directly so
wiring up the real endpoints later is a drop-in, not a rework.

```ts
type SocialIcon = { platform: string; value: string };

type CardLink = { kind: "url" | "email"; href: string };
type CardImage = { source: "upload" | "icon" | "emoji"; value: string };

// Shared by card.overrides and theme.blockDefaults — align/size/
// imagePosition are allowed in the former, REJECTED (422) in the latter.
type StyleOverrides = {
  tactile?: "flat" | "concave" | "convex" | "inset" | "glass" | "none";
  color?: string;
  textColor?: string;
  corner?: number; // 0-100
  border?: number; // 0-100
  borderColor?: string;
  shadow?: number; // 0-100
  shadowStyle?: "soft" | "solid";
  spacing?: number; // 0-100
};

type CardOverrides = StyleOverrides & {
  align?: "left" | "center" | "right"; // block-only; allowed here
  size?: "large" | "small"; // block-only; allowed here
  imagePosition?: "left" | "right"; // block-only; allowed here — used by the link block's "thumbnail" layout; our own addition, not in the conceptual doc
};

// Only "button" | "thumbnail" | "background" | "featured" are enum-enforced,
// and only when a block's type === "link". Every other atomic type just
// needs a non-empty string (see the frontend note below). "background" is
// our own layout (image fills the button as a background, title overlaid).
type LinkLayout = "button" | "thumbnail" | "background" | "featured";

type Card = {
  title?: string;
  description?: string;
  buttonText?: string;
  label?: string;
  link?: CardLink;
  image?: CardImage; // optional on an atomic card
  overrides?: CardOverrides;
  // any other key you add here is saved as sent (not validated, not stripped)
};

// A container item is a card, not a nested block — same fields as Card,
// except image is mandatory (§5.2). It may NOT carry kind/type/items
// (containers never contain containers — sending any of those is a 422).
type ContainerItem = Omit<Card, "image"> & { image: CardImage };

type AtomicBlock = {
  id: string;
  kind: "atomic";
  type: "link" | "whatsapp" | "maps" | "text" | "heading";
  // LinkLayout is enum-enforced ONLY when type === "link"; any non-empty
  // string otherwise.
  layout: LinkLayout | (string & {});
  hidden: boolean;
  card: Card; // may be {}
};

type ContainerBlock = {
  id: string;
  kind: "container";
  type: "carousel" | "grid";
  // No `layout` — containers don't have one.
  hidden?: boolean; // optional for containers (required for atomic blocks)
  config: { size: "large" | "small" } | { columns: 2 | 3 }; // carousel → size; grid → columns. Sending the other type's key is a 422.
  items: ContainerItem[]; // may be empty — a container the editor hasn't filled in yet is still savable
};

type Block = AtomicBlock | ContainerBlock;

type PageContent = {
  header: { name: string; bio?: string };
  socialIcons: SocialIcon[]; // key required, array may be empty
  blocks: Block[]; // key required, array may be empty
};

type PageTheme = {
  page: {
    header: { layout: "classic" | "business" } & Record<string, unknown>; // extra keys kept as sent
    background: { type: "none" | "solid" | "gradient" } & Record<
      string,
      unknown
    >; // e.g. {type:"gradient", from, to} — "from"/"to" are our own convention, not enforced
    profilePicture: Record<string, unknown>; // arbitrary object, may be {}
  };
  blockDefaults: StyleOverrides; // may be {}; never put align/size here
  fonts: { titleFont?: string; textFont?: string }; // may be {}
  palette: {
    background: string;
    text: string;
    surface: string;
    onSurface: string;
    accent: string;
    onAccent: string;
  }; // all 6 always required
};
```

**Which fields are optional, at a glance:**

- `PageContent`: only `header.bio` is a truly optional leaf. `socialIcons`
  and `blocks` are required _keys_ but may be empty arrays. Every `Card`
  field is optional; `card` itself may be `{}`. For a container block,
  `hidden` is optional and `layout` doesn't exist at all; `items` is a
  required key but may be `[]`. `ContainerItem` mirrors `Card` except
  `image` is **not** optional there.
- `PageTheme`: `page.header.layout` and `page.background.type` are the only
  required leaves inside `page`. `page.profilePicture`, `blockDefaults`, and
  `fonts` are required _keys_ but may be `{}`. `palette`'s 6 fields are the
  only part of `theme` that's unconditionally required.

**Two behaviors worth building around explicitly:**

1. Any field you add **under** one of the documented top-level keys (extra
   stuff in `header`, inside a card, inside `page.background`, etc.) is
   preserved by the API as long as it doesn't fail an explicit rule (§2's
   "Persistence behaviour"). You don't need to strip unknown nested fields
   before sending.
2. Don't invent new **top-level** keys on `content` or `theme` — anything
   outside `header`/`socialIcons`/`blocks` (content) or
   `page`/`blockDefaults`/`fonts`/`palette` (theme) is silently dropped on
   save, even if your local mock state has it.
