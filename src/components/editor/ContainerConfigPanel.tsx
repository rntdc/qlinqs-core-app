"use client";

import type { ContainerBlock } from "@/lib/types";
import { PanelShell } from "./PanelShell";

const COLUMN_OPTIONS = [2, 3] as const;
const SIZE_OPTIONS = [
  { value: "large" as const, label: "Grande" },
  { value: "small" as const, label: "Pequeno" },
];

/**
 * The container's own config (§5.2): `size` for carousel, `columns` for
 * grid. Containers have no `card`/`overrides`/`hidden` of their own — it's
 * a layout wrapper, so this panel only ever shows the one config knob.
 */
export function ContainerConfigPanel({
  block,
  onUpdateBlock,
  onClose,
}: {
  block: ContainerBlock;
  onUpdateBlock: (block: ContainerBlock) => void;
  onClose: () => void;
}) {
  return (
    <PanelShell
      eyebrow="Editando"
      title={block.type === "carousel" ? "Carousel" : "Grid"}
      onClose={onClose}
    >
      {block.type === "carousel" ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-700">
            Tamanho dos cards
          </p>
          <div data-testid="container-config-size" className="flex gap-1">
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-testid={`container-config-size-${opt.value}`}
                aria-pressed={block.config.size === opt.value}
                onClick={() =>
                  onUpdateBlock({ ...block, config: { size: opt.value } })
                }
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  block.config.size === opt.value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-zinc-300 bg-white text-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-700">Colunas</p>
          <div data-testid="container-config-columns" className="flex gap-1">
            {COLUMN_OPTIONS.map((columns) => (
              <button
                key={columns}
                type="button"
                data-testid={`container-config-columns-${columns}`}
                aria-pressed={block.config.columns === columns}
                onClick={() => onUpdateBlock({ ...block, config: { columns } })}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  block.config.columns === columns
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-zinc-300 bg-white text-zinc-600"
                }`}
              >
                {columns}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        {block.items.length} {block.items.length === 1 ? "item" : "itens"} —
        edite cada card clicando nele na lista do canvas.
      </p>
    </PanelShell>
  );
}
