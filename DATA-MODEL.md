# Qlinqs — Data Model (business rules)

This document describes the Qlinqs data model from the **business rules**
side: which entities exist, what each one holds, what is required or
optional, what can contain what, and how style is inherited. It is the
companion to `qlinqs.md` (product intent).

It uses JSON as notation, because most of this model lives in **JSONB**
columns in Postgres (see §2). The notation is not an implementation
contract — it is the most faithful way to show the content tree that gets
persisted.

**Where the other answers live.** This document says what the model
*should* be and why. For what is actually implemented today, read
`API-MAPPING.md` (routes, payloads, validation rules as enforced) and the
`qlinqs-database` skill in `core-api/.claude/skills/` (the real schema,
models and commands). When one of those disagrees with this document, they
describe reality and this one describes intent — fix the gap deliberately,
in one direction or the other.

---

## 1. Principles that govern the model

**1.1 — The right spine from v1; cut features come later.**
The model is born in its final shape. Whatever is "for later" (animated
backgrounds, private tags, scheduling) is *not built* rather than *badly
built*. Bringing any of them back requires **no migration** — the data
already accommodates them. That is the main reason the content tree lives
in JSONB.

**1.2 — One level of depth, always.**
The page is a **flat list of blocks**. Only one kind of block (the
*container*) has children, and those children are **cards**, which are
leaves — they never contain anything. A container never contains a
container. This keeps reordering, dragging and rendering simple, and fixes
the carousel confusion in Liinks, where a carousel is a fragile group of
neighbouring loose blocks.

**1.3 — Style inheritance by absence.**
Every block style has a global value in the Theme. A block stores a value
only when it wants to **override** it. Absent field = inherit the Theme;
present field = override. At render time:
`effective = block.x ?? theme.blockDefaults.x`. This is Liinks' "chain
link" (follow the page / use your own value) implemented purely by the
absence of a field — no extra structure at all. Where the Theme holds no
global value either (`align`, `size` and `imagePosition` are block-only),
rendering falls back to a hard default.

---

## 2. Persistence: what is relational and what is JSONB

The general rule: **relational for identity, routing, files and analytics;
JSONB for the content tree and the theme.**

```
profiles       id (pk) · slug (unique, indexed) · created_at ...
               → identity and routing for qlinqs.com/slug. Auth lives outside.

pages          id (pk) · profile_id (fk) · updated_at
               content  JSONB   ← { header, socialIcons, blocks: [...] }
               theme    JSONB   ← { page, blockDefaults, fonts, palette }

templates      id (pk) · name · preview
               theme    JSONB   ← a complete Theme instance

assets         id (pk) · profile_id (fk) · storage_path · mime_type
               size_bytes · width · height           ← relational (file metadata;
               the file itself lives in the storage bucket)

page_views     page_id (fk) · timestamp                    ← relational
block_clicks   page_id (fk) · block_id · timestamp         ← relational
```

The columns, types, keys and indexes as they really exist are documented in
the `qlinqs-database` skill; this section only explains the split.

**Why JSONB for `content` and `theme`:**

- The block tree is polymorphic (its shape changes per type/layout), nested
  (a container holds a list of cards) and built to grow. In relational
  tables that would mean one table per block type and an `ALTER TABLE` for
  every new layout — exactly the rework principle 1.1 avoids.
- The page is read as a unit (render = fetch the page and draw it). One
  JSONB document = 1 row, 0 joins. Fast reads, which is what the product
  needs on mobile.
- `content` and `theme` are separate columns on purpose: the theme changes
  independently of the content (applying a template only touches `theme`).

**What the application owns (not the database):**

- **Shape validation.** Postgres guarantees "this is valid JSON", not "this
  is a valid card". A validator at the boundary is the source of truth for
  the format, versioned with the code.
- **`block_id` integrity.** The `block_id` in `block_clicks` points at an id
  that lives inside the JSONB — the database does not enforce that foreign
  key. Worst case: an orphan click from a deleted block. The application
  handles it.
- **A GIN index** only if a query ever needs to look *inside* the JSONB
  (e.g. "pages using template X"). In the MVP, lookups are by `slug` and
  the page renders whole — probably unnecessary for now.

