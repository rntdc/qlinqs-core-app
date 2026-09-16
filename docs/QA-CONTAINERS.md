# QA-REPORT — Container Blocks Validation (carousel/grid)

**Covers:** `core-api` staging @ HEAD `60608ef`, working-tree change in
`app/Validation/PageContentRules.php` + `tests/Feature/PageContentValidationTest.php`.
**Verdict: PASS** (all 7 checks green; no code/doc changes made by QA; nothing
staged/committed/pushed).

---

## Section 1 — Exactly the feature suite for container blocks, live-verified

Feature file: `tests/Feature/PageContentValidationTest.php`
Pest result: `{"tests":79,"passed":79,"assertions":175}` — **all 79 pass**.

Container-feature `it()` names (in order; each of these bodies was entered
line-by-line and confirmed to assert assignments 1a–6, not just names):

1. `rejects a kind that is neither atomic nor container`
2. `rejects carousel/grid as an atomic block's type`
3. `rejects an unknown block type rather than accepting it silently`
4. `enforces the layout enum only for link blocks`
5. `accepts any non-empty layout string for non-link types`
6. `rejects hidden when it is not a boolean`
7. `requires link.href and link.kind when card.link is present`
8. `requires image.source and image.value when card.image is present`
9. `rejects an out-of-range corner override`
10. `rejects an invalid tactile override value`
11. `accepts align and size overrides on a card (block-only fields)`
12. `validates the Page factory content output`
13. `the ValidatePageContentRequest wrapper exposes equivalent rules to PageContentRules`
14. `passes a valid carousel container block` — asserts `kind:"container"`, `type:"carousel"`, `config:{size:"large"}`, 2 items each with image
15. `passes a valid grid container block` — asserts `config:{columns:2}`, item with image
16. `passes a container with an empty items array`
17. `rejects a container item missing image`
18. `rejects a carousel that sends grid-only config`
19. `rejects a grid that sends carousel-only config`
20. `rejects a container missing config`
21. `rejects a container item that is itself a nested container`
22. `rejects an unknown container type`
23. `does not require layout on a container block`
24. `does not require hidden on a container block`

Each body uses `Validator::make($data, PageContentRules::rules($data))` against
real Laravel rules and asserts both `passes()`/`fails()` *and* the specific
error key — confirming the body really asserts the behavior, not just the name.

---

## Section 2 — Rules review (PageContentRules.php) — PASS

Conditionals re-read in full against the live source:

- **`kind`**: `['required', Rule::in(['atomic','container'])]` — anything else (e.g. `"group"`) → 422. ✓
- **Atomic blocks** (`kind:"atomic"`): `type` enum `["link","whatsapp","maps","text","heading"]`; `layout` `required` (enum link-layouts `["button","thumbnail","featured"]` when `type==="link"`, otherwise `required|string`); `card` present|array; `hidden` required|boolean. ✓
- **Container blocks** (`kind:"container"`): `type` `required` enum `["carousel","grid"]`; **no `layout` rule** (containers have no layout concept); `hidden` nullable|boolean (no longer required); `config` `required|array`; `items` `present|array`; item keys validated as cards with **`image` required** and `image.source` enum `["upload","icon","emoji"]`, `image.value` required. ✓
- **Per-type config**:
  - `carousel`: `config.size` `required`, enum `["large","small"]`; `config.columns` **prohibited**.
  - `grid`: `config.columns` `required`, enum `[2,3]` (in `GRID_COLUMNS`); `config.size` **prohibited**.
- **No nested containers**: on every container item, `kind`/`type`/`items` are **prohibited** (rejected, not silently accepted). ✓

Confirmed live with real validator + pest: carousel item missing image → 422 on
`blocks.0.items.0.image`; carousel sending `columns` → 422 on `blocks.*.config.columns`; grid sending `size` → 422 on `blocks.*.config.size`; container missing `config` → 422 on `blocks.*.config`.

**Live probes (local:8000, `PUT /api/page/content`):**

