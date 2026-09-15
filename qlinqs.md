# Qlinqs — Project Context

This document explains what the project is and why, without going into
technical detail (that lives in the `CLAUDE.md` files for each part of
the codebase). It's the reference for anyone who needs to understand
the intent behind the decisions.

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

These are people who will actually _look_ at their own page often and
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
