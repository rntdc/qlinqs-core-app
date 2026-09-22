# Qlinqs — Project Context

This document explains what the project is and why. Read it before
proposing a feature, scoping work, naming a concept, or writing UI copy —
it's what keeps a change inside the product's intent instead of merely
plausible. The last three sections carry what an agent can't infer from
the code: the shared vocabulary, the decisions we made that no other
document records, and where every technical answer lives.

## What it is

**Qlinqs** is a "link in bio" SaaS — a single public page
(`qlinqs.com/your-name`)
that brings together links, social media, contact channels, and content
in one place, meant to be placed in social media bios (Instagram,
TikTok, etc.), which only allow one clickable link.

## The problem that exists today

The market already has established players — **Linktree** is the best
known, **Liinks** is a newer, feature-richer competitor. Looking closely
at both, two patterns of weakness showed up:

- **Linktree** is easy to use but visually rigid: single-column layout,
  little real design control, always stuck with their domain
  (`linktr.ee/...`) even on paid plans.
- **Liinks** has far more features (varied blocks, content gates, a
  background generator with effects), but that comes with more
  complexity, and users report missing fine-grained design controls
  (e.g. numeric corner-rounding adjustment) despite the block variety.

In other words: there's a gap between "simple but plain" and "rich but
complicated" that neither one fully fills.

## The product's bet

**Visual personalization is the core thesis**, not a nice-to-have
feature. The page can't feel like a generic template — the user needs
to be able to make it look like their own brand/identity without
knowing design or code. Every MVP scoping decision revolves around
protecting that bet: advanced infrastructure and monetization features
get cut first, the personalization layer never does.

A close second is that the page has to actually **work as a presentation
tool**, not just a stack of links — it needs to hold the specific blocks
a person or business relies on to look credible and be reachable (a
contact CTA, a location, a redirect to the right channel), styled to
match their identity.

## Who it's for

People and small businesses building their presence around Instagram
who need a single, presentable entry point that also acts as a
lightweight professional front door — content creators, influencers,
local businesses (clinics, studios, shops), freelancers, and artists.
The first MVP is scoped and positioned for the Brazilian market
(PT-BR), where Instagram is a primary channel for exactly this kind of
audience.

These are people who will actually *look* at their own page often and
care about how it looks and how well it represents them — not just
about "having the links in one place."

Two illustrative profiles the product needs to serve well from day one:

- **A local business (e.g. a clinic):** wants a WhatsApp CTA as the main
  action, its location via a maps link, and a redirect to its Instagram
  or other social profile — a professional, trustworthy front page more
  than a link list.
- **A creator/influencer:** wants a Spotify link, affiliate links, and a
  block redirecting to their YouTube channel — a personal hub that still
  looks like their own brand.

Both cases are covered by the same building blocks (links, redirects,
CTAs), styled differently — this is exactly what "personalizable
biosite" means in practice.

## How the MVP was scoped

The overall philosophy: **ship something small, but with the right
"spine"** — cut features are left out entirely rather than
half-implemented, and the data structure is already designed to grow
without needing to be redone later.

**What's in v1:**
- Create an account and claim a link (`qlinqs.com/slug`)
- Build the page with a set of practical block types covering both
  creator and local-business use cases: links, redirects (social
  profiles, YouTube, etc.), a WhatsApp/contact CTA, a location/maps
  block, dividers, text, and social icons
- Deep customization of the look: colors, typography, element shape,
  background (solid or simple gradient) — styling is the area the MVP
  invests in most, since it's the core differentiator
- Basic analytics: page views and click counts per block, enough to
  show the user their page is working, without a full analytics suite
- See the public page rendered, fast and responsive on mobile

**What's left out for now — and why:**
- **Payment/subscription**: doesn't make sense to charge before there's
  something worth paying for.
- **Multi-profile**: an advanced-user/agency feature — most early users
  only need one profile.
- **Custom domain**: a refinement that only matters once someone is
  already actively using the product.
- **Content gates/paywall**: a creator-monetization feature, a more
  advanced stage than the MVP.
- **Advanced analytics** (referrers, audience breakdowns, time-based
  trends): the MVP proves the page gets used at all; deeper analytics
  come once that's validated.

None of these are oversights — they're deliberate cuts to stay focused
on the core thesis (personalization, plus just enough functional
breadth and feedback to be genuinely useful) and ship faster.

## How this connects to the development phases

The technical roadmap (documented separately) follows this priority
order: foundation first (account, profile, basic blocks), then
personalization in depth, then a well-working public page with basic
analytics — always in that order, because cutting the personalization
phase to "save time" would mean cutting the reason the product exists.

