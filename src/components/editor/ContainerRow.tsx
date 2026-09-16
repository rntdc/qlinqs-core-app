"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card, ContainerBlock } from "@/lib/types";
import { hasRequiredImage } from "@/lib/editor/fields";
import { describeBlock } from "@/lib/editor/presets";
import {
  ChevronDownIcon,
  DuplicateIcon,
  GripIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from "./icons";
import { ContainerItemRow } from "./ContainerItemRow";

/**
 * A container's canvas row: its own drag handle (bound to the top-level
 * `DndContext` in `Canvas`, same as any `BlockRow`) plus an expandable body
 * with a SEPARATE, nested `DndContext`/`SortableContext` for its items.
 * The two never fight — they're different React providers over different
 * id spaces (block ids vs. item ids), each with its own Pointer+Keyboard
 * sensors, so top-level reorder and item reorder are fully independent.
 */
export function ContainerRow({
  block,
  selected,
  selectedItemId,
  onSelectContainer,
  onSelectItem,
  onDelete,
  onDuplicate,
  onAddItem,
  onDuplicateItem,
  onDeleteItem,
  onReorderItems,
}: {
  block: ContainerBlock;
  selected: boolean;
  selectedItemId: string | null;
  onSelectContainer: () => void;
  onSelectItem: (itemId: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddItem: () => void;
  onDuplicateItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (items: Card[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);

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

  // While this container itself is the block being dragged (top-level
  // reorder, pointer or keyboard), force it collapsed: an expanded body can
  // make this row's rect tall enough to confuse dnd-kit's collision
  // detection for the sibling it's supposed to land next to. Restores the
  // user's actual toggle state the instant the drag ends.
  const showExpanded = expanded && !isDragging;

  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = block.items.findIndex((item) => item.id === active.id);
    const newIndex = block.items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderItems(arrayMove(block.items, oldIndex, newIndex));
  }

  const label = describeBlock(block);
  const invalidCount = block.items.filter(
    (item) => !hasRequiredImage(item),
  ).length;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid={`canvas-block-${block.id}`}
      data-selected={selected}
      className={`border-b border-zinc-200 last:border-b-0 ${isDragging ? "relative z-10 opacity-90 shadow-lg" : ""}`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2.5 ${selected ? "bg-indigo-50" : "bg-white"}`}
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
          data-testid={`container-toggle-${block.id}`}
          aria-expanded={expanded}
          aria-label={expanded ? "Recolher container" : "Expandir container"}
          onClick={() => setExpanded((value) => !value)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <ChevronDownIcon expanded={expanded} />
        </button>

        <button
          type="button"
          onClick={onSelectContainer}
          aria-pressed={selected}
          className="min-w-0 flex-1 rounded px-1 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <span className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-zinc-900">
              {label}
            </p>
            {invalidCount > 0 ? (
              <span
                data-testid={`container-invalid-badge-${block.id}`}
                className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600"
              >
                <WarningIcon />
                {invalidCount} sem imagem
              </span>
            ) : null}
          </span>
          <p className="truncate text-xs text-zinc-500">
            {block.items.length} {block.items.length === 1 ? "item" : "itens"}
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
      </div>

      {showExpanded ? (
        <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2">
          {block.items.length === 0 ? (
            <div
              data-testid={`container-empty-state-${block.id}`}
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-xs font-medium text-zinc-700">
                Nenhum item ainda
              </p>
              <button
                type="button"
                data-testid={`container-empty-state-cta-${block.id}`}
                onClick={onAddItem}
                className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Adicionar item
              </button>
            </div>
          ) : (
            <DndContext
              sensors={itemSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleItemDragEnd}
            >
              <SortableContext
                items={block.items.map((item) => item.id as string)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                  {block.items.map((item) => (
                    <ContainerItemRow
                      key={item.id}
                      item={item}
                      selected={item.id === selectedItemId}
                      onSelect={() => onSelectItem(item.id as string)}
                      onDelete={() => onDeleteItem(item.id as string)}
                      onDuplicate={() => onDuplicateItem(item.id as string)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {block.items.length > 0 ? (
            <button
              type="button"
              data-testid={`container-add-item-${block.id}`}
              onClick={onAddItem}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              <PlusIcon />
              Adicionar item
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