---

## 3. The page and its fixed parts

The page has two **fixed** parts (always present, editable, outside the
block list) plus a list of blocks the user assembles freely.

```json
// pages.content (JSONB)
{
  "header": { ... },        // fixed
  "socialIcons": [ ... ],   // fixed, populated by the user
  "blocks": [ ... ]         // flat, ordered list
}
```

### 3.1 Header (fixed)

- **Always present and editable.** It is not a block; it is the chrome at
  the top of the page.
- **The profile picture is optional** — with no picture, the header adapts
  (name and bio centred).
- The header's *style* (layout, colours, picture size) comes from the Theme
  (§7.1); its *content* (name, bio) lives here.

```json
"header": {
  "name": "Clínica Aurora",
  "bio": "Atendimento humanizado • Porto Alegre"
}
```

### 3.2 Social icons (fixed, populated)

A **fixed** field of the page — a row of social icons near the top, always
available as a section. It is **not a block** the user adds or removes; it
is part of the page, which the user **fills with whichever networks they
want**.

Business rules:

- Each entry is a social network chosen by the user: **platform + value**.
- The user adds **as many networks as they like** — the list is open, not a
  fixed set.
- `value` can be a username or a full URL; the system builds the right link
  from the platform.
- The list can be **empty** (the fixed section exists but renders no icons).
- Entry order is display order.

```json
"socialIcons": [
  { "platform": "instagram", "value": "clinica.aurora" },
  { "platform": "whatsapp",  "value": "5551999999999" },
  { "platform": "tiktok",    "value": "https://tiktok.com/@aurora" }
]
```

> An important difference from the WhatsApp CTA: here WhatsApp is just one
> more **icon** in the social row (a quick link). The WhatsApp CTA **block**
> (§6) is a different thing — a prominent call to action in the body of the
> page. Both can coexist.

---

## 4. The card — the reusable piece

The **card** is the clickable unit of content and the centre of the model.
It is **identical** wherever it appears — what changes is *how much of it*
the context shows. Learning to edit a card means knowing how to edit
anything on the page, because a featured card, every carousel slide and
every grid cell are all the same card.

```json
{
  "id": "card_01",
  "link":        { "kind": "url", "href": "https://..." },
  "image":       { "source": "upload", "value": "..." },
  "title":       "Agende sua consulta",
  "description": "Segunda a sexta, 8h às 18h",
  "buttonText":  "Agendar",
  "label":       "NOVO",
  "overrides":   { }
}
```

**Card business rules:**

- **`link` is optional** — a card can be decorative (no destination).
  Destination kinds in v1: `url` and `email` (which becomes `mailto:`).
  File, image lightbox and link-to-page are post-v1.
- **`image` is conditional on the context:**
  - In an **atomic block** → optional (a plain text button is valid). The
    `thumbnail`, `background` and `featured` layouts are built around an
    image, so the editor nudges for one, but nothing requires it.
  - Inside a **container** (carousel/grid) → **required** (a card with no
    image breaks the look of the collection).
  - Same card, different validation rule depending on the parent.
- **Image source** in v1: `upload`, `icon` or `emoji`. 3D, AI and gallery
  are post-v1 (new `source` values, same format).
- **`buttonText`** always exists in the data but only renders in layouts
  that have a CTA separate from the body (featured, carousel). Always
  storing it means no text is lost when switching layout.
- **`label` is public** (a badge visible to the visitor: "NOVO", "PROMO",
  "ESGOTADO"). Not to be confused with Liinks' private organisation tag —
  that one was **cut from v1**.
- **`overrides`** is the card's own style (§5.3). Everything absent =
  inherit the Theme.

---

## 5. Blocks, containers and style

### 5.1 Atomic block (carries 1 card)

Most blocks. Carries **exactly one card**. The `layout` field drives which
card fields appear and which style controls are available.

```json
{
  "id": "blk_01",
  "kind": "atomic",
  "type": "link",
  "layout": "featured",
  "hidden": false,
  "card": { ... }
}
```

The **layout × fields** matrix for the `link` block (the editor is
contextual to the layout, as in Liinks):

