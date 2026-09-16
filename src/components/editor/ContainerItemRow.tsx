"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/lib/types";
import { hasRequiredImage } from "@/lib/editor/fields";
import { DuplicateIcon, GripIcon, TrashIcon } from "./icons";

/**
 * One item row inside an expanded container. Its drag handle belongs to
 * the container's OWN nested `DndContext` (rendered by `ContainerRow`),
 * completely independent from the top-level block list's `DndContext` in
 * `Canvas` — different provider, different id space, so the two never fight.
 */
export function ContainerItemRow({
  item,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  item: Card;
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
    id: item.id as string,
  });

  const label = item.title || item.label || "Item";
  const imageOk = hasRequiredImage(item);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid={`container-item-${item.id}`}
      data-selected={selected}
      className={`flex items-center gap-2 border-b border-zinc-100 px-2 py-2 last:border-b-0 ${
        selected ? "bg-indigo-50" : "bg-white"
      } ${isDragging ? "relative z-10 opacity-90 shadow-lg" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        data-testid={`item-drag-handle-${item.id}`}
        aria-label={`Reordenar item: ${label}`}
        className="flex h-7 w-5 shrink-0 touch-none items-center justify-center rounded text-zinc-400 hover:text-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 active:cursor-grabbing"
      >
        <GripIcon />
      </button>

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="min-w-0 flex-1 rounded px-1 py-0.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        <p className="truncate text-xs font-medium text-zinc-900">{label}</p>
        {!imageOk ? (
          <p
            data-testid={`item-image-error-${item.id}`}
            className="truncate text-[11px] text-red-600"
          >
            Falta imagem
          </p>
        ) : null}
      </button>

      <button
        type="button"
        onClick={onDuplicate}
        data-testid={`item-duplicate-${item.id}`}
        aria-label={`Duplicar item: ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        <DuplicateIcon />
      </button>

      <button
        type="button"
        onClick={onDelete}
        data-testid={`item-delete-${item.id}`}
        aria-label={`Excluir item: ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
