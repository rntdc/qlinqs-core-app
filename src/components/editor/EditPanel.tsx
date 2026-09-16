"use client";

import type {
  AtomicBlock,
  BlockDefaults,
  Card,
  CardOverrides,
  LinkLayout,
  Palette,
} from "@/lib/types";
import {
  cardFieldsFor,
  hidesColorOverrides,
  styleControlsFor,
} from "@/lib/editor/fields";
import { CardFieldsEditor } from "./CardFieldsEditor";
import { OverridesPanel } from "./OverridesPanel";
import { PanelShell } from "./PanelShell";

const LINK_LAYOUTS: { value: LinkLayout; label: string }[] = [
  { value: "button", label: "Botão" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "background", label: "Fundo" },
  { value: "featured", label: "Destaque" },
];

const LINK_LAYOUT_TITLES: Record<LinkLayout, string> = {
  button: "Link (Button)",
  thumbnail: "Link (Thumbnail)",
  background: "Link (Image Background)",
  featured: "Link (Featured)",
};

/**
 * Opens when an atomic block is selected (reuses the Batch A `data-selected`
 * hook). Edits `card` fields for the block's CURRENT type/layout, its
 * `hidden` flag, and (via OverridesPanel) its `card.overrides`. Switching a
 * link block's layout never touches `card` — every field stays, hidden or
 * not, so switching back shows it again. Grouped Layout → Content → Link →
 * Style, with only the fields the current layout actually uses.
 */
export function EditPanel({
  block,
  palette,
  blockDefaults,
  onUpdateBlock,
  onClose,
}: {
  block: AtomicBlock;
  palette: Palette;
  blockDefaults: BlockDefaults;
  onUpdateBlock: (block: AtomicBlock) => void;
  onClose: () => void;
}) {
  function updateCard(patch: Partial<Card>) {
    onUpdateBlock({ ...block, card: { ...block.card, ...patch } });
  }

  function changeOverride(
    field: keyof CardOverrides,
    value: CardOverrides[keyof CardOverrides],
  ) {
    const overrides: CardOverrides = { ...block.card.overrides };
    if (value === undefined) {
      delete overrides[field];
    } else {
      (overrides as Record<string, unknown>)[field] = value;
    }
    updateCard({ overrides });
  }

  const fields = cardFieldsFor(block.type, block.layout);
  const contentFields = fields.filter((f) => f !== "link");
  const hasLinkField = fields.includes("link");
  const controls = styleControlsFor(block.type, block.layout);
  const hideColor = hidesColorOverrides(block.type, block.layout);
  const isFeatured = block.type === "link" && block.layout === "featured";

  const title =
    block.type === "link"
      ? (LINK_LAYOUT_TITLES[block.layout as LinkLayout] ?? "Link")
      : block.type;

  return (
    <PanelShell eyebrow="Editando" title={title} onClose={onClose}>
      <label className="mb-4 flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5">
        <span className="text-sm font-medium text-zinc-700">
          Ocultar na página
        </span>
        <input
          data-testid="hidden-toggle"
          type="checkbox"
          checked={block.hidden}
          onChange={(e) =>
            onUpdateBlock({ ...block, hidden: e.target.checked })
          }
          className="h-4 w-4"
        />
      </label>

      {block.type === "link" ? (
        <div className="mb-5">
          <p className="mb-1.5 text-xs font-medium text-zinc-700">Layout</p>
          <div data-testid="layout-switcher" className="grid grid-cols-2 gap-1">
            {LINK_LAYOUTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-testid={`layout-option-${opt.value}`}
                aria-pressed={block.layout === opt.value}
                onClick={() => onUpdateBlock({ ...block, layout: opt.value })}
                className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  block.layout === opt.value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-zinc-300 bg-white text-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isFeatured ? <FeaturedExample palette={palette} /> : null}

      {contentFields.length > 0 ? (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Conteúdo
          </p>
          <CardFieldsEditor
            card={block.card}
            fields={contentFields}
            onChange={updateCard}
          />
        </div>
      ) : null}

      {hasLinkField ? (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Link
          </p>
          <CardFieldsEditor
            card={block.card}
            fields={["link"]}
            onChange={updateCard}
          />
        </div>
      ) : null}

      <div className="border-t border-zinc-200 pt-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Estilo
        </p>
        <OverridesPanel
          overrides={block.card.overrides}
          blockDefaults={blockDefaults}
          palette={palette}
          hideColor={hideColor}
          showAlign={controls.align}
          showSize={controls.size}
          showImagePosition={controls.imagePosition}
          onChangeOverride={changeOverride}
        />
      </div>
    </PanelShell>
  );
}

/**
 * Illustrative only — a filled-in mock of what a Featured card can become,
 * shown above the (mostly empty, by design) real fields so the user isn't
 * staring at a blank form. Uses the page's actual palette so it reads as a
 * preview of *this* page's look, not saved data.
 */
function FeaturedExample({ palette }: { palette: Palette }) {
  return (
    <div className="mb-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-3">
      <p className="mb-2 text-[11px] font-medium text-zinc-500">
        O card cresce conforme você preenche — veja um exemplo:
      </p>
      <div
        data-testid="featured-example"
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: palette.surface, color: palette.onSurface }}
      >
        <div
          className="flex h-20 items-center justify-center text-2xl"
          style={{ backgroundColor: `${palette.accent}1A` }}
        >
          🌟
        </div>
        <div className="p-2.5">
          <p className="text-xs font-medium">Nome do produto</p>
          <p className="mt-0.5 text-[11px] opacity-70">
            Uma frase curta que explica o que é.
          </p>
          <div
            className="mt-1.5 inline-block rounded-full px-2.5 py-1 text-[10px] font-medium"
            style={{ backgroundColor: palette.accent, color: palette.onAccent }}
          >
            Comprar agora
          </div>
        </div>
      </div>
    </div>
  );
}