| Probe | Code | Expected | Pass? |
|---|---|---|---|
| valid atomic (control) | 200 | 200 | ✓ |
| valid trio: atomic + carousel(2 items, images) + grid(1 item) | 200 | 200 | ✓ |
| trio readback (GET `/api/page`) — config + items preserved | 200 | 200 | ✓ |
| empty `items` array on carousel | 200 | 200 | ✓ |
| container item missing `image` | 422 | 422 | ✓ |
| carousel sends `columns` (prohibited) | 422 | 422 | ✓ |
| grid sends `size` (prohibited) | 422 | 422 | ✓ |
| container missing `config` | 422 | 422 | ✓ |
| container `type: "gallery"` (unknown) | 422 | 422 | ✓ |
| container `kind: "group"` (unknown) | 422 | 422 | ✓ |
| item = nested container (kind/type/items) | 422 | 422 | ✓ |
| atomic type `"carousel"` | 422 | 422 | ✓ |
| atomic missing `layout` | 422 | 422 | ✓ |
| atomic link `layout:"banana"` | 422 | 422 | ✓ |
| theme `blockDefaults.align` (prohibited on theme) | 422 | 422 | ✓ |
| item `overrides.corner:150` (out of range) | 422 | 422 | ✓ |
| item `overrides.tactile:"chrome"` (invalid enum) | 422 | 422 | ✓ |

All PASS.

---

## Section 3 — Pest cleanliness across the whole repo — PASS

Global suite: `{"tests":79,"passed":79,"assertions":175}` — **79/79**, 175
assertions, no regressions, no skipped/failed, no deprecation warnings. (Pest
totals identical between feature-only and full-suite runs.)

Scope of the QA change (git):
- Only **2 files** modified in working tree:
  - `app/Validation/PageContentRules.php`
  - `tests/Feature/PageContentValidationTest.php`
- Nothing staged, **nothing committed, nothing pushed**; branch `staging`, HEAD `60608ef`, unchanged.
- Untracked files `qlinqs-estrutura-banco.{md,png}` + `qlinqs-estrutura-de-dados.md` are Renato's pre-existing docs — left alone.

---

## Section 4 — Persistence semantics (nested kept / top-level dropped) — PASS

Live probe, then readback:

- PUT valid trio **with** `blocks[0].items[0]` carrying an extra nested field `note` AND a top-level decoy `hack` → **200**; readback shows the nested `note` is **kept verbatim** (arr-wildcard rule from `PageContentRules`), while the **top-level `hack` is dropped** (Arr::only / `Arr::only($request->all(), [...])` on the controller persists only documented root keys). ✓
- Atomic regression: atomic block + valid overrides → readback keeps block, drops unknown root keys. ✓

Both match the doc's §5 "nested unknown keys preserved; unknown top-level keys dropped".

---

## Section 5 — Doc accuracy (§2 / §4 / §5 of API-MAPPING.md) — PASS

Grep of `docs/API-MAPPING.md`:

- **No stale lines** claiming containers are rejected / "post-v1" / "containers don't exist". `grep -i "container"` against §2/§4/§5 shows only the updated container-accepting rules. ✓
- Enum sets in doc match code constants exactly:
  - `kind` enum `["atomic","container"]` §2
  - container `type` enum `["carousel","grid"]` §4/§5
  - `carousel` `config.size` enum `["large","small"]`; `grid` `config.columns` enum `[2,3]` §5
- The doc's §5 clearly states: containers accept `config`/`items`; items are cards with **image required**; containers never contain containers; container blocks have no `layout`/`hidden` requirement. This matches `PageContentRules` byte-for-byte semantics (verified against the live app above).

No doc inaccuracies found.

---

## Section 6 — Executed scope — PASS

- Only reading/live-probing; **no code, no doc, no git writes** by QA.
- Restored `teste` page content to a valid atomic-only page (single atomic link block, factory-style) after probes; verified the final state is a valid atomic page (200).
- No QA temp files left: `/tmp/qa_*` and payload files were removed.
- Nothing committed or pushed; `git status` clean except the 2 modified files + Renato's pre-existing untracked docs.

---

## Verdict

**PASS** — container blocks (carousel/grid) are accepted exactly as documented;
validation rejects every invalid case (config misuse, missing image, nested
containers, unknown types/kinds) with the correct 422 and error keys; atomic
behavior is a strict regression (all 12 atomic it() blocks still green); doc
§2/§4/§5 are accurate against code.
