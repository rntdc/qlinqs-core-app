"use client";

import { useEffect, useRef } from "react";
import { blockPresets, type BlockPreset } from "@/lib/editor/presets";
import { PlusIcon } from "./icons";

/**
 * The one block picker in the editor. On desktop it's a persistent left
 * rail (always visible, "always at hand" next to the canvas) — on narrow
 * screens it's a slide-over drawer with its own floating trigger. Both the
 * canvas/preview empty-state CTAs and the mobile trigger drive the same
 * `open` state: on mobile that toggles the drawer, on desktop the rail is
 * already visible so "opening" it just moves keyboard focus to the first
 * preset instead of toggling anything.
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
        className="fixed right-4 bottom-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:hidden"
      >
        <PlusIcon />
      </button>

      {open ? (
        <button
          type="button"
          aria-label="Fechar"
          tabIndex={-1}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-30 cursor-default bg-black/30 lg:hidden"
        />
      ) : null}

      <aside
        data-testid="block-picker"
        aria-label="Adicionar bloco"
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 -translate-x-full flex-col overflow-y-auto border-r border-zinc-200 bg-white transition-transform duration-200 lg:sticky lg:top-4 lg:bottom-auto lg:left-auto lg:z-auto lg:h-[calc(100vh-2rem)] lg:w-[220px] lg:shrink-0 lg:translate-x-0 lg:rounded-2xl lg:border lg:shadow-sm ${
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
