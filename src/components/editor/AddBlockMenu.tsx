"use client";

import { blockPresets, type BlockPreset } from "@/lib/editor/presets";
import { PlusIcon } from "./icons";

/**
 * The one full block picker in the editor. Controlled from the page so both
 * the canvas header trigger AND the canvas/preview empty-state CTAs can
 * open the same picker (one `add-block-menu` in the DOM, never duplicated).
 */
export function AddBlockMenu({
  open,
  onOpenChange,
  onAddPreset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPreset: (preset: BlockPreset) => void;
}) {
  function handlePick(preset: BlockPreset) {
    onAddPreset(preset);
    onOpenChange(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="add-block-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <PlusIcon />
        Adicionar bloco
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fechar"
            tabIndex={-1}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            data-testid="add-block-menu"
            className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
          >
            {blockPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                data-testid={`add-block-option-${preset.id}`}
                onClick={() => handlePick(preset)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
              >
                <span className="text-sm font-medium text-zinc-900">
                  {preset.label}
                </span>
                <span className="text-xs text-zinc-500">{preset.hint}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
