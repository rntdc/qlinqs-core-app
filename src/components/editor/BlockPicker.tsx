"use client";

import { useEffect, useRef } from "react";
import { blockPresets, type BlockPreset } from "@/lib/editor/presets";
import { PlusIcon } from "./icons";

/**
 * The one block picker in the editor. Persistent left rail from `xl`
 * (1280px) up — below that (including the `lg` 1024-1279 range where the
 * canvas+panel+preview three-column layout already applies) it stays in
 * drawer/FAB mode, because a fixed 200px rail plus the canvas+panel+preview
 * columns don't fit under ~1280px without forcing horizontal scroll. Both
 * the canvas/preview empty-state CTAs and the mobile/narrow-desktop trigger
 * drive the same `open` state: below `xl` that toggles the drawer, at `xl`+
 * the rail is already visible so "opening" it just moves keyboard focus to
 * the first preset instead of toggling anything.
 */
export function BlockPicker({
  open,
  onOpenChange,
  onAddPreset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPreset: (preset: BlockPreset) => void;
}) {
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) firstOptionRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  function handlePick(preset: BlockPreset) {
    onAddPreset(preset);
    onOpenChange(false);
  }

  return (
    <>
      <button
        type="button"
        data-testid="block-picker-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Adicionar bloco"
        onClick={() => onOpenChange(true)}
        // z-40: strictly above PanelShell's mobile bottom sheet (z-30), so
        // the trigger to add a block is never trapped underneath an open
        // edit panel — it stays reachable even while editing (frontend-qa
        // flagged the sheet covering this button in an earlier round).
        className="fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 xl:hidden"
      >
        <PlusIcon />
      </button>

      {open ? (
        <button
          type="button"
          aria-label="Fechar"
          tabIndex={-1}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-30 cursor-default bg-black/30 xl:hidden"
        />
      ) : null}

      <aside
        data-testid="block-picker"
        aria-label="Adicionar bloco"
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 -translate-x-full flex-col overflow-y-auto border-r border-zinc-200 bg-white transition-transform duration-200 xl:sticky xl:top-4 xl:bottom-auto xl:left-auto xl:z-auto xl:h-[calc(100vh-2rem)] xl:w-[200px] xl:shrink-0 xl:translate-x-0 xl:rounded-2xl xl:border xl:shadow-sm ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Adicionar bloco
          </h2>
          <p className="text-xs text-zinc-500">
            Escolha um bloco para sua página
          </p>
        </div>
        <div className="flex flex-col py-1">
          {blockPresets.map((preset, index) => (
            <button
              key={preset.id}
              ref={index === 0 ? firstOptionRef : undefined}
              type="button"
              data-testid={`add-block-option-${preset.id}`}
              onClick={() => handlePick(preset)}
              className="flex flex-col items-start px-4 py-2.5 text-left hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
            >
              <span className="text-sm font-medium text-zinc-900">
                {preset.label}
              </span>
              <span className="text-xs text-zinc-500">{preset.hint}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
