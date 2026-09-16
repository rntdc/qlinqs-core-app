"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AtomicBlock } from "@/lib/types";
import { describeBlock } from "@/lib/editor/presets";
import { DuplicateIcon, EyeOffIcon, GripIcon, TrashIcon } from "./icons";

/**
 * One row in the canvas list. The drag handle carries dnd-kit's sortable
 * `attributes`/`listeners`, which wire up both pointer drag AND the
 * KeyboardSensor (focus the handle, Space to pick up, arrow keys to move,
 * Space again to drop) — no separate keyboard affordance needed.
 */
export function BlockRow({
  block,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  block: AtomicBlock;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
  });

  const label = describeBlock(block);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid={`canvas-block-${block.id}`}
      data-selected={selected}
      className={`flex items-center gap-2 border-b border-zinc-200 px-3 py-2.5 last:border-b-0 ${
        selected ? "bg-indigo-50" : "bg-white"
      } ${isDragging ? "relative z-10 opacity-90 shadow-lg" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        data-testid={`drag-handle-${block.id}`}
        aria-label={`Reordenar bloco: ${label}`}
        className="flex h-8 w-6 shrink-0 touch-none items-center justify-center rounded text-zinc-400 hover:text-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 active:cursor-grabbing"
      >
        <GripIcon />
      </button>

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="min-w-0 flex-1 rounded px-1 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        <span className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-zinc-900">{label}</p>
          {block.hidden ? (
            <span
              data-testid={`hidden-badge-${block.id}`}
              className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500"
            >
              <EyeOffIcon />
              Oculto
            </span>
          ) : null}
        </span>
        <p className="truncate text-xs text-zinc-500">
          {block.card.title || block.card.description || "Sem conteúdo"}
        </p>
      </button>

      <button
        type="button"
        onClick={onDuplicate}
        data-testid={`duplicate-block-${block.id}`}
        aria-label={`Duplicar bloco: ${label}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        <DuplicateIcon />
      </button>

      <button
        type="button"
        onClick={onDelete}
        data-testid={`delete-block-${block.id}`}
        aria-label={`Excluir bloco: ${label}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
