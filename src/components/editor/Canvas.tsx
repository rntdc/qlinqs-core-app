"use client";

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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Block, Card } from "@/lib/types";
import { BlockRow } from "./BlockRow";
import { ContainerRow } from "./ContainerRow";

export function Canvas({
  blocks,
  selectedBlockId,
  selectedItemId,
  onSelect,
  onSelectItem,
  onDelete,
  onDuplicate,
  onReorder,
  onAddItem,
  onDuplicateItem,
  onDeleteItem,
  onReorderItems,
  onPickerOpenChange,
}: {
  blocks: Block[];
  selectedBlockId: string | null;
  selectedItemId: string | null;
  onSelect: (id: string) => void;
  onSelectItem: (blockId: string, itemId: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (blocks: Block[]) => void;
  onAddItem: (blockId: string) => void;
  onDuplicateItem: (blockId: string, itemId: string) => void;
  onDeleteItem: (blockId: string, itemId: string) => void;
  onReorderItems: (blockId: string, items: Card[]) => void;
  onPickerOpenChange: (open: boolean) => void;
}) {
  // KeyboardSensor + sortableKeyboardCoordinates makes reordering possible
  // without a mouse: Tab to a drag handle, Space to pick up, arrow keys to
  // move, Space to drop. This top-level DndContext only ever tracks block
  // ids — a container's own items live in a separate, nested DndContext
  // (see ContainerRow), so the two never interfere with each other.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  return (
    <section
      data-testid="canvas"
      className={`flex flex-col rounded-2xl border border-zinc-200 bg-white ${
        blocks.length === 0 ? "min-h-[180px]" : "min-h-[400px]"
      }`}
    >
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">Blocos</h2>
        <p className="text-xs text-zinc-500">
          {blocks.length} {blocks.length === 1 ? "bloco" : "blocos"}
        </p>
      </div>

      {blocks.length === 0 ? (
        <div
          data-testid="canvas-empty-state"
          className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-6 text-center"
        >
          <p className="text-xs font-medium text-zinc-900">
            Nenhum bloco ainda
          </p>
          <p className="max-w-[200px] text-[11px] text-zinc-500">
            Adicione um link, um CTA de WhatsApp ou outro bloco.
          </p>
          <button
            type="button"
            data-testid="canvas-empty-state-cta"
            onClick={() => onPickerOpenChange(true)}
            className="mt-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Adicionar bloco
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((block) => block.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex-1">
              {blocks.map((block) =>
                block.kind === "container" ? (
                  <ContainerRow
                    key={block.id}
                    block={block}
                    selected={block.id === selectedBlockId && !selectedItemId}
                    selectedItemId={
                      block.id === selectedBlockId ? selectedItemId : null
                    }
                    onSelectContainer={() => onSelect(block.id)}
                    onSelectItem={(itemId) => onSelectItem(block.id, itemId)}
                    onDelete={() => onDelete(block.id)}
                    onDuplicate={() => onDuplicate(block.id)}
                    onAddItem={() => onAddItem(block.id)}
                    onDuplicateItem={(itemId) =>
                      onDuplicateItem(block.id, itemId)
                    }
                    onDeleteItem={(itemId) => onDeleteItem(block.id, itemId)}
                    onReorderItems={(items) => onReorderItems(block.id, items)}
                  />
                ) : (
                  <BlockRow
                    key={block.id}
                    block={block}
                    selected={block.id === selectedBlockId}
                    onSelect={() => onSelect(block.id)}
                    onDelete={() => onDelete(block.id)}
                    onDuplicate={() => onDuplicate(block.id)}
                  />
                ),
              )}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