## Feature inspiration (used as reference, not to be copied outright)

The detailed mapping of Liinks' blocks and design options (done as
market research) serves as a **catalog of possibilities** for future
phases — not as an MVP task list. Things like the shader-based
background generator, 3D icons, AI image generation, and the
reveal-a-hidden-block countdown are examples of "what can be built
later," once the foundation (simple, well-structured personalization,
plus the essential blocks and basic analytics) is solid.

## Vocabulary

These words mean one specific thing here. Use them as written, in code,
in conversation, and in UI copy.

- **Profile** — the public identity: the owner plus the `slug` that routes
  `qlinqs.com/slug`. One per user in v1.
- **Page** — the profile's page. Its whole editable state is two
  documents: **content** (header, social icons, blocks) and **theme**
  (page styles, block defaults, fonts, palette). One page per profile in
  v1.
- **Block** — one entry in the page's flat, ordered list. Either
  **atomic** (carries exactly one card) or a **container** (carries a
  list of cards).
- **Card** — the clickable unit of content: image, title, description,
  button text, label, link, plus its own style overrides. The same card
  appears in an atomic block, a carousel and a grid — only how much of
  it shows changes.
- **Layout** — for `link` blocks, which face the card wears: `button`,
  `thumbnail`, `background` or `featured`. The layout decides which card
  fields render, never which fields the card keeps.
- **Overrides** — a block's own style values. A missing key means "inherit
  the theme"; a present key means "this block decides". Rendering is
  `override ?? theme.blockDefaults ?? hard default`.
- **Theme** — the page's whole look in one object, including the semantic
  **palette** (`background`, `text`, `surface`, `onSurface`, `accent`,
  `onAccent`). Swapping the palette recolors the entire page.
- **Template** — a curated theme with a name and a preview. Applying one
  **copies** its theme onto the page.
- **Label** — the public badge on a card ("NOVO", "PROMO"), visible to
  visitors. Not a private organization tag; that was cut from v1.

The product is PT-BR. UI copy is written in Portuguese ("Editar página",
"Adicionar bloco", "Herda do tema", "Falta imagem"), while code, comments
and docs are in English.

## Rules that constrain every change

These are product rules first. Breaking one is a product bug even when
the code is correct.

- **Inheritance by absence.** A style field only exists on a block once
  the user touches it, and resetting it removes the key. This is what
  makes a theme or template swap recolor everything at once — the
  product's whole differentiator.
- **Applying a template copies, never links.** Editing a template later
  must never change a page that already applied it.
- **One level of depth.** Containers hold cards. A container never holds
  another container, and a card never holds children.
- **A card keeps every field.** Switching layout hides fields, it never
  discards what the user typed. Switching back brings the text back.
- **Cut features stay cut, not half-built.** The data already has room
  for them (see "How the MVP was scoped"), so adding one later is a
  feature, not a migration.

## Decisions this project made on its own

These started as implementation calls rather than product design, and
they're what a fresh agent would otherwise re-invent under a different
name. `DATA-MODEL.md` now records them all; this is the short version.

- **`background` link layout** — the image fills the whole button with
  the title overlaid. Our fourth layout (DATA-MODEL §5.1).
- **`imagePosition`** (`left` | `right`) — which side the thumbnail image
  sits on. Block-only, like `align` and `size`: never a theme default.
- **A container's items are cards, not blocks.** This is how "containers
  hold blocks" is implemented, and it's what keeps nesting impossible.
- **`page.background.type`** — we named the field that holds the
  background's kind; the product design describes the setting without
  naming a key for it.
- **Colors are plain strings** for now; whether they become references to
  palette roles is still open (DATA-MODEL §9.6).
- **Layouts are only enumerated for `link` blocks.** The other block
  types accept any layout name until their own matrix exists
  (DATA-MODEL §9.8).
- **No auth yet.** The editing endpoints act on one fixed profile
  (slug `teste`) until accounts exist. Ownership checks arrive with auth.

## Where the technical answers live

Product intent is here. Everything else has one home — read it there
rather than restating it:

The first three live at the project root, next to this file; the fourth
is a skill inside `core-api`:

- **Business rules and the JSON model** (blocks, cards, layouts, theme,
  what's v1 vs post-v1, what's still open): `DATA-MODEL.md`.
- **What the API actually implements today** (routes, request and
  response shapes, validation rules verbatim, and where the
  implementation departs from the data model): `API-MAPPING.md`. This is
  the source of truth when the data model disagrees with reality.
- **Stacks, versions and commands for both halves**: `STACK.md`.
- **The database as it really is** (columns, types, keys, models,
  commands): the `qlinqs-database` skill in `core-api/.claude/skills/`.