| Layout | Card fields shown | Own control |
|---|---|---|
| `button`     | title, description | alignment |
| `thumbnail`  | image, title, description, label | size (large/small), alignment, image side (left/right) |
| `background` | image (fills the card), title overlaid | — |
| `featured`   | image, title, description, buttonText, label | — |

- `background` is this project's own fourth layout: the image fills the
  whole button and the title sits on top of it.
- How the editor renders those two — a scrim behind the overlaid title, a
  plain surface when `background` has no image, and `featured` revealing
  each field only once it is filled, so the card grows instead of showing
  empty slots — is presentation, not a data rule. The card carries every
  field either way.

Because the card keeps **every** field regardless of the layout, switching
layout (e.g. `button` → `featured`) **loses nothing** — the fields simply
come back into view. A concrete improvement over Liinks.

### 5.2 Container block (carries a list of cards)

The container **is** the block, and the user adds cards inside it. This
fixes Liinks' confusion: reordering, adding and removing happen **inside**
a closed box, and no card escapes the group.

```json
{
  "id": "blk_07",
  "kind": "container",
  "type": "carousel",
  "config": { "size": "large" },
  "items": [ { ...card }, { ...card }, { ...card } ]
}
```

Container business rules:

- **Two types:** `carousel` and `grid`.
- **An image is required** on every card inside a container.
- **What each one shows of the card:**
  - `carousel` → image + title + description (+ buttonText, label). Config:
    `size`, large or small.
  - `grid` → image + label only (a small cell cannot hold a legible title
    or description). Config: `columns`, 2 or 3.
- **A container never contains a container** (principle 1.2). Its `items`
  are cards, which is what makes nesting structurally impossible.
- An **empty `items` array is allowed**, so a container can be saved while
  the user is still filling it.

### 5.3 Style: inheritance and overrides

The card carries an `overrides` object mirroring the Theme's block defaults
(§7.3). **Every field is optional**: absent = inherit the Theme, present =
the block's own value.

```json
"overrides": {
  "tactile": "glass",       // the block's 3D effect
  "color": "#FFF",          // block background
  "textColor": "#111",
  "corner": 22,             // 0–100 (%)
  "border": 0,              // 0–100 (%)
  "borderColor": "#000",
  "shadow": 40,             // 0–100 (%)
  "shadowStyle": "soft",    // soft | solid
  "spacing": 60,            // gap to the next block (0–100 %)
  "align": "center",        // left | center | right — block-only
  "size": "large",          // large | small — thumbnail/carousel
  "imagePosition": "left"   // left | right — block-only, thumbnail
}
```

Style rules the application enforces:

- **Tactile and border/shadow are mutually exclusive.** With `tactile`
  other than `flat`, the relief *is* the border and the shadow — in that
  case `border`, `borderColor`, `shadow` and `shadowStyle` are ignored (the
  UI hides them). This prevents ugly combinations.
- **`tactile: "none"`** = no card: the link becomes plain text.
- v1 tactile effects: `flat`, `concave`, `convex`, `inset`, `glass`, `none`.
- **Image-dominant layouts** (featured, background, grid, carousel) hide
  `color` and `textColor` — the image is the block's background.
- **`align`, `size` and `imagePosition` are strictly per block** — they have
  no global version in the Theme and take no part in inheritance.

---

## 6. v1 blocks vs post-v1

| Category | v1 | Post-v1 |
|---|---|---|
| **Atomic** (1 card) | `link` (button / thumbnail / background / featured layouts), `whatsapp` (CTA), `maps` (location), `text`, `heading` (divider) | — |
| **Containers** (list of cards) | `carousel`, `grid` | — |

Notes:

- **`social-icons` is not a block** — it became the page's fixed
  `socialIcons` field (§3.2).
- **`whatsapp`** and **`maps`** are Qlinqs' own blocks (Liinks has no
  dedicated block for either) and serve the local-business personas
  directly.
- **`text`** — rich text (titles, bold/italic, lists, alignment, inline
  links); inherits the page's font and colour. *Open:* the rich text format
  (sanitised HTML vs structured JSON).
