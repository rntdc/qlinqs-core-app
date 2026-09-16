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
  { value: "featured", label: "Destaque" },
];

/**
 * Opens when an atomic block is selected (reuses the Batch A `data-selected`
 * hook). Edits `card` fields for the block's CURRENT type/layout, its
 * `hidden` flag, and (via OverridesPanel) its `card.overrides`. Switching a
 * link block's layout never touches `card` — every field stays, hidden or
 * not, so switching back shows it again.
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
  const controls = styleControlsFor(block.type, block.layout);
  const hideColor = hidesColorOverrides(block.type, block.layout);

  const label =
    block.type === "link"
      ? ({
          button: "Link (Button)",
          thumbnail: "Link (Thumbnail)",
          featured: "Link (Featured)",
        }[block.layout as LinkLayout] ?? "Link")
      : block.type;

  return (
    <PanelShell eyebrow="Editando" title={label} onClose={onClose}>
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
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-medium text-zinc-700">Layout</p>
          <div data-testid="layout-switcher" className="flex gap-1">
            {LINK_LAYOUTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-testid={`layout-option-${opt.value}`}
                aria-pressed={block.layout === opt.value}
                onClick={() => onUpdateBlock({ ...block, layout: opt.value })}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
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

      <div className="mb-6">
        <CardFieldsEditor
          card={block.card}
          fields={fields}
          onChange={updateCard}
        />
      </div>

      <div className="border-t border-zinc-200 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Estilo
        </p>
        <OverridesPanel
          overrides={block.card.overrides}
          blockDefaults={blockDefaults}
          palette={palette}
          hideColor={hideColor}
          showAlign={controls.align}
          showSize={controls.size}
          onChangeOverride={changeOverride}
        />
      </div>
    </PanelShell>
  );
}