- **`heading`** — divider or section label; with a title it becomes a group
  header, without one it becomes a line or a space. *Open:* the styling
  fields of the line.
- **Containers shipped in v1.** They were scoped as post-v1 and brought
  forward; the format above did not change to accommodate them, which is
  principle 1.1 working as intended.

---

## 7. Theme — the personalization layer

The Theme is **one object** (the `theme` JSONB column) with four parts, in
**two scopes**: page-level (applied once, no per-block override) and
block-level (the global value every block inherits).

```json
// pages.theme (JSONB)
{
  "page":          { "header": {...}, "background": {...}, "profilePicture": {...} },
  "blockDefaults": { "tactile": "flat", "color": "...", "corner": 22, ... },
  "fonts":         { "titleFont": "...", "textFont": "..." },
  "palette":       { "background": "...", "text": "...", "surface": "...", "onSurface": "...", "accent": "...", "onAccent": "..." }
}
```

### 7.1 page (general styles) — page-level, no override

- **header:** layout (`classic` | `business` in v1; `banner`/`headshot` later
  if needed), sheet colour, fade, header text colour.
- **background:** `none` | `solid` | `gradient` (v1); `split`/`image`
  optional once uploads exist; `animated` (mesh/blobs/smoke) is **post-v1**.
  The field holding the kind is named `type` — that name is this project's
  choice, not a concept from this document.
- **profilePicture:** image (optional), size, shadow, border + colour,
  collapse a long bio.

### 7.2 fonts — page-level

`titleFont` (profile name and block titles) + `textFont` (body), with room
for ready-made font pairings.

### 7.3 blockDefaults (block styles) — block-level

The global values every block inherits. Mirrors the shared part of
`overrides` (§5.3) — it does **not** include `align`, `size` or
`imagePosition` (those are never global). The Theme sets a default
`tactile`; the user overrides it per block if they want to.

### 7.4 palette — the semantic palette (the engine of the differentiator)

Instead of loose colours scattered across panels (Liinks' mistake, where
the same colour lives in three places), Qlinqs defines **colour roles**:
`background`, `text`, `surface`, `onSurface`, `accent`, `onAccent`. Every
colour control points at a role. **Swapping the palette recolours the whole
page in one click**, with coherent contrast — this is the "change the look
without knowing design" part of the thesis.

### 7.5 Template — the saved, named Theme

A **template** (the `templates` table) is a complete `Theme` instance
(palette + fonts + block defaults + page styles), tested and good-looking,
with a name. **It is the heart of the differentiator and personalization
priority #1 in v1**: the person picks a beautiful template and ~90% never
open the style panels. Applying a template = copying its `theme` into
`pages.theme`; from then on the user adjusts freely without affecting the
original template. Tactile and background come pre-tested inside each
template.

---

## 8. What is cut from v1

Deliberate cuts; none of them needs a format change to come back.

| Cut | Already fits the model at |
|---|---|
| Private tag (organisation) | a new card field |
| Schedule (show/hide by date) | beyond `hidden` |
| Click goal, gate/paywall | — |
| 3D icons, AI, image gallery | `image.source` extends |
| Animated background (mesh/blobs/smoke) | `page.background` extends |
| Automatic preview (Open Graph) | fast follow; the card already has the fields |
| Multi-page / page block | `link.kind` extends |
| Block animation | `overrides` extends |
| Custom domain, multi-profile, payment | outside the content scope |
| Social & sharing (vCard, QR, badge, hide branding) | page settings extend |

---

## 9. Open items

1. **`text`** — the rich text format (sanitised HTML vs structured JSON).
2. **`heading`** — the styling fields of the divider line.
3. **Templates** — how many at launch, and what the switching gallery looks
   like.
4. **Header** — keep 2 layouts (classic + business) or all 4 in v1.
5. **Background** — include split/image in v1, or only solid + gradient.
6. **`Color`** — the final representation (a raw hex vs a reference to a
   palette role). Today colours are plain strings.
7. **Grid** — image + label is confirmed; check whether any case needs a
   short title.
8. **Layouts for non-link blocks** — `whatsapp`, `maps`, `text` and
   `heading` have no layout matrix of their own yet, so any layout name is
   accepted for them.
